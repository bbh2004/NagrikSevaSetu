// src/services/urgencyService.js
// ─────────────────────────────────────────────────────────────
// AI Urgency Detection Service (Gemini API)
//
// This is Phase 2.3 - AI integration into the backend pipeline.
//
// When a citizen submits a complaint, the description is plain
// text. Manually reading every complaint to assign urgency is
// impossible at scale.
//
// This service sends the complaint description to Gemini and
// asks it to classify urgency. The result is stored in the
// complaint document's 'urgency' field.
//
// Pipeline:
//   POST /api/complaints
//     → Complaint saved with urgency: 'Medium' (default)
//     → detectUrgency() runs ASYNCHRONOUSLY (non-blocking)
//     → Complaint document updated with the real urgency level
//
// WHY async?
//   We don't want citizens waiting 2 seconds for an AI response
//   before their complaint is "submitted". We save the complaint
//   immediately and let the AI run in the background.
//
// NOTE: If GEMINI_API_KEY is not set, we gracefully fall back
// to returning 'Medium'. The app still works, just without AI.
// ─────────────────────────────────────────────────────────────

const Complaint = require('../models/Complaint');

/**
 * Calls Gemini API and returns urgency: 'Low' | 'Medium' | 'High'
 * @param {string} description - The complaint description text
 * @returns {Promise<string>}
 */
const classifyUrgencyWithGemini = async (description) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[UrgencyService] GEMINI_API_KEY not set. Skipping AI classification.');
    return 'Medium';
  }

  const prompt = `You are a civic complaint urgency classifier for an Indian municipal system.

Classify the following complaint description as exactly one of: Low, Medium, or High.

Guidelines:
- High: Life-threatening issues, major infrastructure failure, flooding, electrical hazards, sewage overflow on roads
- Medium: Potholes, broken streetlights, water supply disruption, garbage not collected for days
- Low: Minor aesthetic issues, suggestions, general feedback

Respond with ONLY the single word: Low, Medium, or High. Nothing else.

Complaint: "${description}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 10, // We only need one word
            temperature: 0.1, // Low temperature = deterministic output
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Validate the response is one of our expected values
    if (['Low', 'Medium', 'High'].includes(text)) {
      return text;
    }

    console.warn(`[UrgencyService] Unexpected Gemini response: "${text}". Defaulting to Medium.`);
    return 'Medium';
  } catch (error) {
    console.error(`[UrgencyService] Gemini API call failed: ${error.message}. Defaulting to Medium.`);
    return 'Medium';
  }
};

/**
 * Detects urgency for a complaint and updates the document in MongoDB.
 * This is designed to be called WITHOUT await (fire-and-forget).
 * @param {string} complaintId - MongoDB ObjectId string of the complaint
 * @param {string} description - Complaint description text
 */
const detectAndUpdateUrgency = async (complaintId, description) => {
  const urgency = await classifyUrgencyWithGemini(description);

  await Complaint.findByIdAndUpdate(complaintId, { urgency });
  console.log(`[UrgencyService] Complaint ${complaintId} classified as: ${urgency}`);
};

module.exports = { detectAndUpdateUrgency };
