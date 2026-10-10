const User = require('../models/User');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: role || 'Staff',
    });

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user._id;
      req.session.role = user.role;
      return res.status(201).json({
        success: true,
        message: 'Registration successful. You are now logged in.',
        user,
      });
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user._id;
      req.session.role = user.role;
      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        user,
      });
    });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res, next) => {
  if (!req.session) {
    return res.status(200).json({ success: true, message: 'Already logged out.' });
  }

  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  });
};

const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check if new email is taken by another user
    if (cleanEmail !== req.user.email) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use by another account.',
        });
      }
    }

    req.user.name = name;
    req.user.email = cleanEmail;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
