import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const guserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now },
});

guserSchema.index({ email: 1, authMethods: 1 });

guserSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    try {
      this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
      console.error("Error hashing password:", error);
      throw error;
    }
  }
  next();
});

guserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw error;
  }
};

guserSchema.methods.addAuthMethod = function (method) {
  if (!this.authMethods.includes(method)) {
    this.authMethods.push(method);
  }
};

const Guser = mongoose.model("Guser", guserSchema);

Guser.collection.dropIndex("email_1").catch(() => {
  console.log("No existing email index to drop");
});

export default Guser;
