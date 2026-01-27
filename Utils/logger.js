import winston from "winston";

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || "development";
    const isDevelopment = env === "development";
    return isDevelopment ? "debug" : "warn";
};

const colors = {
    error: "red",
    warn: "yellow",
    info: "blue",
    http: "magenta",
    debug: "white",
};

winston.addColors(colors);

// Helper to mask sensitive strings
const maskPII = (val) => {
    if (typeof val !== 'string') return val;
    // Mask emails
    if (val.includes('@')) {
        const [name, domain] = val.split('@');
        return `${name[0]}${new Array(name.length).join('*')}@${domain}`;
    }
    // Mask phone numbers (very simple)
    if (/^\+?[\d\s-]{10,}$/.test(val)) {
        return `${val.slice(0, 3)}****${val.slice(-2)}`;
    }
    return val;
};

// Winston format to mask sensitive information
const maskFormat = winston.format((info) => {
    if (typeof info.message === 'string') {
        // Regex for emails and phone-like patterns in messages
        info.message = info.message.replace(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g, (match) => maskPII(match));
    }
    return info;
});

const format = winston.format.combine(
    maskFormat(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
    }),
    new winston.transports.File({ filename: "logs/all.log" }),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export default logger;
