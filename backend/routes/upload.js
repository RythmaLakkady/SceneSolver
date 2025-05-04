import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Readable } from "stream";
import User from "../models/user.js";
import Guser from "../models/Guser.js";

dotenv.config();

const router = express.Router();
const mongoURI = process.env.MONGODB_URI;

const conn = mongoose.createConnection(mongoURI);

let gridfsBucket;
conn.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
  console.log("GridFS bucket initialized");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const streamToGridFS = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);

    const uploadStream = gridfsBucket.openUploadStream(options.filename, {
      contentType: options.contentType,
      metadata: options.metadata,
    });

    let fileId = uploadStream.id;

    readableStream.pipe(uploadStream);

    uploadStream.on("error", (error) => {
      reject(error);
    });

    uploadStream.on("finish", () => {
      resolve({
        _id: fileId,
        filename: options.filename,
        contentType: options.contentType,
        metadata: options.metadata,
      });
    });
  });
};

router.post("/", upload.array("files"), async (req, res) => {
  console.log("upload post route reached");

  try {
    if (!gridfsBucket) {
      return res.status(500).json({ error: "GridFS not initialized" });
    }

    const files = req.files;
    const { email, caseName, caseResult } = req.body;

    console.log("Files received:", files.length);
    console.log("Uploaded by user:", email);

    const user =
      (await User.findOne({ email })) || (await Guser.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const uId = user._id;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const images = files.filter((f) => f.mimetype.startsWith("image"));
    const videos = files.filter((f) => f.mimetype.startsWith("video"));

    if (
      (images.length > 0 && images.length < 4) ||
      (images.length === 0 && videos.length !== 1)
    ) {
      return res
        .status(400)
        .json({ error: "Must upload at least 4 images or 1 video" });
    }

    const uploadPromises = files.map((file) =>
      streamToGridFS(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        metadata: {
          userId: uId,
          caseName: caseName,
          caseResult: JSON.parse(caseResult),
          type: file.mimetype.startsWith("video") ? "video" : "image",
        },
      })
    );

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

router.get("/user", async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).json({ error: "GridFS not initialized" });
    }

    const { email } = req.query;

    const user =
      (await User.findOne({ email })) || (await Guser.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const uId = user._id;

    const query = {
      "metadata.userId": uId,
    };

    const cursor = conn.db.collection("uploads.files").find(query);

    const files = await cursor.toArray();

    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).send("Server error");
  }
});

router.get("/user/case", async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).json({ error: "GridFS not initialized" });
    }

    const { email, caseName } = req.query;

    const user =
      (await User.findOne({ email })) || (await Guser.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const uId = user._id;

    const query = {
      "metadata.userId": uId,
      "metadata.caseName": caseName,
    };

    const cursor = conn.db.collection("uploads.files").find(query);

    const files = await cursor.toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ error: "No files found for this case" });
    }

    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).send("Server error");
  }
});

router.get("/file/:id", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const file = await conn.db
      .collection("uploads.files")
      .findOne({ _id: fileId });

    if (!file) return res.status(404).json({ error: "File not found" });

    const downloadStream = gridfsBucket.openDownloadStream(fileId);
    res.set("Content-Type", file.contentType);
    downloadStream.pipe(res);
  } catch (error) {
    console.error("File fetch error:", error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

export default router;
