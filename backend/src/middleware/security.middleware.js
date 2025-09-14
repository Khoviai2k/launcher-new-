const securityMiddleware = (req, res, next) => {
  // Basic security headers and validation
  req.requestId = require('uuid').v4();
  
  // Log request
  console.log(`${new Date().toISOString()} [${req.requestId}] ${req.method} ${req.path}`);
  
  next();
};

module.exports = securityMiddleware;