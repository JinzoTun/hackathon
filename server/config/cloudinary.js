import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config/env.js';

dotenv.config();

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

export default cloudinary;