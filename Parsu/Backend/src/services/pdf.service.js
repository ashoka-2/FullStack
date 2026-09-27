import { createRequire } from "module";
const require = createRequire(import.meta.url);

let pdfModule = null;
try {
    pdfModule = require("pdf-parse");
} catch (e) {
    console.warn("Could not load pdf-parse:", e.message);
}

/**
 * Extract plain text from PDF buffer
 * Compatible with pdf-parse v1 and v2
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(buffer) {
    if (!buffer || buffer.length === 0) return "";

    if (!pdfModule) {
        throw new Error("pdf-parse engine is not loaded on this server.");
    }

    try {
        // pdf-parse v2 class syntax
        if (pdfModule.PDFParse && typeof pdfModule.PDFParse === "function") {
            const parser = new pdfModule.PDFParse({ data: buffer });
            const pdfData = await parser.getText();
            if (parser.destroy && typeof parser.destroy === "function") {
                await parser.destroy();
            }
            return pdfData?.text || "";
        }

        // pdf-parse v1 function syntax
        if (typeof pdfModule === "function") {
            const pdfData = await pdfModule(buffer);
            return pdfData?.text || "";
        }

        if (typeof pdfModule.default === "function") {
            const pdfData = await pdfModule.default(buffer);
            return pdfData?.text || "";
        }

        throw new Error("No compatible PDF parser method found on pdf-parse module.");
    } catch (err) {
        console.error("❌ PDF text extraction error:", err.message);
        throw err;
    }
}
