import { Router } from 'express';
import { 
    uploadDocument, 
    searchDocuments, 
    semanticMessageSearch, 
    getUserDocuments, 
    getDocumentById, 
    deleteDocument 
} from '../controllers/document.controller.js';
import { authUser } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB max file size
});

const documentRouter = Router();

// Upload a PDF/text document — extracts text, chunks, and generates embeddings
documentRouter.post("/upload", authUser, upload.single('file'), uploadDocument);

// Get all uploaded documents for the logged in user
documentRouter.get("/", authUser, getUserDocuments);

// Get specific document by ID (viewable by user and admin)
documentRouter.get("/:documentId", authUser, getDocumentById);

// Delete specific document
documentRouter.delete("/:documentId", authUser, deleteDocument);

// Semantic search across uploaded documents
documentRouter.get("/search", authUser, searchDocuments);

// Hybrid search (regex + vector) across chat messages
documentRouter.get("/messages/search", authUser, semanticMessageSearch);

export default documentRouter;
