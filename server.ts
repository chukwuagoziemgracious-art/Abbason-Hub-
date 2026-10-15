import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Log all API requests
  app.use('/api', (req, res, next) => {
    res.setHeader('X-Abbason-Environment', 'Development-Simulation');
    res.setHeader('X-Payment-Notice', 'Simulated payments for development only. Real escrow requires licensed provider.');
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Abbason Hub API',
      version: '1.0.0',
      escrowStatus: 'Simulated Sandbox Mode (No Real Money)',
      timestamp: new Date().toISOString()
    });
  });

  // Cryptographic OTP verification endpoint
  app.post('/api/orders/verify-delivery-otp', (req: Request, res: Response) => {
    const { orderId, submittedOtp, storedHash, salt, failedAttempts } = req.body;

    if (!orderId || !submittedOtp || !storedHash || !salt) {
      return res.status(400).json({ error: 'Missing required parameters for OTP verification' });
    }

    if (failedAttempts >= 5) {
      return res.status(403).json({
        error: 'Maximum verification attempts (5) exceeded. Order locked. Contact administrator.',
        locked: true
      });
    }

    // Server-side SHA-256 with salt
    const computedHash = crypto
      .createHash('sha256')
      .update(submittedOtp.trim() + ':' + salt)
      .digest('hex');

    if (computedHash === storedHash) {
      return res.json({
        success: true,
        message: 'Delivery confirmed successfully. Payout released to seller wallet.'
      });
    } else {
      const attemptsLeft = 5 - (failedAttempts + 1);
      return res.status(400).json({
        success: false,
        error: `Invalid code. ${attemptsLeft} attempt(s) remaining before lock.`,
        attemptsLeft
      });
    }
  });

  // Vite integration: middleware in development, static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Abbason Hub server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Abbason Hub server:', err);
  process.exit(1);
});
