
/**
 * Recursively removes all keys with an 'undefined' value from an object.
 * Firestore does not support 'undefined' as a value.
 */
export const cleanObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(cleanObject);
    }

    const cleaned = {};
    Object.keys(obj).forEach((key) => {
        const value = cleanObject(obj[key]);
        if (value !== undefined) {
            cleaned[key] = value;
        }
    });

    return cleaned;
};
