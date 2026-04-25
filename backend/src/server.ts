// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Now import other modules
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';
import eventRoutes from './routes/events';
import messageRoutes from './routes/messages';
// import auditRoutes from './routes/audit'; // To be implemented in Phase 9

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true
}));
app.use(express.json());

// Rate Limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 invites
  message: 'Too many invites sent, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', phase: 'Phase 10 - Real-time + Notifications' });
});

// Invite redirect route - handles deep linking for invite acceptance
// Redirects to lawyerbuddy://invite/{token} and shows fallback HTML if deep link doesn't work
app.get('/invite/:token', (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Invite token is required' });
  }

  const deepLink = `lawyerbuddy://invite/${token}`;
  const testflightLink = 'https://testflight.apple.com/join/YOUR_TESTFLIGHT_CODE'; // Update with actual TestFlight link

  // Return HTML page with prominent button (requires user gesture for iOS Safari)
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LawyerBuddy - Case Invitation</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          padding: 16px;
        }

        .container {
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        .logo {
          font-size: 64px;
          margin-bottom: 24px;
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .instructions {
          font-size: 16px;
          color: #888888;
          margin-bottom: 32px;
          line-height: 24px;
        }

        .primary-button {
          background-color: #0066cc;
          color: #ffffff;
          border: none;
          padding: 16px 32px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 16px;
          transition: background-color 0.2s;
        }

        .primary-button:active {
          background-color: #0052a3;
        }

        .secondary-button {
          background-color: transparent;
          color: #0066cc;
          border: 2px solid #0066cc;
          padding: 14px 30px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          width: 100%;
          box-sizing: border-box;
          transition: background-color 0.2s;
        }

        .secondary-button:active {
          background-color: rgba(0, 102, 204, 0.1);
        }

        .divider {
          margin: 24px 0;
          color: #444444;
        }

        .footer {
          font-size: 12px;
          color: #666666;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #1a1a1a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⚖️</div>
        <h1>Case Invitation</h1>

        <div class="instructions">
          You've been invited to view a case in LawyerBuddy.<br/>
          Tap the button below to open the app and view your invitation.
        </div>

        <a href="${deepLink}" class="primary-button">
          Open LawyerBuddy
        </a>

        <div class="divider">or</div>

        <a href="${testflightLink}" class="secondary-button">
          Download LawyerBuddy
        </a>

        <div class="footer">
          If you don't have LawyerBuddy installed, download it from the App Store or join our TestFlight beta.
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
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

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Routes with specific rate limiters
app.post('/auth/login', loginLimiter);
app.post('/auth/invite/send', inviteLimiter);

app.use('/auth', authRoutes);
app.use('/cases', caseRoutes);
app.use('/events', eventRoutes);
app.use('/messages', messageRoutes);
// app.use('/audit', auditRoutes); // Phase 9

app.listen(PORT, () => {
  console.log(`🚀 LawyerBuddy backend running on port ${PORT}`);
});
