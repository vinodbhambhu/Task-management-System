const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./utils/db');
const seedAdmin = require('./utils/seedAdmin');

dotenv.config();

const app = express();

// Set reasonable timeout for file uploads (2 minutes)
app.use((req, res, next) => {
  req.socket.setTimeout(120000); // 2 minutes
  next();
});

// Connect to MongoDB
connectDB().then(() => seedAdmin());

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Routes
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));
app.use('/api/teacher',     require('./routes/teacherRoutes'));
app.use('/api/student',     require('./routes/studentRoutes'));
app.use('/api/tasks',       require('./routes/taskRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', env: process.env.NODE_ENV }));

// Test Cloudinary connection
app.get('/api/cloudinary-test', (req, res) => {
  const { cloudinary } = require('./utils/cloudinary');
  console.log('🔍 Testing Cloudinary...');
  cloudinary.api.resources({ max_results: 1 }, (error, result) => {
    if (error) {
      console.error('❌ Cloudinary test failed:', error.message);
      return res.status(500).json({ 
        message: 'Cloudinary connection failed', 
        error: error.message,
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ NOT SET',
          api_key: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET',
          api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET',
        }
      });
    }
    console.log('✅ Cloudinary test passed');
    res.json({ 
      message: 'Cloudinary is working',
      resourceCount: result.total_count
    });
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));