import ImageKit from "imagekit";

const client = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "placeholder",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/placeholder",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

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
