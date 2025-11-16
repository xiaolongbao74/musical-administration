const express = require('express');
const cors = require('cors');
require('dotenv').config();

const membersRoutes = require('./routes/members');
const songsRoutes = require('./routes/songs');
const koubanhyouRoutes = require('./routes/koubanhyou');
const schedulesRoutes = require('./routes/schedules');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://musical-administration-frontend.onrender.com',
        'https://koubanhyou-frontend.onrender.com',
        /\.onrender\.com$/
      ]
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/members', membersRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/koubanhyou', koubanhyouRoutes);
app.use('/api/schedules', schedulesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
