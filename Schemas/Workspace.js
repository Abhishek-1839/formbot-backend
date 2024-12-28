const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  forms: [
    {
      title: { type: String, required: true },
      fields: [String], // For simplicity, we’ll store fields as an array of strings
    }
  ],
  folders: [
    {
      name: { type: String, required: true },
      forms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }],
    }
  ],
  sharedWith: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permission: { type: String, enum: ['view', 'edit'], required: true },
    }
  ]
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
