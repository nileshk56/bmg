const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');
const bookingRoutes = require('./routes/bookings');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use('/bookings', bookingRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // for Lambda serverless integration
