import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Readable } from "stream";
import User from "../models/user.js";
import Guser from "../models/Guser.js";
import { MongoClient, ObjectId } from "mongodb";
import axios from "axios";
import FormData from "form-data";

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
    const { email, caseName, caseResult, location, date, crimeTime } = req.body;

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

    let geminiResponse = null;
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a professional crime investigation expert. Analyze the given crime scene data and generate a structured and formal crime scene report. Use the details to explain what likely happened, in clear and straightforward language.

                    Crime Scene Details:
                    - Location: ${location || "Location not provided"}
                    - Date: ${date || "Date not provided"}
                    - Time: ${crimeTime || "Time not provided"}
                    - Analysis Results: ${caseResult}

                    The analysis results include:
                    - predicted_class: the predicted type of crime
                    - crime_confidence: the model's confidence in the prediction
                    - extracted_evidence: a list of visual evidence with description and confidence levels

                    Your output must follow this exact structure:

                    CRIME SCENE INVESTIGATION REPORT
                    ===============================

                    **Case Details:**
                    Location: <location>
                    Date: <date>
                    Time: <time>
                    Crime Type: <predicted_class>
                    Analysis Confidence: <crime_confidence as a percentage>

                    **Physical Evidence Analysis:**
                    <List each piece of evidence with its confidence level and a brief description of its significance>
                    - <evidence_1_description> (Confidence: XX%)
                      Significance: <brief explanation>
                    - <evidence_2_description> (Confidence: XX%)
                      Significance: <brief explanation>
                    ...

                    **Primary Scene Analysis:**
                    <Write a detailed, formal analysis of what likely occurred, supported by the crime type and listed evidence. Use professional terminology and clear wording. Consider the time of the incident in your analysis.>

                    **Alternative Scenario:**
                    <Provide a second plausible explanation that accounts for the same evidence but considers a different sequence of events or motivations. Maintain professional tone.>

                    **Recommendations:**
                    1. <Key investigative step or focus area>
                    2. <Additional evidence collection needed>
                    3. <Other relevant recommendations>

                    ---
                    Note: This report was generated by SceneSolver AI Investigation System.
                    Generated on: ${new Date().toISOString()}
                    ---`,
                  },
                ],
              },
            ],
          }),
        }
      );

      geminiResponse = await geminiRes.json();
      console.log("Gemini response:", geminiResponse);
    } catch (geminiErr) {
      console.error("Gemini API error:", geminiErr);
    }

    const uploadPromises = files.map((file) =>
      streamToGridFS(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        metadata: {
          userId: uId,
          caseName: caseName,
          caseResult:
            typeof caseResult === "string"
              ? JSON.parse(caseResult)
              : caseResult,
          caseSummary: geminiResponse,
          type: file.mimetype.startsWith("video") ? "video" : "image",
          location: location,
          date: date,
          crimeTime: crimeTime,
        },
      })
    );

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
      geminiOutput: geminiResponse,
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

router.post("/add-to-case", upload.array("files"), async (req, res) => {
  try {
    const { email, caseName } = req.body;
    const files = req.files;

    if (!email || !caseName || !files) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user =
      (await User.findOne({ email })) || (await Guser.findOne({ email }));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("caseName", caseName);

    for (const file of files) {
      formData.append("files", Buffer.from(file.buffer), {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    }

    const uploadResponse = await axios.post(
      "http://127.0.0.1:5000/api/upload/add-to-case",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Flask upload response:", uploadResponse.data);

    const reanalysisResponse = await axios.post(
      "http://127.0.0.1:5000/api/upload/reanalyze",
      {
        email,
        caseName,
      }
    );

    console.log("Flask reanalysis response:", reanalysisResponse.data);

    const uploadPromises = files.map((file) =>
      streamToGridFS(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        metadata: {
          userId: user._id,
          email,
          caseName,
          uploadDate: new Date(),
          caseResult: reanalysisResponse.data.result,
        },
      })
    );

    await Promise.all(uploadPromises);

    res.json({
      message: "Files added and reanalyzed successfully",
      uploadResult: uploadResponse.data,
      analysisResult: reanalysisResponse.data,
    });
  } catch (error) {
    console.error("Error in add-to-case:", error.response?.data || error);
    res.status(500).json({
      error:
        error.response?.data?.error || error.message || "Error adding files",
    });
  }
});

router.post("/reanalyze", async (req, res) => {
  try {
    const { email, caseName } = req.body;

    if (!email || !caseName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const flaskResponse = await axios.post(
      "http://127.0.0.1:5000/api/upload/reanalyze",
      {
        email,
        caseName,
      }
    );

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("crimescene");
    const collection = db.collection("cases");

    await collection.updateMany(
      { "metadata.email": email, "metadata.caseName": caseName },
      {
        $set: {
          "metadata.caseResult": flaskResponse.data.result,
          "metadata.lastAnalyzed": new Date(),
        },
      }
    );

    client.close();
    res.json({
      message: "Case reanalyzed successfully",
      result: flaskResponse.data.result,
    });
  } catch (error) {
    console.error("Error reanalyzing case:", error);
    res.status(500).json({ error: "Error reanalyzing case" });
  }
});

export default router;
