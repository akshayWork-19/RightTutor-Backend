import { db } from "../Config/firebase.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../Utils/ApiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import logger from "../Utils/logger.js";
import { cache } from "../Utils/cache.js";

// Helper to get stats with caching
const getStatsInternal = async () => {
    const CACHE_KEY = "dashboard_stats";
    const CACHE_TTL = 300; // 5 minutes

    const cachedStats = cache.get(CACHE_KEY);
    if (cachedStats) return cachedStats;

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

    const stats = {
        totalInquiries,
        activeAppointments,
        teacherRequests,
        resolutionRate
    };

    cache.set(CACHE_KEY, stats, CACHE_TTL);
    return stats;
};

// Helper to get recent activity with caching
const getRecentActivityInternal = async () => {
    const CACHE_KEY = "recent_activity_context";
    const CACHE_TTL = 300; // 5 minutes

    const cachedActivity = cache.get(CACHE_KEY);
    if (cachedActivity) return cachedActivity;

    // Fetch last 5 contacts for context
    const recentContactsSnapshot = await db.collection("contacts")
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

    const recentInquiries = recentContactsSnapshot.docs.map(doc => {
        const data = doc.data();
        return `- ${data.name} (${data.subject || 'No Subject'}): ${data.message?.substring(0, 50)}...`;
    }).join('\n');

    const activityContext = recentInquiries || "No recent inquiries found.";

    cache.set(CACHE_KEY, activityContext, CACHE_TTL);
    return activityContext;
};

export const getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await getStatsInternal();
    res.status(200).json({
        success: true,
        message: "Stats fetched successfully",
        data: stats
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    logger.info(`AI Chat Request received. Prompt: ${prompt?.substring(0, 50)}...`);

    if (!prompt) {
        throw new ApiError(400, "Prompt is required");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new ApiError(500, "Gemini API key is not configured");
    }

    try {
        // Fetch real-time data for context
        const stats = await getStatsInternal();
        const recentActivity = await getRecentActivityInternal();

        const dbContext = `
        CURRENT DASHBOARD DATA:
        - Total Inquiries: ${stats.totalInquiries}
        - Active Appointments: ${stats.activeAppointments}
        - Teacher Requests: ${stats.teacherRequests}
        - Resolution Rate: ${stats.resolutionRate}

        RECENT INQUIRIES (Last 5):
        ${recentActivity}
        `;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `
        You are a smart and helpful administrative assistant for RightTutor.
        
        ${dbContext}
        
        Additional Context: ${context || 'General interaction'}
        
        Goal: Answer questions based on the REAL data provided above. If asked about "how many inquiries" or "recent activity", use the data provided.
        Tone: Professional, concise, and friendly.
        `;

        const chat = model.startChat({
            history: [],
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI request timeout")), 30000)
        );

        const resultPromise = chat.sendMessage(`${systemInstruction}\n\nUser Question: ${prompt}`);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            success: true,
            data: text
        });
    } catch (error) {
        logger.error("AI Chat Error:", error);
        throw new ApiError(500, `AI chat failed: ${error.message}`);
    }
});
