import ImageKit from "imagekit";

// ImageKit client setup for CDN storage
const client = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "placeholder",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/placeholder",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

// Function to upload new file to ImageKit
export async function uploadFile({buffer, filename, folder = ""}){
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

// Function to delete existing file by file ID
export async function deleteFile(fileId){
    try {
        await client.deleteFile(fileId);
        return true;
    } catch (error) {
        console.error("ImageKit delete error:", error);
        return false;
    }
}
