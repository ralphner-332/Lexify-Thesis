import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Lexify Backend running on http://localhost:${env.PORT}`);
  console.log(`🔒 Mode: ${env.NODE_ENV} | Quick-Login Allowed: ${env.ALLOW_QUICK_LOGIN}`);
});
server.setTimeout(600000);


process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
