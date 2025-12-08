import express from 'express';
import mongoose from 'mongoose';
import config from './config/index.js';
import usersRoutes from './routes/users.js';

const app = express();
app.use(express.json());

app.use('/api/users', usersRoutes);

app.get('/', (req, res) => res.send('Auth service is up'));

const start = async () => {
    console.log('Connecting to MongoDB...', config.mongoUri);
    await mongoose.connect(config.mongoUri, {});
    console.log('Connected to MongoDB');
    app.listen(config.port, () => console.log('Listening', config.port));
};

start().catch(err => {
    console.error(err);
    process.exit(1);
});
