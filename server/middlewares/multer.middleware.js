import multer from "multer";

// Configure Multer for file upload
const storage = multer.diskStorage({});
const upload = multer({ storage });

export default upload;