import { Router } from "express";
import { analyzePlantDisease } from "../controllers/plantid.controller.js";
import authorize from "../middlewares/auth.middleware.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filter for image files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

// Initialize multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

const plantIdRouter = Router();

// All routes require authentication
plantIdRouter.use(authorize);

// Plant disease analysis route
plantIdRouter.post('/analyze', upload.single('file'), analyzePlantDisease);

export default plantIdRouter;