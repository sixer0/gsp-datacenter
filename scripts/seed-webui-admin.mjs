#!/usr/bin/env node
/**
 * Seed the first Brahma WebUI administrator.
 *
 * Usage:
 *   WEBUI_ADMIN_USERNAME=admin WEBUI_ADMIN_PASSWORD='...' WEBUI_ADMIN_PROFILE=default node scripts/seed-webui-admin.mjs
 *
 * The admin is pinned to a Hermes profile (usually 'default'). Admins have
 * full access in the WebUI and may switch profiles freely, so the profile
 * mapping here is mostly informational / default landing.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const username = (process.env.WEBUI_ADMIN_USERNAME || "").trim().toLowerCase();
  const password = process.env.WEBUI_ADMIN_PASSWORD || "";
  const hermesProfile = (process.env.WEBUI_ADMIN_PROFILE || "default").trim();
  if (!username || !password) {
    console.error("Usage: WEBUI_ADMIN_USERNAME=admin WEBUI_ADMIN_PASSWORD='...' node scripts/seed-webui-admin.mjs");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.webUiUser.findUnique({ where: { username } });
  if (existing) {
    const updated = await prisma.webUiUser.update({
      where: { id: existing.id },
      data: { passwordHash: hashPassword(password), role: "ADMINISTRATOR", hermesProfile },
    });
    console.log(`Updated existing admin '${username}' → role=ADMINISTRATOR profile=${updated.hermesProfile}`);
  } else {
    const created = await prisma.webUiUser.create({
      data: { username, passwordHash: hashPassword(password), role: "ADMINISTRATOR", hermesProfile },
    });
    console.log(`Created admin '${username}' (id=${created.id}) profile=${created.hermesProfile}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
