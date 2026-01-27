import 'dotenv/config';

console.log("Checking Environment Variables...");

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (clientEmail) {
    console.log("Client Email found:", clientEmail.substring(0, 5) + "...");
} else {
    console.error("Client Email NOT found");
}

if (privateKey) {
    console.log("Private Key found. Length:", privateKey.length);
    console.log("First 30 chars:", privateKey.substring(0, 30));

    // Test the replacement logic used in the service
    const processedKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    console.log("Processed Key Length:", processedKey.length);
    console.log("Processed Key First 30:", processedKey.substring(0, 30));

    // Check if it looks like a valid key header
    if (processedKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
        console.log("✅ Key format looks correct");
    } else {
        console.error("❌ Key format looks INCORRECT");
    }
} else {
    console.error("Private Key NOT found");
}
