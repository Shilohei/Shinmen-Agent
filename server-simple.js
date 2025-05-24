const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make io available to routes
app.set('io', io);

// Simple mock routes for testing
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'AI Agent Platform Backend is running!'
  });
});

// Mock auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email && password) {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: email,
          name: 'Test User',
          role: 'user',
          preferences: {}
        },
        token: 'mock-jwt-token'
      },
      message: 'Login successful'
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  // Mock registration
  if (email && password && name) {
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: '1',
          email: email,
          name: name,
          role: 'user',
          preferences: {}
        },
        token: 'mock-jwt-token'
      },
      message: 'User created successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Email, password, and name are required'
    });
  }
});

// Mock chat routes
app.get('/api/chat/conversations', (req, res) => {
  res.json({
    data: [
      {
        id: '1',
        title: 'Welcome Conversation',
        messageCount: 2,
        lastMessage: {
          id: '2',
          role: 'assistant',
          content: 'Hello! How can I help you today?',
          timestamp: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      hasMore: false
    }
  });
});

app.post('/api/chat/conversations', (req, res) => {
  const { title } = req.body;
  
  res.status(201).json({
    success: true,
    data: {
      conversation: {
        id: Date.now().toString(),
        userId: '1',
        title: title || 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    message: 'Conversation created successfully'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 AI Agent Platform Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = { app, io };
