const jwt = require("jsonwebtoken");
const User = require("../Schemas/User");


const userMiddleware = async (req, res, next) => {
    try {
      let token;
      if (req.body.token) {
        token = req.body.token;
      } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }
      console.log("Received token:", token);
      if (!token) {
        console.error("No token found in request");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log("Decoded Token:", decoded);
      req.userId = decoded.id;
      console.log("Token expiry time:", decoded.exp);
       const user = await User.findById(decoded.id);
       console.log("Decoded User ID from Token:", decoded.id);
      //  console.log("User ID from Middleware:", req.user.id);
       
      if (!user) {
      console.error("User not found for token ID:", decoded.id);
      return res.status(401).json({ error: "Please authenticate." });
      }
      req.user = { id: user._id, email: user.email };

      next();
    } catch (err) {
      console.error("JWT verification failed:", err);
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ error: "Token expired. Please log in again." });
      } else if (err.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ error: "Invalid token. Please provide a valid token." });
      } else {
        return res.status(401).json({ error: "Authentication failed." });
      }
    }
};
module.exports = userMiddleware;