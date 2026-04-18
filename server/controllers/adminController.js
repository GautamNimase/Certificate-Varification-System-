const { User } = require('../models');

/**
 * Get all students for admin dashboard
 * GET /api/users/students
 * Admin-only - lists all students for certificate issuance
 */
exports.getAllStudents = async (req, res) => {
  try {
    // Only admins can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const students = await User.findAll({
      where: { role: 'student' },
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: students.map(student => student.toSafeObject())
    });
  } catch (error) {
    console.error('Get All Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

