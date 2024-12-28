const express = require("express");

const userMiddleware = require("../middleware/userMiddleware.js");

const { saveForm, getUserForms, getFormById, deleteForm } = require("../Controller/formController.js");

const router = express.Router();

router.post("/saveForm", userMiddleware, saveForm);
router.get("/getUserForms", userMiddleware, getUserForms);
router.get("/getFormById/:formId", userMiddleware, getFormById);
router.delete("/deleteForm/:formId", userMiddleware, deleteForm);

module.exports = router;