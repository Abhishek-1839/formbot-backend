const Workspace = require("../Schemas/Workspace"); // Note: Changed from User to Workspace
const User = require("../Schemas/User");

exports.createWorkspace = async (req, res) => {
  const { name } = req.body;
  const owner = req.user.id; // Get owner from authenticated user

  try {
    // Create workspace
    const workspace = new Workspace({
      name,
      owner,
      forms: [],
      folders: [],
      sharedWith: [],
    });

    await workspace.save();

    // Add workspace to user's workspaces array
    await User.findByIdAndUpdate(owner, {
      $push: { workspaces: workspace._id },
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    res
      .status(500)
      .json({ message: "Error creating workspace", error: error.message });
  }
};

exports.getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get workspaces owned by user and shared with user
    const workspaces = await Workspace.find({
      $or: [{ owner: userId }, { "sharedWith.user": userId }],
    })
      .populate("owner", "name email")
      .populate("sharedWith.user", "name email");

    res.status(200).json(workspaces);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    res
      .status(500)
      .json({ message: "Error fetching workspaces", error: error.message });
  }
};

exports.shareWorkspace = async (req, res) => {
  const { workspaceId, email, permission } = req.body;
  const ownerId = req.user.id;

  try {
    console.log("Request to Share Workspace:");
    console.log("Workspace ID:", workspaceId);
    console.log("User Email:", email);
    console.log("Permission:", permission);
    console.log("Requesting User ID (Owner):", ownerId);
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate permission input
    const validPermissions = ["view", "edit"];
    if (!validPermissions.includes(permission)) {
      return res
        .status(400)
        .json({
          message: 'Invalid permission. Allowed values are "view" or "edit".',
        });
    }

    // Find workspace and verify ownership
    const workspace = await Workspace.findById(workspaceId);
    console.log("Workspace Retrieved:", workspace);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    console.log("Workspace Owner:", workspace.owner, typeof workspace.owner);
    console.log("Request User ID (ownerId):", ownerId, typeof ownerId);
    console.log(
      "Comparison Result:",
      workspace.owner.toString() === ownerId.toString()
    );

    if (workspace.owner.toString() !== ownerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to share this workspace" });
    }

    // Find user by email
    const userToShare = await User.findOne({ email });
    console.log("User to Share:", userToShare);
    if (!userToShare) {
      return res.status(404).json({ message: "User not found" });
    }
    const alreadyShared = workspace.sharedWith.some(
      (share) => share.user.toString() === userToShare._id.toString()
    );
    if (alreadyShared) {
      return res
        .status(400)
        .json({ message: "Workspace already shared with this user" });
    }
    // Check if already shared
    const sharedIndex = workspace.sharedWith.findIndex(
      (share) => share.user.toString() === userToShare._id.toString()
    );

    if (sharedIndex !== -1) {
      // Update permission if already shared
      workspace.sharedWith[sharedIndex].permission = permission;
      await workspace.save();
      return res.status(200).json({
        message: "Permission updated successfully",
        workspace,
      });
    }

    // Add new share
    workspace.sharedWith.push({
      user: userToShare._id,
      permission,
    });

    await workspace.save();

    res.status(200).json({
      message: "Workspace shared successfully",
      workspace,
    });
  } catch (error) {
    console.error("Error sharing workspace:", error);
    res
      .status(500)
      .json({ message: "Error sharing workspace", error: error.message });
  }
};

// Folder Operations
exports.createFolder = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { owner: userId },
        { sharedWith: { $elemMatch: { user: userId, permission: "edit" } } },
      ],
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found or unauthorized" });
    }

    workspace.folders.push({ name, forms: [] });
    await workspace.save();

    res.status(201).json(workspace);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating folder", error: error.message });
  }
};


exports.deleteFolder = async (req, res) => {
  try {
    const { workspaceId, folderId } = req.params;
    const userId = req.user.id;

    if (!workspaceId || !folderId) {
      return res.status(400).json({ 
        message: "Missing required parameters", 
        workspaceId: workspaceId || 'missing', 
        folderId: folderId || 'missing' 
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { owner: userId },
        { sharedWith: { $elemMatch: { user: userId, permission: "edit" } } },
      ],
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found or unauthorized" });
    }
    const folderExists = workspace.folders.id(folderId);
    if (!folderExists) {
      return res.status(404).json({ message: "Folder not found" });
    }

  const formsToDelete = folderExists.forms;
    workspace.forms = workspace.forms.filter(form => 
      !formsToDelete.includes(form._id.toString())
    );


    workspace.folders.pull({ _id: folderId });
    await workspace.save();

    res.status(200).json({ 
      message: "Folder deleted successfully",
      workspaceId,
      folderId
    });
  } catch (error) {
    console.error("Error in deleteFolder:", error);
    res.status(500).json({ 
      message: "Error deleting folder", 
      error: error.message 
    });
  }
};

// Typebot Operations
exports.createTypebot = async (req, res) => {
  try {
    const { workspaceId, folderId } = req.params;
    const { title, fields } = req.body;
    const userId = req.user.id;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { owner: userId },
        { sharedWith: { $elemMatch: { user: userId, permission: "edit" } } },
      ],
    });

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found or unauthorized" });
    }

    const folder = workspace.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    workspace.forms.push({ title, fields });
    const newForm = workspace.forms[workspace.forms.length - 1];
    folder.forms.push(newForm._id);
    await workspace.save();

    res.status(201).json(workspace);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating typebot", error: error.message });
  }
};


exports.deleteTypebot = async (req, res) => {
  try {
    const { workspaceId, folderId, formId } = req.params;
    const userId = req.user.id;

    if (!workspaceId || !folderId || !formId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        workspaceId: workspaceId || 'missing',
        folderId: folderId || 'missing',
        formId: formId || 'missing'
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { owner: userId },
        { sharedWith: { $elemMatch: { user: userId, permission: "edit" } } },
      ],
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found or unauthorized" });
    }

    const folder = workspace.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const formExists = workspace.forms.id(formId);
    if (!formExists) {
      return res.status(404).json({ message: "Typebot not found" });
    }

    // Remove form from both folder and forms array
    folder.forms = folder.forms.filter(f => f.toString() !== formId);
    workspace.forms.pull({ _id: formId });
    
    await workspace.save();
    res.status(200).json({ 
      message: "Typebot deleted successfully",
      workspaceId,
      folderId,
      formId
    });
  } catch (error) {
    console.error("Error in deleteTypebot:", error);
    res.status(500).json({ 
      message: "Error deleting typebot", 
      error: error.message 
    });
  }
};


// exports.updateFolder = async (req, res) => {
//   try {
//     const { workspaceId, folderId } = req.params;
//     const { name } = req.body;
//     const userId = req.user.id;

//     const workspace = await Workspace.findOne({
//       _id: workspaceId,
//       $or: [
//         { owner: userId },
//         { 'sharedWith': { $elemMatch: { user: userId, permission: 'edit' } } }
//       ]
//     });

//     if (!workspace) {
//       return res.status(404).json({ message: 'Workspace not found or unauthorized' });
//     }

//     const folder = workspace.folders.id(folderId);
//     if (!folder) {
//       return res.status(404).json({ message: 'Folder not found' });
//     }

//     folder.name = name;
//     await workspace.save();

//     res.status(200).json(workspace);
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating folder', error: error.message });
//   }
// };


// exports.updateTypebot = async (req, res) => {
//   try {
//     const { workspaceId, formId } = req.params;
//     const { title, fields } = req.body;
//     const userId = req.user.id;

//     const workspace = await Workspace.findOne({
//       _id: workspaceId,
//       $or: [
//         { owner: userId },
//         { 'sharedWith': { $elemMatch: { user: userId, permission: 'edit' } } }
//       ]
//     });

//     if (!workspace) {
//       return res.status(404).json({ message: 'Workspace not found or unauthorized' });
//     }

//     const form = workspace.forms.id(formId);
//     if (!form) {
//       return res.status(404).json({ message: 'Typebot not found' });
//     }

//     form.title = title;
//     form.fields = fields;
//     await workspace.save();

//     res.status(200).json(workspace);
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating typebot', error: error.message });
//   }
// };
