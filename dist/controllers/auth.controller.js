"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async login(req, res) {
        try {
            const { email, password, passwordHash } = req.body;
            const plainPassword = password || passwordHash;
            if (!email || !plainPassword) {
                return res.status(400).json({ success: false, error: 'Email and password are required' });
            }
            const result = await auth_service_1.AuthService.login(email, plainPassword);
            return res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            return res.status(401).json({ success: false, error: error.message || 'Login failed' });
        }
    }
    static async quickLogin(req, res) {
        try {
            const { role } = req.body;
            if (!role) {
                return res.status(400).json({ success: false, error: 'Role is required for quick login' });
            }
            const result = await auth_service_1.AuthService.quickLogin(role);
            return res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            return res.status(403).json({ success: false, error: error.message || 'Quick login failed' });
        }
    }
    static async me(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            return res.status(200).json({ success: true, user: req.user });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch profile' });
        }
    }
    static async acceptDisclaimer(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const user = await auth_service_1.AuthService.acceptDisclaimer(req.user.id);
            return res.status(200).json({
                success: true,
                disclaimerAcceptedAt: user.disclaimerAcceptedAt,
                message: 'Academic research disclaimer accepted',
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to accept disclaimer' });
        }
    }
}
exports.AuthController = AuthController;
