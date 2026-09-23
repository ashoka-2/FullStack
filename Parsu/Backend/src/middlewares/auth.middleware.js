import jwt from "jsonwebtoken";

export function authUser(req, res, next) {
    // Cookie-first, then Bearer-header fallback (matching Scapegoat for cross-site cookie restrictions)
    const bearer =
        req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : null;
    const token = req.cookies?.token || bearer;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            err: "No token provided",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            err: "Invalid token",
        });
    }
}

export function optionalAuthUser(req, res, next) {
    const bearer =
        req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : null;
    const token = req.cookies?.token || bearer;

    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
}