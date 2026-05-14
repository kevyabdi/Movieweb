import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, copyFile, mkdir } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

const sharedConfig = {
  platform: "node",
  bundle: true,
  format: "esm",
  outExtension: { ".js": ".mjs" },
  logLevel: "info",
  external: [
    "*.node",
    "sharp",
    "better-sqlite3",
    "sqlite3",
    "canvas",
    "bcrypt",
    "argon2",
    "fsevents",
    "re2",
    "farmhash",
    "xxhash-addon",
    "bufferutil",
    "utf-8-validate",
    "ssh2",
    "cpu-features",
    "dtrace-provider",
    "isolated-vm",
    "lightningcss",
    "pg-native",
    "oracledb",
    "mongodb-client-encryption",
    "nodemailer",
    "handlebars",
    "knex",
    "typeorm",
    "protobufjs",
    "onnxruntime-node",
    "@tensorflow/*",
    "@prisma/client",
    "@mikro-orm/*",
    "@grpc/*",
    "@swc/*",
    "@aws-sdk/*",
    "@azure/*",
    "@opentelemetry/*",
    "@google-cloud/*",
    "@google/*",
    "googleapis",
    "firebase-admin",
    "@parcel/watcher",
    "@sentry/profiling-node",
    "@tree-sitter/*",
    "aws-sdk",
    "classic-level",
    "dd-trace",
    "ffi-napi",
    "grpc",
    "hiredis",
    "kerberos",
    "leveldown",
    "miniflare",
    "mysql2",
    "newrelic",
    "odbc",
    "piscina",
    "realm",
    "ref-napi",
    "rocksdb",
    "sass-embedded",
    "sequelize",
    "serialport",
    "snappy",
    "tinypool",
    "usb",
    "workerd",
    "wrangler",
    "zeromq",
    "zeromq-prebuilt",
    "playwright",
    "puppeteer",
    "puppeteer-core",
    "electron",
  ],
  sourcemap: false,
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
  },
};

const distDir = path.resolve(artifactDir, "dist");
// Serverless bundle destination — also copied into streamvault so Vercel
// can serve both the SPA and the API from a single project (rajolabs.com).
const serverlessDest = path.resolve(artifactDir, "api/index.js");
const streamvaultApiDir = path.resolve(artifactDir, "../streamvault/api");
const streamvaultDest = path.resolve(streamvaultApiDir, "index.js");

async function buildAll() {
  await rm(distDir, { recursive: true, force: true });

  // Main server bundle (used by Replit / self-hosted)
  await esbuild({
    ...sharedConfig,
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  });

  // Serverless bundle (used by Vercel) — self-contained ESM file.
  // Written to api/index.js (api-server project) then copied into
  // streamvault/api/index.js so the combined Vercel project can serve it.
  await esbuild({
    ...sharedConfig,
    entryPoints: [path.resolve(artifactDir, "src/serverless.ts")],
    outfile: serverlessDest,
    outExtension: {},
    plugins: [],
  });

  // Copy bundle into streamvault for combined deployment
  await mkdir(streamvaultApiDir, { recursive: true });
  await copyFile(serverlessDest, streamvaultDest);
  console.log(`[build] Copied serverless bundle → ${streamvaultDest}`);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
