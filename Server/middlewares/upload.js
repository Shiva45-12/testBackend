
import multer from 'multer';

const storage = multer.memoryStorage(); // Store file in memory buffer

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

export default upload;
