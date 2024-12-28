const express = require("express");

const {
  createWorkspace,
  getUserWorkspaces,
  shareWorkspace,
  createFolder,
  deleteFolder,
  createTypebot,
  deleteTypebot,
} = require("../Controller/workspaceController");
const userMiddleware = require("../middleware/userMiddleware");
const router = express.Router();

router.use(userMiddleware);

// Workspace routes
router.post("/create", createWorkspace);
router.get("/get", getUserWorkspaces);

router.post("/share", shareWorkspace);

// Folder routes
router.post("/:workspaceId/folders", createFolder);

router.delete("/:workspaceId/folders/:folderId", deleteFolder);

// Typebot routes
router.post("/:workspaceId/folders/:folderId/typebots", createTypebot);

router.delete(
  "/:workspaceId/folders/:folderId/typebots/:formId",
  deleteTypebot
);

module.exports = router;

// const {
//   createWorkspace,
//   shareWorkspace,
//   // getWorkspace,
//   // getSharedWorkspaces,
// } = require('../Controller/workspaceController');

//  updateFolder,
// updateWorkspace,
// deleteWorkspace,
//  updateTypebot,

// router.put('/:workspaceId', updateWorkspace);
// router.delete('/:workspaceId', deleteWorkspace);
// router.post('/:workspaceId/share', shareWorkspace);

// router.put('/:workspaceId/folders/:folderId', updateFolder);

// router.put('/:workspaceId/typebots/:formId', updateTypebot);

// // Route to create a new workspace
// router.post('/create', createWorkspace);

// // Route to share a workspace with a user
// router.post('/share', shareWorkspace);

// // Route to fetch a specific workspace by ID
// // router.get('/:workspaceId', getWorkspace);

// // Route to fetch all shared workspaces for a user

// // router.get('/shared/:userId', userMiddleware, getSharedWorkspaces);
