import ImageKit from "imagekit";
import { config } from "../config/config.js";

// ImageKit client setup kar rahe hain (CDN storage ke liye)
const client = new ImageKit({
    publicKey: config.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
    privateKey: config.IMAGEKIT_PRIVATE_KEY
});

/**
 * Uploads a file to ImageKit.
 * @param file - Buffer or URL string or Base64 string
 */
export async function uploadFile({ file, filename, folder = "" }: { file: Buffer | string; filename: string; folder?: string }): Promise<any> {
    try {
        const response = await client.upload({
            file: file,
            fileName: filename,
            folder: folder
        });
        return response;
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

// URL se filename nikal kar delete karne ke liye function
export async function deleteFileByUrl(url: string) {
    if (!url || typeof url !== "string") return false;
    try {
        const parts = url.split("/");
        const filename = parts[parts.length - 1];
        if (!filename) return false;

        // Search for the file to get its fileId
        const files = await client.listFiles({
            name: filename
        });

        if (files && files.length > 0) {
            for (const file of files) {
                if ("fileId" in file) {
                    await client.deleteFile(file.fileId);
                    console.log(`Deleted old ImageKit file: ${file.name} (${file.fileId})`);
                }
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Failed to delete ImageKit file by URL (${url}):`, error);
        return false;
    }
}
