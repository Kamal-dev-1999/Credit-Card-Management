const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

// Import middleware
const authMiddleware = require('./src/middleware/auth.middleware');
const { 
  generalLimiter, 
  authLimiter, 
  syncLimiter, 
  discoverLimiter, 
  apiLimiter 
} = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const notificationRoutes = require('./src/routes/notification.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──
// Add security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'http://localhost:5000', 'http://localhost:5173']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));

// ── Rate Limiting ──
// Apply general rate limiter to all routes
app.use(generalLimiter);

// Apply strict auth rate limiting to login endpoints
app.use('/api/auth/google', authLimiter);
app.use('/api/auth/google/callback', authLimiter);

// ── Middleware ──
// Parse cookies
app.use(cookieParser());

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration (Allow frontend to send cookies)
const allowedOrigins = [
  'http://localhost:5173',  // Frontend dev server
  'http://localhost:3000',  // Alternative frontend port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies from frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'],
}));

// ── Apply Auth Middleware BEFORE Routes ──
// This extracts user from JWT cookie and sets req.user
app.use(authMiddleware);

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

// Import and mount card routes
try {
  const cardRoutes = require('./src/routes/cards.routes');
  app.use('/api/cards', apiLimiter, cardRoutes);
  console.log('✅ Card routes loaded');
} catch (err) {
  console.warn('⚠️  Card routes not found:', err.message);
}

// Import and mount dashboard/bills routes
try {
  const dashboardRoutes = require('./src/routes/dashboard.routes');
  app.use('/api/dashboard', apiLimiter, dashboardRoutes);
  app.use('/api/bills', apiLimiter, dashboardRoutes); // Also mount bills endpoints at /api/bills
  console.log('✅ Dashboard routes loaded');
} catch (err) {
  console.warn('⚠️  Dashboard routes not found:', err.message);
}

// Import and mount sync routes
try {
  const syncRoutes = require('./src/routes/sync.routes');
  app.use('/api/test', syncLimiter, syncRoutes);
  console.log('✅ Sync routes loaded');
} catch (err) {
  console.warn('⚠️  Sync routes not found:', err.message);
}

// Import and mount news routes
try {
  const newsRoutes = require('./src/routes/news.routes');
  app.use('/api/news', apiLimiter, newsRoutes);
  console.log('✅ News routes loaded');
} catch (err) {
  console.warn('⚠️  News routes not found:', err.message);
}

// Import and mount AI routes
try {
  const aiRoutes = require('./src/routes/ai.routes');
  app.use('/api/ai', apiLimiter, aiRoutes);
  console.log('✅ AI routes loaded');
} catch (err) {
  console.warn('⚠️  AI routes not found:', err.message);
}

// Import and mount chatbot routes
try {
  const chatbotRoutes = require('./src/routes/chatbot.routes');
  app.use('/api/chatbot', apiLimiter, chatbotRoutes);
  console.log('✅ Chatbot routes loaded');
} catch (err) {
  console.warn('⚠️  Chatbot routes not found:', err.message);
}

// ── Error Handling ──
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});
