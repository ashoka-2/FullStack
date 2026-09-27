import userModel from "../models/user.model.js";

/**
 * Heuristic & Pattern-based User Memory Extractor
 * Identifies when the user asks the AI to remember something, or states personal facts
 * Examples:
 * - "Remember that my friend name is Tez"
 * - "Remember that I live in Jaipur"
 * - "Keep in mind that I prefer TypeScript over JavaScript"
 * - "My friend's name is Tez"
 * - "My wife's name is Sarah"
 * - "I work at Google as a frontend engineer"
 */
export async function extractAndStoreMemory(userId, messageContent) {
    if (!userId || !messageContent || typeof messageContent !== 'string') return;

    const trimmed = messageContent.trim();
    if (trimmed.length < 5 || trimmed.length > 500) return;

    try {
        const user = await userModel.findById(userId);
        if (!user || user.memory?.enabled === false) return;

        let detectedFact = null;

        // Pattern 1: "remember that ...", "remember this: ...", "remember: ..."
        const rememberMatch = trimmed.match(/^(?:please\s+)?remember(?:\s+that|\s+this)?\s*[:,-]?\s*(.+)$/i);
        if (rememberMatch && rememberMatch[1]) {
            detectedFact = rememberMatch[1].trim();
        }

        // Pattern 2: "keep in mind that ...", "note that ..."
        if (!detectedFact) {
            const noteMatch = trimmed.match(/^(?:please\s+)?(?:keep in mind|note|don't forget)(?:\s+that)?\s*[:,-]?\s*(.+)$/i);
            if (noteMatch && noteMatch[1]) {
                detectedFact = noteMatch[1].trim();
            }
        }

        // Pattern 3: Direct personal declarative statements: "my friend's name is ...", "my name is ...", "my favorite ... is ..."
        if (!detectedFact) {
            const personalMatch = trimmed.match(/^(my\s+(?:friend(?:'s)?|colleague|brother|sister|pet|dog|cat|wife|husband|mom|dad|favorite\s+\w+|birthday|city|hometown|car|phone)\s+(?:name\s+)?is\s+.+)$/i);
            if (personalMatch && personalMatch[1]) {
                detectedFact = personalMatch[1].trim();
            }
        }

        // Pattern 4: "I am ...", "I work at/as ...", "I live in ..."
        if (!detectedFact) {
            const identityMatch = trimmed.match(/^(i\s+(?:work as|work at|live in|study at|specialize in|am a)\s+.+)$/i);
            if (identityMatch && identityMatch[1]) {
                detectedFact = identityMatch[1].trim();
            }
        }

        if (!detectedFact) return;

        // Clean up punctuation at the end
        detectedFact = detectedFact.replace(/[.!?]+$/, '').trim();
        // Capitalize first letter
        detectedFact = detectedFact.charAt(0).toUpperCase() + detectedFact.slice(1);

        // Normalize first-person pronouns for consistent 3rd-person memory facts
        let normalizedFact = detectedFact
            .replace(/\bmy\b/gi, "User's")
            .replace(/\bi am\b/gi, "User is")
            .replace(/\bi have\b/gi, "User has")
            .replace(/\bi live\b/gi, "User lives")
            .replace(/\bi work\b/gi, "User works")
            .replace(/\bi prefer\b/gi, "User prefers");

        const currentFacts = Array.isArray(user.memory?.facts) ? [...user.memory.facts] : [];

        // Check for duplicates or near-duplicates
        const isDuplicate = currentFacts.some(f => 
            f.toLowerCase() === normalizedFact.toLowerCase() ||
            f.toLowerCase().includes(normalizedFact.toLowerCase()) ||
            normalizedFact.toLowerCase().includes(f.toLowerCase())
        );

        if (!isDuplicate) {
            currentFacts.push(normalizedFact);

            // Keep max 50 facts
            const updatedFacts = currentFacts.slice(-50);

            // Rebuild concise summary
            const summaryParts = [];
            if (user.memory?.nickname) summaryParts.push(`Name/Nickname: ${user.memory.nickname}`);
            if (user.memory?.occupation) summaryParts.push(`Occupation: ${user.memory.occupation}`);
            
            // Append up to last 10 facts to summary
            const recentFacts = updatedFacts.slice(-10);
            summaryParts.push(recentFacts.join(". ") + ".");

            const updatedSummary = summaryParts.join(" | ").slice(0, 1500);

            await userModel.updateOne(
                { _id: userId },
                {
                    $set: {
                        "memory.facts": updatedFacts,
                        "memory.summary": updatedSummary,
                        "memory.lastUpdated": new Date()
                    }
                }
            );

            console.log(`🧠 [Memory System] Learned new user fact for [${user.username}]: "${normalizedFact}"`);
        }
    } catch (err) {
        console.warn("⚠️ Memory extraction error:", err.message);
    }
}
