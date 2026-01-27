import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../Config/firebase.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'righttutor_secret_key_123';
const adminCollection = db.collection("admins");

export const adminSignup = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields (name, email, password) are required");
    }

    // Check if user already exists
    const userSnapshot = await adminCollection.where("email", "==", email).get();
    if (!userSnapshot.empty) {
        throw new ApiError(409, "An administrator with this email already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
        name,
        email,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        role: 'admin',
        createdAt: new Date().toISOString()
    };

    const docRef = await adminCollection.add(newUser);

    // Don't send password back
    const { password: _, ...userWithoutPassword } = newUser;
    const userResponse = { id: docRef.id, ...userWithoutPassword };

    const token = jwt.sign(userResponse, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
        success: true,
        message: "Administrator registered successfully",
        data: {
            user: userResponse,
            token
        }
    });
});

export const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find admin by email
    const userSnapshot = await adminCollection.where("email", "==", email).limit(1).get();

    if (userSnapshot.empty) {
        throw new ApiError(401, "Invalid administrative credentials");
    }

    const adminDoc = userSnapshot.docs[0];
    const adminData = adminDoc.data();

    // Verify password
    const isMatch = await bcrypt.compare(password, adminData.password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid administrative credentials");
    }

    const user = {
        id: adminDoc.id,
        uid: adminDoc.id,
        email: adminData.email,
        name: adminData.name,
        avatar: adminData.avatar,
        role: 'admin'
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            user,
            token
        }
    });
});
