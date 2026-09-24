import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { validateEnvironment } from './config/env.js';
import authRoutes from './routes/auth.js';
import channelRoutes from './routes/channel.js';
import uploadRoutes from './routes/upload.js';
import shortsRoutes from './routes/shorts.js';
import liveRoutes from './routes/live.js';
import seoRoutes from './routes/seo.js';
import plannerRoutes from './routes/planner.js';
import automationRoutes from './routes/automation.js';
import activityRoutes from './routes/activity.js';
import quotaRoutes from './routes/quota.js';
import settingsRoutes from './routes/settings.js';
import assistantRoutes from './routes/assistant.js';
import videoGeneratorRoutes from './routes/videoGenerator.js';

// Safe environment startup validation
const envConfig = validateEnvironment();
console.log(`[Startup] Safe environment check passed:`);
console.log(` - ENCRYPTION_SECRET: Configured (${envConfig.secretLength} chars)`);
console.log(` - GOOGLE_CLIENT_ID: ${envConfig.googleClientIdConfigured ? 'Configured' : 'Missing'}`);
console.log(` - GOOGLE_CLIENT_SECRET: ${envConfig.googleClientSecretConfigured ? 'Configured' : 'Missing'}`);
console.log(` - OAuth Redirect URI: ${envConfig.redirectUri}`);

export const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
const isVercel = !!process.env.VERCEL;
const uploadsDir = isVercel ? '/tmp/uploads' : path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    // ignore
  }
}
app.use('/uploads', express.static(uploadsDir));

// Register API Routes under /api/*
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

// Also register routes without /api prefix for Vercel rewrite compatibility
app.use('/auth', authRoutes);
app.use('/channel', channelRoutes);
app.use('/upload', uploadRoutes);
app.use('/shorts', shortsRoutes);
app.use('/live', liveRoutes);
app.use('/seo', seoRoutes);
app.use('/planner', plannerRoutes);
app.use('/automation', automationRoutes);
app.use('/activity', activityRoutes);
app.use('/quota', quotaRoutes);
app.use('/settings', settingsRoutes);
app.use('/assistant', assistantRoutes);
app.use('/generate', videoGeneratorRoutes);
app.use('/youtube', videoGeneratorRoutes);

// Health check endpoint
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    channel: 'Dhunboy Official',
    creator: 'Lobish Sarma',
    environment: isVercel ? 'vercel-serverless' : 'server'
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

export default app;
