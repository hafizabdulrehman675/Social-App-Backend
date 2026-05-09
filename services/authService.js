"use strict";

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const AppError = require("../utils/appError");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  avatarUrl: user.avatarUrl,
  bio: user.bio ?? null,
});

const register = async (payload) => {
  const { username, fullName, email, password } = payload;

  if (!username || !fullName || !email || !password) {
    throw new AppError(
      "Please provide username, fullName, email and password",
      400,
    );
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError("Email already registered. Please use another.", 400);
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    throw new AppError("Username already taken. Please choose another.", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    fullName,
    email,
    password: hashedPassword,
    avatarUrl: null,
    bio: null,
  });

  const token = generateToken(user.id);
  return { token, user: formatUser(user) };
};

const login = async (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError("Incorrect email or password", 401);

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect)
    throw new AppError("Incorrect email or password", 401);

  const token = generateToken(user.id);
  return { token, user: formatUser(user) };
};

const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError("User no longer exists", 401);
  return { user: formatUser(user) };
};

const forgotPassword = async (payload) => {
  const identity = payload?.identity?.trim();
  const newPassword = payload?.newPassword;

  if (!identity || !newPassword) {
    throw new AppError("Please provide username/email and new password", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const normalizedIdentity = identity.toLowerCase();
  const user = await User.findOne({
    where: normalizedIdentity.includes("@")
      ? { email: normalizedIdentity }
      : { username: identity },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return {
    message: "Password updated successfully. Please log in.",
  };
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
};
