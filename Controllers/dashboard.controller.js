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

// Helper to get FULL DATABASE CONTEXT with caching
const getFullDatabaseContextInternal = async () => {
    const CACHE_KEY = "full_database_context";
    const CACHE_TTL = 600; // 10 minutes (longer cache for heavy data)

    const cachedContext = cache.get(CACHE_KEY);
    if (cachedContext) return cachedContext;

    // Parallel fetch for speed
    const [contactsSnap, bookingsSnap, matchesSnap] = await Promise.all([
        db.collection("contacts").orderBy('createdAt', 'desc').limit(100).get(), // Limit closest 100 for safety
        db.collection("bookings").orderBy('createdAt', 'desc').limit(100).get(),
        db.collection("manualMatches").orderBy('createdAt', 'desc').limit(100).get()
    ]);

    const contacts = contactsSnap.docs.map(doc => {
        const d = doc.data();
        return {
            name: d.name,
            email: d.email,
            phone: d.phone,
            subject: d.subject,
            message: d.message,
            status: d.status,
            date: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
        };
    });

    const bookings = bookingsSnap.docs.map(doc => {
        const d = doc.data();
        return {
            studentName: d.studentName,
            tutorName: d.tutorName,
            subject: d.subject,
            classTime: d.classTime,
            status: d.status,
            date: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
        };
    });

    const matches = matchesSnap.docs.map(doc => {
        const d = doc.data();
        return {
            parentName: d.parentName,
            requirements: d.requirements,
            suggestedTutor: d.suggestedTutor,
            status: d.status,
            date: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
        };
    });

    const fullContext = JSON.stringify({
        CONTACTS_TABLE: contacts,
        BOOKINGS_TABLE: bookings,
        MATCHES_TABLE: matches
    }, null, 2);

    cache.set(CACHE_KEY, fullContext, CACHE_TTL);
    return fullContext;
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
        // Fetch FULL DATABASE CONTEXT
        const dbContext = await getFullDatabaseContextInternal();
        const stats = await getStatsInternal(); // Lightweight cached stats

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `
        You are a highly capable Administrative AI for RightTutor with READ ACCESS to the company's database.
        
        === DATABASE STATS ===
        - Total Inquiries: ${stats.totalInquiries}
        - Active Bookings: ${stats.activeAppointments}
        - Teacher Matches: ${stats.teacherRequests}
        - Resolution Rate: ${stats.resolutionRate}

        === FULL DATABASE RECORDS (JSON Format) ===
        ${dbContext}
        
        === INSTRUCTIONS ===
        1. You have access to the actual data tables above (Contacts, Bookings, Matches).
        2. When asked about specific people, dates, subjects, or details, QUERY the JSON data above.
        3. Provide specific answers (e.g., "Yes, we have an inquiry from John about Math created on 2024-02-20").
        4. If the data isn't in the records above, explicitly say "I don't see that in the database."
        5. Structure your answers clearly.

        Context: ${context || 'General interaction'}
        Tone: Professional, Data-Driven, Helpful.
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
