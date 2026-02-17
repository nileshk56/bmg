const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');
const reviewRoutes = require('./routes/reviews');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use('/reviews', reviewRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // for Lambda serverless integration
