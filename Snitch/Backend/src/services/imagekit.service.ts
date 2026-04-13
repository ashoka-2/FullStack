import ImageKit from "imagekit";
import { config } from "../config/config.js";

// ImageKit client setup kar rahe hain (CDN storage ke liye)
const client = new ImageKit({
    publicKey: config.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
    privateKey: config.IMAGEKIT_PRIVATE_KEY
});

// Nayi file upload karne ke liye function
export async function uploadFile({ buffer, filename, folder = "" }: { buffer: Buffer; filename: string; folder?: string }): Promise<any> {
    try {
        const file = await client.upload({
            file: buffer,
            fileName: filename,
            folder: folder
        });
        return file;
    } catch (error) {
        console.error("ImageKit upload error:", error);
        throw error;
    }
}

// Purani file delete karne ke liye function
export async function deleteFile(fileId: string) {
    try {
        await client.deleteFile(fileId);
        return true;
    } catch (error) {
        console.error("ImageKit delete error:", error);
        return false;
    }
}
