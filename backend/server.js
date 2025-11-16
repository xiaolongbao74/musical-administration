const express = require('express');
const cors = require('cors');
require('dotenv').config();

const membersRoutes = require('./routes/members');
const songsRoutes = require('./routes/songs');
const koubanhyouRoutes = require('./routes/koubanhyou');
const schedulesRoutes = require('./routes/schedules');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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
