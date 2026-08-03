import { AuthenticationError, ForbiddenError } from "../utils/httpErrors.js";
import { assertValidRoles } from "../utils/roles.js";

export const roleMiddleware = (...allowedRoles) => {
  assertValidRoles(allowedRoles);

  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError("Autenticação necessária"));
    }

    if (req.user.isActive === false) {
      return next(new ForbiddenError("A conta do usuário está desativada"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Acesso negado. Permissões insuficientes"));
    }

    next();
  };
};
