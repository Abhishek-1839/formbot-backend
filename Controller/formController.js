const Form = require("../Schemas/Form");
const User = require("../Schemas/User");
require("dotenv").config();

const saveForm = async (req, res) => {
    try {
      const { formName, elements } = req.body;
        const userId = req.userId; // Retrieved from middleware
        if (!userId) return res.status(400).json({ message: "User ID required" });

        const newForm = new Form({
          formName,
          elements,
          userId,
          responses: {} // Initialize empty responses object
        });
    
        // Save the form
        const savedForm = await newForm.save();
    
        // Update user's forms array
        await User.findByIdAndUpdate(userId, {
          $push: { forms: savedForm._id }
        });
    
        res.status(201).json({
          success: true,
          form: savedForm
        });
    } catch (error) {
      console.error("Error saving form:", error);
      res.status(500).json({
        success: false,
        message: "Error saving form",
        error: error.message
      });
    }
  };
  
  const getUserForms = async (req, res) => {
    try {
      const userId = req.user.id;
      const forms = await Form.find({ userId })
        .sort({ createdAt: -1 }) // Sort by newest first
        .populate('userId', 'name email'); // Optionally populate user details
  
      res.status(200).json({
        success: true,
        forms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching forms",
        error: error.message
      });
    }
  };
 
  const getFormById = async (req, res) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;
  
      const form = await Form.findOne({
        _id: formId,
        userId // Ensure user can only access their own forms
      }).populate('userId', 'name email');
  
      if (!form) {
        return res.status(404).json({
          success: false,
          message: "Form not found or unauthorized"
        });
      }
  
      res.status(200).json({
        success: true,
        form
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching form",
        error: error.message
      });
    }
  };
  
  const deleteForm = async (req, res) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;
  
      // Find and delete form, ensuring it belongs to the user
      const deletedForm = await Form.findOneAndDelete({
        _id: formId,
        userId
      });
  
      if (!deletedForm) {
        return res.status(404).json({
          success: false,
          message: "Form not found or unauthorized"
        });
      }
  
      // Remove form reference from user's forms array
      await User.findByIdAndUpdate(userId, {
        $pull: { forms: formId }
      });
  
      res.status(200).json({
        success: true,
        message: "Form deleted successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting form",
        error: error.message
      });
    }
  };
  
  module.exports = {
    saveForm,
    getUserForms,
    getFormById,
    deleteForm
  };

 