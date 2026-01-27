import User from "../models/User.js";

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      "name email avatar roles",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

export async function updateMe(req, res) {
  try {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true },
    ).select("name email avatar roles");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}
