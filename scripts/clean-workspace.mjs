import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const scope = readScopeArg();
const dryRun = args.has("--dry-run");
const includeLogs = args.has("--logs");
const includeTemp = args.has("--temp");
const includeBuildArtifacts = args.has("--build") || args.has("--all");
const includeDefaultSet = !includeLogs && !includeTemp && !args.has("--all");

const shouldCleanLogs = includeDefaultSet || includeLogs || args.has("--all");
const shouldCleanTemp = includeDefaultSet || includeTemp || args.has("--all");

const scopeRoots = {
  all: [""],
  frontend: ["frontend"],
  backend: ["backend"]
};

const protectedPathPrefixes = ["backend/storage", "backend/src", "frontend/src", "frontend/public"];

const directLogTargets = [
  "app.err.log",
  "app.out.log",
  "bootrun.err.log",
  "bootrun.out.log",
  "backend/app.err.log",
  "backend/app.out.log",
  "backend/bootrun.err.log",
  "backend/bootrun.out.log",
  "backend/chat-test.err.log",
  "backend/chat-test.out.log",
  "frontend/dev.err.log",
  "frontend/dev.out.log",
  "frontend/npm-debug.log",
  "frontend/yarn-debug.log",
  "frontend/yarn-error.log",
  "frontend/pnpm-debug.log"
];

const directTempTargets = ["frontend/tsconfig.tsbuildinfo", "tsconfig.tsbuildinfo"];

const directBuildTargets = [
  ".gradle",
  "backend/build",
  "backend/.gradle",
  "frontend/.next",
  "frontend/out",
  "frontend/.turbo",
  "frontend/coverage"
];

const skipDirectories = new Set([".git", "node_modules", ".next", ".idea", "storage", "gradle", "build", ".gradle", "out"]);
const logFileRegex = /(^|\/)(npm-debug\.log.*|yarn-debug\.log.*|yarn-error\.log.*|pnpm-debug\.log.*|.+\.log)$/i;
const tempFileRegex = /\.(tmp|temp|tsbuildinfo)$/i;
const tempDirNames = new Set(["tmp", "temp", ".cache", "coverage"]);

function readScopeArg() {
  for (const arg of args) {
    if (!arg.startsWith("--scope=")) continue;
    const value = arg.slice("--scope=".length).trim().toLowerCase();
    if (value === "frontend" || value === "backend" || value === "all") return value;
  }
  return "all";
}

function normalizeRelativePath(inputPath) {
  return inputPath.replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function toAbsolute(relativePath) {
  return path.resolve(repoRoot, normalizeRelativePath(relativePath));
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function pathInScope(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  if (scope === "all") return true;
  if (scope === "frontend") return normalized === "frontend" || normalized.startsWith("frontend/");
  if (scope === "backend") {
    return (
      normalized === "backend" ||
      normalized.startsWith("backend/") ||
      normalized === ".gradle" ||
      normalized.startsWith(".gradle/")
    );
  }
  return false;
}

function isProtected(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  if (normalized.endsWith(".env") || normalized.endsWith(".env.local")) return true;
  return protectedPathPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

function collectTargets() {
  const targets = new Set();

  if (shouldCleanLogs) {
    for (const target of directLogTargets) {
      if (pathInScope(target)) targets.add(normalizeRelativePath(target));
    }
  }

  if (shouldCleanTemp) {
    for (const target of directTempTargets) {
      if (pathInScope(target)) targets.add(normalizeRelativePath(target));
    }
  }

  if (includeBuildArtifacts) {
    for (const target of directBuildTargets) {
      if (pathInScope(target)) targets.add(normalizeRelativePath(target));
    }
  }

  for (const root of scopeRoots[scope]) {
    for (const found of walkForArtifacts(root)) {
      targets.add(found);
    }
  }

  return targets;
}

function walkForArtifacts(relativeRoot) {
  const results = [];
  const rootPath = toAbsolute(relativeRoot || ".");
  if (!exists(rootPath)) return results;

  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      const relativePath = normalizeRelativePath(path.relative(repoRoot, absolutePath));
      if (!pathInScope(relativePath) || isProtected(relativePath)) continue;

      if (entry.isDirectory()) {
        if (skipDirectories.has(entry.name)) continue;
        if (shouldCleanTemp && tempDirNames.has(entry.name.toLowerCase())) {
          results.push(relativePath);
          continue;
        }
        stack.push(absolutePath);
        continue;
      }

      if (shouldCleanLogs && logFileRegex.test(entry.name)) {
        results.push(relativePath);
        continue;
      }

      if (shouldCleanTemp && tempFileRegex.test(entry.name)) {
        results.push(relativePath);
      }
    }
  }

  return results;
}

function removeTarget(relativeTarget) {
  const absoluteTarget = toAbsolute(relativeTarget);
  if (!exists(absoluteTarget)) return { removed: false };

  const stat = fs.statSync(absoluteTarget);
  if (dryRun) return { removed: true };

  if (stat.isDirectory()) {
    fs.rmSync(absoluteTarget, { recursive: true, force: true });
    return { removed: true };
  }

  fs.rmSync(absoluteTarget, { force: true });
  return { removed: true };
}

function modeLabel() {
  const parts = [];
  if (shouldCleanLogs) parts.push("logs");
  if (shouldCleanTemp) parts.push("temp");
  if (includeBuildArtifacts) parts.push("build");
  return parts.length ? parts.join("+") : "none";
}

const targets = collectTargets();
const removed = [];
const failed = [];

for (const relativeTarget of targets) {
  try {
    const result = removeTarget(relativeTarget);
    if (result.removed) {
      removed.push(relativeTarget);
    }
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "ERROR";
    const absoluteTarget = toAbsolute(relativeTarget);

    if (!dryRun && code === "EPERM" && /\.log$/i.test(relativeTarget) && exists(absoluteTarget)) {
      try {
        fs.writeFileSync(absoluteTarget, "", "utf8");
        removed.push(`${relativeTarget} (truncate)`);
        continue;
      } catch {
        // fall through to failed list
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    failed.push({ relativeTarget, code, message });
  }
}

if (removed.length === 0) {
  console.log(`[clean-workspace] No artifacts to remove (scope=${scope}, mode=${modeLabel()}).`);
  if (failed.length > 0) {
    console.log(`[clean-workspace] ${failed.length} item(s) could not be removed:`);
    for (const item of failed) {
      console.log(`- ${item.relativeTarget} [${item.code}]`);
    }
  }
  process.exit(0);
}

const actionLabel = dryRun ? "Would remove" : "Removed";
console.log(
  `[clean-workspace] ${actionLabel} ${removed.length} item(s) (scope=${scope}, mode=${modeLabel()})${
    dryRun ? " [dry-run]" : ""
  }:`
);
for (const item of removed.sort((a, b) => a.localeCompare(b))) {
  console.log(`- ${item}`);
}

if (failed.length > 0) {
  console.log(`[clean-workspace] ${failed.length} item(s) could not be removed:`);
  for (const item of failed) {
    console.log(`- ${item.relativeTarget} [${item.code}]`);
  }
}
