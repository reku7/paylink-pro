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
    const { name } = req.body;
    const updateData = {};

    if (name) updateData.name = name;

    // Handle avatar upload
    // Handle avatar upload
    if (req.file) {
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      updateData.avatar = avatarPath;

      // delete old avatar if exists
      const user = await User.findById(req.user.id);
      if (user?.avatar) {
        const oldPath = path.join(process.cwd(), "public", user.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("name avatar roles email");

    res.json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}
