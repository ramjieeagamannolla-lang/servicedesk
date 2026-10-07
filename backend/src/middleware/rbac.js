const ApiError = require('../utils/ApiError');

// authorize('SYSTEM_ADMIN', 'IT_MANAGER') -> only those roles may proceed.
// This is the real enforcement layer; the frontend only hides buttons for UX.
function authorize(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`)
      );
    }
    next();
  };
}

module.exports = { authorize };
