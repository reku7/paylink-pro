import joi from "joi";
import * as authService from "../services/auth.service.js";

// Updated schema with optional business fields for presentation
const registerSchema = joi.object({
  name: joi.string().min(2).max(100).required(),
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(8)
    .pattern(new RegExp("(?=.*[a-z])")) // lowercase
    .pattern(new RegExp("(?=.*[A-Z])")) // uppercase
    .pattern(new RegExp("(?=.*[0-9])")) // number
    .pattern(new RegExp("(?=.*[!@#$%^&*])")) // special char
    .required()
    .messages({
      "string.pattern.base":
        "Password must have uppercase, lowercase, number, and special character!",
      "string.min": "Password must be at least 8 characters long",
    }),
  merchantName: joi.string().min(2).required(),
  preferredGateway: joi.string().valid("chapa", "santimpay").required(),

  // Business info now fully optional
  business: joi
    .object({
      tinNumber: joi.string().optional(),
      fydaId: joi.string().optional(),
      businessAddress: joi.string().optional(),
      businessPhone: joi.string().optional(),
      businessEmail: joi.string().email().optional(),
      businessType: joi.string().optional(),
    })
    .optional(),

  // Optional Chapa API key if selected
  chapaApiKey: joi.string().when("preferredGateway", {
    is: "chapa",
    then: joi.required(),
    otherwise: joi.optional(),
  }),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

export async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message).join(", ") });

    const {
      name,
      email,
      password,
      merchantName,
      preferredGateway,
      business = {}, // default to empty object if not provided
      chapaApiKey,
    } = value;

    const result = await authService.createUserAndMerchant({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      merchantName: merchantName.trim(),
      preferredGateway,
      business,
      chapaApiKey, // will be used to connect Chapa after registration
    });

    res.status(201).json({ token: result.token, merchant: result.merchant });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(err);
  }
}

// Keep login and logout as is

export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { email, password } = value;
    const result = await authService.loginUser({
      email: email.trim().toLowerCase(),
      password,
    });
    res.status(200).json({ token: result.token, merchant: result.merchant });
  } catch (err) {
    return res.status(401).json({
      error: err.message || "Invalid credentials",
    });
  }
}

export async function logout(req, res) {
  return res.json({ message: "Logged out successfully" });
}
