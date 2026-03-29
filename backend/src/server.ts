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

// Admin migration endpoint - execute pending migrations via Supabase
app.post('/admin/migrate', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Pending migrations
    const migrations = [
      {
        name: '002_add_case_delete_policy',
        sql: 'CREATE POLICY IF NOT EXISTS "cases_delete_lawyer_only" ON public.cases FOR DELETE USING (lawyer_id = auth.uid());'
      }
    ];

    const results = [];

    for (const migration of migrations) {
      // Supabase client does not expose raw SQL execution
      // Provide instructions for manual execution
      results.push({
        name: migration.name,
        status: 'requires_manual_execution',
        sql: migration.sql,
        instructions: 'Run this SQL in your Supabase dashboard: https://app.supabase.com/project/jjwiotunqmbphpkpayds/sql'
      });
    }

    res.json({
      success: true,
      message: 'Migration status retrieved',
      migrations: results,
      note: 'Supabase client does not expose raw SQL execution. Copy the SQL above and run in your Supabase dashboard.',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Migration failed',
    });
  }
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
