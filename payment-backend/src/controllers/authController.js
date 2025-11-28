import joi from "joi";
import * as authService from "../services/auth.service.js";
import Merchant from "../models/Merchant.js";

const registerSchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(8)
    .pattern(new RegExp("(?=.*[a-z])")) // at least one lowercase
    .pattern(new RegExp("(?=.*[A-Z])")) // at least one uppercase
    .pattern(new RegExp("(?=.*[0-9])")) // at least one number
    .pattern(new RegExp("(?=.*[!@#$%^&*])")) // at least one special char
    .required()
    .messages({
      "string.pattern.base":
        "Password must have uppercase, lowercase, number, and special character!",
      "string.min": "Password must be at least 8 characters long",
    }),
  merchantName: joi.string().min(2).required(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

export async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { name, email, password, merchantName } = value;

    const result = await authService.createUserAndMerchant({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      merchantName: merchantName.trim(),
    });
    res.status(201).json({ token: result.token, merchant: result.merchant });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { email, password } = value;
    const result = await authService.loginUser({
      email: email.trim().toLowerCase(),
      password,
    });
    res.status(201).json({ token: result.token, merchant: result.merchant });
  } catch (err) {
    return res.status(401).json({ err: "Invalid credentials" });
  }
}

export async function logout(req, res) {
  return res.json({ message: "Logged out successfully" });
}
