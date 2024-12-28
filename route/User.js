const express = require("express");

const userMiddleware = require("../middleware/userMiddleware.js");
const { signupUser, loginUser , updateUser} = require("../Controller/userController.js");
const router = express.Router();
router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/update", userMiddleware, updateUser);

module.exports = router;