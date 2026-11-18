/**
 * Rotate a user's password against the database in DATABASE_URL.
 *
 * The seeded demo accounts are public on purpose, including the admin account.
 * After a reviewer finishes with the hosted demo, rotate the admin password with
 * this script so the operations console is no longer open to everyone:
 *
 *   npx tsx scripts/set-password.ts admin@bimcred.com "a-new-long-password"
 *
 * The password is hashed with bcrypt (10 rounds), exactly like the seed and the
 * login action. It never touches the audit log; a real deployment would add an
 * `admin.password.rotated` event and invalidate existing sessions.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [emailArg, password] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/set-password.ts <email> <new-password>");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Use at least 12 characters so the public demo cannot be guessed.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) {
    console.error(`No user found for ${email}.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: bcrypt.hashSync(password, 10) },
  });

  console.log(`Password updated for ${email} (${user.role}). Existing sessions stay valid until they expire.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
