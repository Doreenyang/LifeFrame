import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { uploadPhoto, listPhotos } from '../controllers/photosController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', requireAuth, upload.single('file'), uploadPhoto);
router.get('/', requireAuth, listPhotos);

export default router;
