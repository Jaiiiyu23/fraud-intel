const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { requireJWT, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerOrgSchema = z.object({
  orgName: z.string().min(2),
  orgType: z.enum(["GOVERNMENT", "NGO", "LAW_ENFORCEMENT", "RESEARCH"]),
  email: z.string().email(),
  password: z.string().min(8),
  adminName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/v1/auth/register
// Register a new organization + admin user
router.post("/register", async (req, res) => {
  try {
    const data = registerOrgSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(data.password, 12);

    const org = await prisma.organization.create({
      data: {
        name: data.orgName,
        type: data.orgType,
        email: data.email,
        users: {
          create: {
            email: data.email,
            passwordHash,
            name: data.adminName,
            role: "ADMIN",
          },
        },
      },
      include: { users: true },
    });

    const user = org.users[0];
    const token = jwt.sign(
      { userId: user.id, orgId: org.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      message: "Organization registered successfully",
      token,
      org: { id: org.id, name: org.name, type: org.type },
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = jwt.sign(
      { userId: user.id, orgId: user.orgId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      org: { id: user.org.id, name: user.org.name, type: user.org.type },
    });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/v1/auth/api-keys - Create API key for org
router.post("/api-keys", requireJWT, async (req, res) => {
  try {
    const { name, permissions = ["read"], expiresInDays, rateLimit = 1000 } = req.body;

    const key = `ifi_${uuidv4().replace(/-/g, "")}`;
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name,
        orgId: req.user.orgId,
        permissions,
        rateLimit,
        expiresAt,
      },
    });

    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key, // Only shown once
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create API key" });
  }
});

// GET /api/v1/auth/api-keys - List org's API keys
router.get("/api-keys", requireJWT, async (req, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { orgId: req.user.orgId },
    select: { id: true, name: true, permissions: true, usageCount: true, lastUsedAt: true, expiresAt: true, isActive: true, createdAt: true },
  });
  res.json({ keys });
});

// DELETE /api/v1/auth/api-keys/:id - Revoke key
router.delete("/api-keys/:id", requireJWT, async (req, res) => {
  await prisma.apiKey.updateMany({
    where: { id: req.params.id, orgId: req.user.orgId },
    data: { isActive: false },
  });
  res.json({ message: "API key revoked" });
});

module.exports = router;
