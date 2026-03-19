import { createHash } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node apps/api/scripts/hash-password.mjs TU_PASSWORD");
  process.exit(1);
}

console.log(createHash("sha256").update(password).digest("hex"));
