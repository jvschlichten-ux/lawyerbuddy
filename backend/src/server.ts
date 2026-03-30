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

// Invite redirect route - handles deep linking for invite acceptance
// Redirects to lawyerbuddy://invite/{token} and shows fallback HTML if deep link doesn't work
app.get('/invite/:token', (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Invite token is required' });
  }

  const deepLink = `lawyerbuddy://invite/${token}`;

  // Return HTML page that attempts to open the deep link
  // The page will redirect to the deep link, and if that fails, show a fallback button
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
        }

        .container {
          text-align: center;
          padding: 32px;
          max-width: 400px;
        }

        .logo {
          font-size: 64px;
          margin-bottom: 24px;
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .message {
          font-size: 16px;
          color: #888888;
          margin-bottom: 32px;
          line-height: 24px;
        }

        .button {
          background-color: #0066cc;
          color: #ffffff;
          border: none;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin: 8px;
          transition: background-color 0.2s;
        }

        .button:hover {
          background-color: #0052a3;
        }

        .instructions {
          font-size: 12px;
          color: #666666;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #1a1a1a;
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #0066cc;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⚖️</div>
        <h1>Case Invitation</h1>
        <div class="message" id="message">
          <span class="spinner"></span>Opening LawyerBuddy app...
        </div>

        <!-- Hidden anchor tag for deep link (more reliable) -->
        <a id="deeplink" href="${deepLink}" style="display: none;">Open LawyerBuddy</a>

        <!-- Fallback button for manual tap -->
        <a href="${deepLink}" class="button" id="fallbackButton" style="display: none;">
          Open LawyerBuddy App
        </a>

        <div class="instructions">
          If the app doesn't open automatically, click the button above.<br/>
          Make sure LawyerBuddy is installed on your device.
        </div>
      </div>

      <script>
        const deepLink = '${deepLink}';
        let deepLinkAttempted = false;

        // Try to open the deep link using anchor tag (more reliable for iOS Safari)
        function openDeepLink() {
          deepLinkAttempted = true;
          console.log('🔗 Attempting to open deep link:', deepLink);

          // Method 1: Click the hidden anchor tag (most reliable for iOS)
          const anchorElement = document.getElementById('deeplink');
          if (anchorElement) {
            console.log('📱 Using anchor tag method');
            anchorElement.click();
          }

          // Method 2: Also try window.location.href as fallback
          setTimeout(() => {
            console.log('📍 Using window.location.href fallback');
            window.location.href = deepLink;
          }, 100);

          // Show fallback button after 2 seconds if app didn't open
          setTimeout(() => {
            if (!document.hidden) {
              console.log('⏱️ App didn\'t open, showing fallback button');
              document.getElementById('fallbackButton').style.display = 'inline-block';
              document.getElementById('message').innerHTML =
                'The app didn\'t open. Try clicking the button above or install LawyerBuddy.';
            }
          }, 2000);
        }

        // Attempt to open deep link on page load
        document.addEventListener('DOMContentLoaded', () => {
          console.log('📄 Page loaded, initiating deep link');
          openDeepLink();
        });

        // Also try immediately on script execution (faster)
        console.log('🚀 Script executing, deep link:', deepLink);
        openDeepLink();

        // Handle app switching - if user returns to this page, show fallback
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && deepLinkAttempted) {
            console.log('👁️ Page became visible again');
            document.getElementById('fallbackButton').style.display = 'inline-block';
            document.getElementById('message').innerHTML =
              'If you have LawyerBuddy installed, it should open. Otherwise, install it first.';
          }
        });
      </script>
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

// Routes
app.use('/auth', authRoutes);
app.use('/cases', caseRoutes);
app.use('/events', eventRoutes);
app.use('/messages', messageRoutes);
// app.use('/audit', auditRoutes); // Phase 9

app.listen(PORT, () => {
  console.log(`🚀 LawyerBuddy backend running on port ${PORT}`);
});
