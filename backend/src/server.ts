// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Now import other modules
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import eventRoutes from './routes/events';
import messageRoutes from './routes/messages';
// import auditRoutes from './routes/audit'; // To be implemented in Phase 9

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', phase: 'Phase 10 - Real-time + Notifications' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/cases', caseRoutes);
app.use('/events', eventRoutes);
app.use('/messages', messageRoutes);
// app.use('/audit', auditRoutes); // Phase 9

app.listen(PORT, () => {
  console.log(`🚀 LawyerBuddy backend running on port ${PORT}`);
});
