import { Router } from 'express';
import { uploadDocument, searchDocuments, semanticMessageSearch } from '../controllers/document.controller.js';
import { authUser } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

const documentRouter = Router();

// Upload a PDF/text document — extracts text, chunks, and generates embeddings
documentRouter.post("/upload", authUser, upload.single('file'), uploadDocument);

// Semantic search across uploaded documents
documentRouter.get("/search", authUser, searchDocuments);

// Hybrid search (regex + vector) across chat messages
documentRouter.get("/messages/search", authUser, semanticMessageSearch);

export default documentRouter;
