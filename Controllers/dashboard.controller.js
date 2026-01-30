import { db } from "../Config/firebase.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../Utils/ApiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import logger from "../Utils/logger.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
    const inquiriesSnapshot = await db.collection("contacts").get();
    const bookingsSnapshot = await db.collection("bookings").get();
    const matchesSnapshot = await db.collection("manualMatches").get();

    const totalInquiries = inquiriesSnapshot.size;
    const activeAppointments = bookingsSnapshot.size;
    const teacherRequests = matchesSnapshot.size;

    const resolvedInquiries = inquiriesSnapshot.docs.filter(doc => doc.data().status === 'Resolved').length;
    const resolutionRate = totalInquiries > 0
        ? Math.round((resolvedInquiries / totalInquiries) * 100) + "%"
        : "0%";

    res.status(200).json({
        success: true,
        message: "Stats fetched successfully",
        data: {
            totalInquiries,
            activeAppointments,
            teacherRequests,
            resolutionRate
        }
    });
});

export const analyzeInquiry = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message) {
        throw new ApiError(400, "Inquiry message is required");
    }

    if (!process.env.GEMINI_API_KEY) {
        logger.error("GEMINI_API_KEY is missing in backend environment!");
        throw new ApiError(500, "Gemini API key is not configured");
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze this parent inquiry and provide a 2-sentence summary and a professional suggested reply: "${message}". You are a helpful school administrative assistant. Keep your analysis concise and your suggested replies warm and professional.`;

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI request timeout")), 30000)
        );

        const resultPromise = model.generateContent(prompt);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        logger.info("AI analysis completed successfully");

        res.status(200).json({
            success: true,
            data: text || "Unable to generate analysis."
        });
    } catch (error) {
        logger.error("AI Analysis Error:", error);
        throw new ApiError(500, `AI analysis failed: ${error.message}`);
    }
});

export const getAIChat = asyncHandler(async (req, res) => {
    const { prompt, context } = req.body;
    logger.info(`AI Chat Request received. Prompt length: ${prompt?.length}`);

    if (!prompt) {
        throw new ApiError(400, "Prompt is required");
    }

    if (!process.env.GEMINI_API_KEY) {
        logger.error("GEMINI_API_KEY is missing in backend environment!");
        throw new ApiError(500, "Gemini API key is not configured on server");
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemInstruction = `
        You are a professional administrative assistant for RightTutor.
        Context: ${context || 'General admin dashboard interaction.'}
        Tone: Helpful, direct, and concise.
        Goal: Answer administrative questions, summarize data, or help with scheduling.
    `;

        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI request timeout")), 30000)
        );

        const resultPromise = chat.sendMessage(`${systemInstruction}\n\nUser Question: ${prompt}`);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        logger.info("AI chat completed successfully");

        res.status(200).json({
            success: true,
            data: text || "I apologize, but I could not process that request."
        });
    } catch (error) {
        logger.error("AI Chat Error:", error);
        throw new ApiError(500, `AI chat failed: ${error.message}`);
    }
});
