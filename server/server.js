require('dotenv').config();
const { connectDB } = require('./config/db');
const { createApp } = require('./app');
const { ensureDemoUsers } = require('./utils/ensureDemoUsers');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureDemoUsers();
    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Warehouse Management System (WMS) Server`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Running on:  http://localhost:${PORT}`);
      console.log(`  API Base:    http://localhost:${PORT}/api/v1`);
      console.log(`====================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
};

startServer();
