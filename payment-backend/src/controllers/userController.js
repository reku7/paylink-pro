import User from "../models/User.js";
import fs from "fs";
import path from "path";

// GET /me
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      "name avatar roles email",
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

// PUT /me
export async function updateMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name } = req.body;
    if (name) user.name = name;

    if (req.file) {
      if (user.avatar) {
        const oldPath = path.join(process.cwd(), "public", user.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    res.json({
      user: {
        name: user.name,
        avatar: user.avatar,
        roles: user.roles,
        email: user.email,
      },
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}
