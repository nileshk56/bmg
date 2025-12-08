import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import config from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

AWS.config.update({
  region: config.aws.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey
});
const s3 = new AWS.S3();

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: config.aws.s3Bucket,
    acl: 'public-read',
    key: function (req, file, cb) {
      const ext = file.originalname.split('.').pop();
      cb(null, `profiles/${uuidv4()}.${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
