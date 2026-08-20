"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const server = app_1.app.listen(env_1.env.PORT, () => {
    console.log(`🚀 YAWA Backend running on http://localhost:${env_1.env.PORT}`);
    console.log(`🔒 Mode: ${env_1.env.NODE_ENV} | Quick-Login Allowed: ${env_1.env.ALLOW_QUICK_LOGIN}`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
