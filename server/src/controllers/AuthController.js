const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

class AuthController {
  static async register(req, res) {
    try {
      const {
        username,
        password,
        displayName,
        role = 'creator',
        department,
        academicYear,
        classSection
      } = req.body;

      // Validate input
      if (!username || !password || !displayName) {
        return res.status(400).json({ error: 'Username, password, and displayName are required' });
      }

      // Map role to academic role
      let academicRole = 'STUDENT';
      if (role === 'creator' || role === 'admin') {
        academicRole = 'TEACHER';
      }

      // Additional validation for students
      if (academicRole === 'STUDENT') {
        if (!department || !academicYear || !classSection) {
          return res.status(400).json({
            error: 'Department, academic year, and class section are required for student registration'
          });
        }

        if (academicYear < 1 || academicYear > 4) {
          return res.status(400).json({ error: 'Academic year must be between 1 and 4' });
        }

        if (!classSection.match(/^[A-Z]$/i)) {
          return res.status(400).json({ error: 'Class section must be a single letter (A, B, C, etc.)' });
        }
      }

      // Check if user already exists
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        username,
        password: hashedPassword,
        display_name: displayName,
        role,
        academic_role: academicRole,
        department: department || null,
        academic_year: academicRole === 'STUDENT' ? academicYear : null,
        class_section: academicRole === 'STUDENT' ? (classSection ? classSection.toUpperCase() : null) : null
      };

      const user = await UserModel.create(userData);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          academic_role: user.academic_role,
          department: user.department,
          academic_year: user.academic_year,
          class_section: user.class_section
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        academicRole: user.academic_role,
        department: user.department,
        academicYear: user.academic_year,
        classSection: user.class_section,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user
      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          academic_role: user.academic_role,
          department: user.department,
          academic_year: user.academic_year,
          class_section: user.class_section
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        academicRole: user.academic_role,
        department: user.department,
        academicYear: user.academic_year,
        classSection: user.class_section,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        academicRole: user.academic_role,
        department: user.department,
        academicYear: user.academic_year,
        classSection: user.class_section
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}

module.exports = AuthController;
