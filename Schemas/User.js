const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "Anonymous" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String, default: null },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  forms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }] // References the Form model
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.oldpassword = this.password;
  this.password = hashedPassword;
  
  console.log("Password hashed before saving", this.password);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    console.log("Candidate password", candidatePassword);
    console.log("Stored password", this.password);  
    return bcrypt.compare(candidatePassword, this.password);
}

const User = mongoose.model("User", userSchema);
module.exports = User;