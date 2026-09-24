import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { validateEnvironment } from './server/config/env.js';
import authRoutes from './server/routes/auth.js';
import channelRoutes from './server/routes/channel.js';
import uploadRoutes from './server/routes/upload.js';
import shortsRoutes from './server/routes/shorts.js';
import liveRoutes from './server/routes/live.js';
import seoRoutes from './server/routes/seo.js';
import plannerRoutes from './server/routes/planner.js';
import automationRoutes from './server/routes/automation.js';
import activityRoutes from './server/routes/activity.js';
import quotaRoutes from './server/routes/quota.js';
import settingsRoutes from './server/routes/settings.js';
import assistantRoutes from './server/routes/assistant.js';
import videoGeneratorRoutes from './server/routes/videoGenerator.js';

// Safe environment startup validation
const envConfig = validateEnvironment();
console.log(`[Startup] Safe environment check passed:`);
console.log(` - ENCRYPTION_SECRET: Configured (${envConfig.secretLength} chars)`);
console.log(` - GOOGLE_CLIENT_ID: ${envConfig.googleClientIdConfigured ? 'Configured' : 'Missing'}`);
console.log(` - GOOGLE_CLIENT_SECRET: ${envConfig.googleClientSecretConfigured ? 'Configured' : 'Missing'}`);
console.log(` - OAuth Redirect URI: ${envConfig.redirectUri}`);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/channel', channelRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shorts', shortsRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/quota', quotaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/generate', videoGeneratorRoutes);
app.use('/api/youtube', videoGeneratorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    channel: 'Dhunboy Official',
    creator: 'Lobish Sarma'
  });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dhunboy AI YouTube Manager server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
