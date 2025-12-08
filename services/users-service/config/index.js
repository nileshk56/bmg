import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build absolute path to env file inside config folder
const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
const envPath = path.join(__dirname, envFile);

console.log("Loading env file from:", envPath);

dotenv.config({ path: envPath });

console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

export default {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    aws: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sesFromEmail: process.env.SES_FROM_EMAIL,
        s3Bucket: process.env.S3_BUCKET
    }
};
