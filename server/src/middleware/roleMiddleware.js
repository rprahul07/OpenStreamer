const requireTeacher = (req, res, next) => {
  console.log('=== REQUIRE TEACHER MIDDLEWARE CALLED ===');
  console.log('Request path:', req.path);
  console.log('User:', req.user);
  console.log('User role:', req.user?.academic_role || req.user?.role);
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const userRole = req.user.academic_role || req.user.role;
  
  if (userRole !== 'TEACHER' && userRole !== 'creator' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Teacher access required.' });
  }

  next();
};

const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const userRole = req.user.academic_role || req.user.role;
  
  if (userRole !== 'STUDENT' && userRole !== 'listener' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Student access required.' });
  }

  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
};

module.exports = {
  requireTeacher,
  requireStudent,
  requireAuth
};
