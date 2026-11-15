// Usage: npm run hash-password            (prompts, input hidden)
// Prints a value for the AUTH_PASSWORD_HASH environment variable.
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";

function ask(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(prompt)) process.stdout.write(s); };
    rl.question(prompt, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

const password = process.env.PASSWORD ?? (await ask("Password (10+ characters): "));
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}
const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, hash) => {
  if (err) throw err;
  console.log(["scrypt", N, r, p, salt.toString("hex"), hash.toString("hex")].join(":"));
});
