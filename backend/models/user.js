import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  displayName: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      console.error("Error hashing password:", error);
      throw error;
    }
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!candidatePassword || !this.password) {
      console.error("Missing password for comparison");
      return false;
    }
    console.log("Comparing passwords");
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password comparison result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

const User = mongoose.model("User", userSchema);
export default User;
