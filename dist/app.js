"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const question_routes_1 = __importDefault(require("./routes/question.routes"));
const rubric_routes_1 = __importDefault(require("./routes/rubric.routes"));
const agent_version_routes_1 = __importDefault(require("./routes/agent-version.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const assessment_session_routes_1 = __importDefault(require("./routes/assessment-session.routes"));
const evaluation_routes_1 = __importDefault(require("./routes/evaluation.routes"));
const expert_evaluation_routes_1 = __importDefault(require("./routes/expert-evaluation.routes"));
const comparison_routes_1 = __importDefault(require("./routes/comparison.routes"));
const refinement_routes_1 = __importDefault(require("./routes/refinement.routes"));
const final_evaluation_routes_1 = __importDefault(require("./routes/final-evaluation.routes"));
const survey_routes_1 = __importDefault(require("./routes/survey.routes"));
const statistics_routes_1 = __importDefault(require("./routes/statistics.routes"));
const export_routes_1 = __importDefault(require("./routes/export.routes"));
exports.app = (0, express_1.default)();
// Middlewares
exports.app.use((0, cors_1.default)({ origin: true, credentials: true }));
exports.app.use(express_1.default.json({ limit: '10mb' }));
// Health Check
exports.app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'YAWA Research Backend API',
        timestamp: new Date().toISOString(),
    });
});
// Routes
exports.app.use('/api/auth', auth_routes_1.default);
exports.app.use('/api/questions', question_routes_1.default);
exports.app.use('/api/rubrics', rubric_routes_1.default);
exports.app.use('/api/agent-versions', agent_version_routes_1.default);
exports.app.use('/api/audit-logs', audit_routes_1.default);
exports.app.use('/api/sessions', assessment_session_routes_1.default);
exports.app.use('/api/evaluations', evaluation_routes_1.default);
exports.app.use('/api/expert', expert_evaluation_routes_1.default);
exports.app.use('/api/comparisons', comparison_routes_1.default);
exports.app.use('/api/refinements', refinement_routes_1.default);
exports.app.use('/api/final-reviews', final_evaluation_routes_1.default);
exports.app.use('/api/surveys', survey_routes_1.default);
exports.app.use('/api/statistics', statistics_routes_1.default);
exports.app.use('/api/exports', export_routes_1.default);
// 404 Handler
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `API route ${req.method} ${req.originalUrl} not found`,
    });
});
// Global Error Handler
exports.app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
    });
});
