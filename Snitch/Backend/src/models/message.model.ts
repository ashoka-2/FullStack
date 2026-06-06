import mongoose, { Schema, Document } from "mongoose";

export type MessageType = "contact" | "newsletter";

export interface IMessage extends Document {
    type: MessageType;
    name?: string;
    email: string;
    subject?: string;
    content?: string;
    isRead: boolean;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        type: { type: String, enum: ["contact", "newsletter"], required: true },
        name: { type: String },
        email: { type: String, required: true },
        subject: { type: String },
        content: { type: String },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Message = mongoose.model<IMessage>("Message", MessageSchema);
export default Message;
