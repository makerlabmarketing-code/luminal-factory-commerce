import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";

const binaryExtensions = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mp4",
  ".png",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
]);

const trackedFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => Boolean(file) && existsSync(file));
const textFiles = trackedFiles.filter((file) => !binaryExtensions.has(extname(file).toLowerCase()));
const failures = [];

const secretSignatures = [
  ["GitHub token", /(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})/g],
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{20,}/g],
  ["Stripe secret key", /sk_(?:live|test)_[A-Za-z0-9]{20,}/g],
  ["Resend API key", /\bre_[A-Za-z0-9]{30,}\b/g],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];

for (const file of textFiles) {
  const source = readFileSync(file, "utf8");
  for (const [label, pattern] of secretSignatures) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) failures.push(`${file}: contains a value matching ${label}`);
  }
}

const runtimeFiles = textFiles.filter(
  (file) => file.startsWith("src/") || /^next\.config\.[cm]?[jt]s$/.test(file),
);
const forbiddenPublicName =
  /NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|ACCESS_TOKEN|PASSWORD|PRIVATE_KEY|DATABASE_URL|RESEND|STRIPE_SECRET)[A-Z0-9_]*/g;
const dangerousRuntimePatterns = [
  ["dynamic eval", /\beval\s*\(/g],
  ["dynamic Function constructor", /\bnew\s+Function\s*\(/g],
  ["shell/process execution", /(?:node:)?child_process/g],
];

for (const file of runtimeFiles) {
  const source = readFileSync(file, "utf8");
  forbiddenPublicName.lastIndex = 0;
  const publicNames = source.match(forbiddenPublicName) ?? [];
  for (const name of new Set(publicNames)) {
    failures.push(`${file}: forbidden public environment variable ${name}`);
  }
  for (const [label, pattern] of dangerousRuntimePatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) failures.push(`${file}: contains ${label}`);
  }
}

for (const file of textFiles.filter((file) => /^next\.config\.[cm]?[jt]s$/.test(file))) {
  if (/\benv\s*:/.test(readFileSync(file, "utf8"))) {
    failures.push(`${file}: next.config env values are bundled into browser code`);
  }
}

const approvedOutboundHosts = new Set(["api.resend.com"]);
for (const file of runtimeFiles.filter((file) => file.startsWith("src/"))) {
  const source = readFileSync(file, "utf8");
  const hardcodedFetches = source.matchAll(/fetch\(\s*["'`](https:\/\/[^"'`/]+)/g);
  for (const match of hardcodedFetches) {
    const host = new URL(`${match[1]}/`).hostname;
    if (!approvedOutboundHosts.has(host)) {
      failures.push(`${file}: unapproved hard-coded outbound fetch host ${host}`);
    }
  }
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
for (const hook of ["preinstall", "postinstall", "prepare"]) {
  if (packageJson.scripts?.[hook]) failures.push(`package.json: lifecycle hook ${hook} requires review`);
}

if (failures.length > 0) {
  console.error("Security gate failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Security static gate passed (${textFiles.length} tracked text files, ${runtimeFiles.length} runtime files).`,
);
