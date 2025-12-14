import http from 'http';

import { app } from './app';
import { connectDatabaseWithRetry } from './config/database';
import { env } from './config/env';
import { connectRedis } from './config/redis';
import { cronService } from './containers/cron.container';
import { initializeSocketIO } from './sockets';
import { setupGracefulShutdown } from './utils/shutdownHandler';

// 서버 시작
async function startServer() {
  try {
    // Redis 연결
    await connectRedis();
    // Database 연결
    await connectDatabaseWithRetry();
    console.log('reids, db 연결성공');

    const server = http.createServer(app);
    initializeSocketIO(server);

    cronService.start();
    console.log('[Cron] 서비스 시작 (매일 새벽 4시 실행)');

    //서버 시작
    server.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════╗
║  🚀 서버가 실행 중 입니다!      ║
║  📡 Port: ${env.PORT}         ║
║  🌍 Env: ${env.NODE_ENV}      ║
║  🔌 Redis: 연결됨              ║
║  💾 Database: 연결됨           ║
╚═══════════════════════════════╝
      `);
    });

    setupGracefulShutdown(server);
  } catch (error) {
    console.error('서버 구동 실패:', error);
    process.exit(1);
  }
}
// 서버 시작
startServer();
