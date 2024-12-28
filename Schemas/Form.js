const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
  formName: { type: String, required: true, default: "Untitled Form" },
  elements: { type: Array, required: true, default: [] }, // Store form elements
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user who created the form
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  sharedWith: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      permission: { type: String, enum: ["view", "edit"], required: true },
    }
  ],
  versions: [
    {
      elements: { type: Array, required: true },
      updatedAt: { type: Date, default: Date.now },
    }
  ],
});

// Middleware to update timestamps
formSchema.pre("save", function (next) {
  if (!this.createdAt) this.createdAt = Date.now();
  this.updatedAt = Date.now();
  next();
});

// Add indexes
formSchema.index({ userId: 1 });
formSchema.index({ workspaceId: 1 });

const Form = mongoose.model("Form", formSchema);
module.exports = Form;
