import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV, EMAIL_USER, EMAIL_PASS } from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';
import nodemailer from 'nodemailer';
import validator from 'validator';

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;

    }

    if (user.role !== req.user.role) {
      const error = new Error("hmm, you are not allowed to do this");
      error.statusCode = 403;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: user,
    });

    next();
  } catch (error) {
    next(error);
  }
};

export const signUp = async (req, res, next) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, address, culture, email, password } = req.body;

    // validate email
    if (!validator.isEmail(email)) {
      const error = new Error('Invalid email');
      error.statusCode = 400;
      throw error;
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('User already exists');
      error.statusCode = 409;
      throw error;
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // generate a verification token
    const emailToken = Math.floor(100000 + Math.random() * 900000).toString();

    // attach session to the user creation if something goes wrong, we can rollback the transaction and not save the user
    const newUsers = await User.create([{
      name,
      email,
      address,
      cultureType: culture,

      password: hashedPassword,
      isVerified: false,
      emailToken,
      emailTokenExpires: Date.now() + 10 * 60 * 1000,
    }],
      { session });
    
    // Generate both access and refresh tokens like in signIn
    const accessToken = generateAccessToken(newUsers[0]);
    const refreshToken = generateRefreshToken(newUsers[0]);

    // Get user device info
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip;

    // Store refresh token in the database
    await RefreshToken.create({ userId: newUsers[0]._id, token: refreshToken, userAgent, ipAddress });

    // Store refresh token securely in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send email verification code
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: newUsers[0].email,
      subject: "Verify Your Email",
      text: `
      Hi ${newUsers[0].name},
      Your verification code is: ${emailToken}
      if you think this is a mistake, please ignore this email.
      `,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        accessToken,
        user: newUsers[0],
      }
    })
    next();

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);

  }
}

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Get user device info
    const userAgent = req.headers["user-agent"];  // Browser info
    const ipAddress = req.ip;

    // Store refresh token in the database
    await RefreshToken.create({ userId: user._id, token: refreshToken, userAgent, ipAddress });

    // Store refresh token securely in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    res.status(200).json({
      success: true,
      message: 'User signed in successfully',
      data: {
        accessToken,
        user,
      }
    });
    next();
  } catch (error) {
    next(error);
  }
}

export const signOut = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
      res.clearCookie("refreshToken");
    }
    res.json({ success: true, message: "Logged out successfully" });
    next();
  } catch (error) {
    next(error);
  }

};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken; // Read the refresh token from HTTP-only cookie
    if (!refreshToken) {
      const error = new Error("unauthorized");
      error.statusCode = 401;
      throw error;
    }

    // Check if refresh token exists in the database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      const error = new Error("Invalid refresh token");
      error.statusCode = 403;
      throw error;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error
    }

    // Check if the request comes from the same device
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip;

    if (storedToken.userAgent !== userAgent || storedToken.ipAddress !== ipAddress) {
      await RefreshToken.deleteOne({ token: refreshToken }); // Delete stolen token
      res.clearCookie("refreshToken");
      const error = new Error("Device mismatch. Please log in again.");
      error.statusCode = 403;
      throw error;
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Replace old refresh token in the database
    storedToken.token = newRefreshToken;
    await storedToken.save();

    // Send the refresh token in an HTTP-only cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "Lax",
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      }
    });
    next();
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.emailToken !== otp || user.emailTokenExpires < Date.now()) {
      const error = new Error("Invalid or expired otp");

      error.statusCode = 400;
      throw error;
    }

    // Mark email as verified
    user.isVerified = true;
    user.emailToken = null;
    user.emailTokenExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully" });
    next();
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (user.isVerified) {
      const error = new Error("Email is already verified");
      error.statusCode = 400;
      throw error;
    }

    // Generate new OTP
    const emailToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailToken = emailToken;
    user.emailTokenExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 min
    await user.save();

    // Send new OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: user.email,
      subject: "New Verification Code",
      text: `

      Hi ${user.name},
      Your new verification code is: 
       ${emailToken} 
       if you think this is a mistake, please ignore this email.
       Best Regards,
       Sano AI
      `
      ,
    });

    res.status(200).json({ success: true, message: "New verification email sent" });
    next();
  } catch (error) {
    next(error);
  }
};
