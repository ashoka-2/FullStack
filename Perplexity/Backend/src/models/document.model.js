import mongoose from "mongoose";

// ─── Document Model ────────────────────────────────────────────────────────────
// Stores uploaded documents (PDFs, text files) with their chunked text and embeddings
// Used by the RAG pipeline for semantic search across user-uploaded content

const documentChunkSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    }
}, { _id: false });

const documentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        default: null
    },
    filename: {
        type: String,
        required: true,
        trim: true
    },
    originalSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        default: "application/pdf"
    },
    // ImageKit CDN file details
    file: {
        type: Object, // { url, fileId, thumbnailUrl }
        default: null
    },
    chunks: [documentChunkSchema],
    totalChunks: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for user-based queries
documentSchema.index({ user: 1, createdAt: -1 });

const documentModel = mongoose.model('Document', documentSchema);

export default documentModel;
