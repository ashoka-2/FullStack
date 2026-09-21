import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Derive 32-byte key from JWT_SECRET or fallback
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET || "default_perplexity_secret_key_32bytes!")
  .digest();

export function encryptKey(plainText) {
  if (!plainText) return "";
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return plainText;
  }
}

export function decryptKey(cipherText) {
  if (!cipherText) return "";
  try {
    // If not encrypted in iv:encrypted format, return as is
    if (!cipherText.includes(":")) return cipherText;

    const [ivHex, encryptedHex] = cipherText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return cipherText;
  }
}

export function maskApiKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  return `${start}••••••••${end}`;
}
