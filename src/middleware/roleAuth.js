/**
 * Role-based authorization middleware
 * Use after the regular authentication middleware to check role permissions
 */
const roleAuthMiddleware = (allowedRoles = []) => {
    return (req, res, next) => {
      try {
        // Auth middleware already verified and attached user to request
        if (!req.user) {
          return res.status(401).json({ error: 'Unauthorized access' });
        }
        
        // Get user role from the authenticated user
        const role = req.user.role || 'user'; // Default to 'user' if not specified
        
        // Check if user's role is in the allowed roles
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'Insufficient permissions' 
          });
        }
        
        // Role is allowed, proceed to the next middleware or route handler
        next();
      } catch (error) {
        console.error('Role authorization error:', error);
        return res.status(500).json({ error: 'Authorization failed' });
      }
    };
  };
  
  export default roleAuthMiddleware;