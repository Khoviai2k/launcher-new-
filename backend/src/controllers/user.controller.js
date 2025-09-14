const User = require('../models/User');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password_hash -refresh_tokens');
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { display_name, email } = req.body;
      const user = await User.findById(req.user.id);
      
      if (display_name) user.display_name = display_name;
      if (email) user.email = email;
      
      await user.save();
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async changePassword(req, res) {
    try {
      const authService = require('../services/auth.service');
      const result = await authService.changePassword(req.user.id, req.body.old_password, req.body.new_password);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new UserController();