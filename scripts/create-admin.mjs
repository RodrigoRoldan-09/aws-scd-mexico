/**
 * Crea (o actualiza) el usuario admin a partir de .env.local.
 *
 * Lee ADMIN_EMAIL, ADMIN_NAME y ADMIN_PASSWORD. La contraseña se guarda
 * hasheada con bcrypt y 12 rondas, que es exactamente lo que usa
 * /api/auth/login para comparar — si acá se usara otro coste o otra
 * librería, el login fallaría sin decir por qué.
 *
 * Es idempotente: si el correo ya existe, actualiza nombre, rol y contraseña
 * en lugar de reventar por el índice único de email.
 *
 * Se corre desde tu máquina (tu IP está en la whitelist de Atlas); no hace
 * falta subirlo al VPS, porque escribe en la misma base que usará el VPS.
 *
 *   npm run create-admin
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/** Lee .env.local sin dependencias: sólo KEY=VALOR, ignorando comentarios. */
function loadEnv(path = ".env.local") {
  const env = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    let v = line.slice(i + 1).trim();
    // Quita comillas envolventes si las hay.
    if (v.length > 1 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv();

const uri = env.MONGODB_URI;
const email = (env.ADMIN_EMAIL || "").toLowerCase().trim();
const name = (env.ADMIN_NAME || "").trim();
const password = env.ADMIN_PASSWORD || "";

const missing = Object.entries({ MONGODB_URI: uri, ADMIN_EMAIL: email, ADMIN_NAME: name, ADMIN_PASSWORD: password })
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error("Faltan variables en .env.local: " + missing.join(", "));
  process.exit(1);
}
if (password.length < 8) {
  console.error("ADMIN_PASSWORD es demasiado corta (mínimo 8 caracteres).");
  process.exit(1);
}

// El esquema se declara mínimo y con strict:false: este script sólo toca los
// campos del admin y no debe imponerle una forma a la colección.
const User = mongoose.model(
  "User",
  new mongoose.Schema({}, { strict: false, timestamps: true, collection: "users" }),
);

await mongoose.connect(uri);
console.log("conectado a:", mongoose.connection.name);

const passwordHash = await bcrypt.hash(password, 12);
const existing = await User.findOne({ email }).lean();

await User.updateOne(
  { email },
  {
    $set: { email, name, role: "admin", passwordHash },
    // Sólo en la creación: no pisar el estado de sesión de un admin que ya usa
    // el panel.
    $setOnInsert: { allowedBadges: [], currentSessionId: null, lastLoginAt: null, sentCampaigns: [] },
  },
  { upsert: true },
);

const user = await User.findOne({ email }).lean();
console.log(existing ? "admin ACTUALIZADO" : "admin CREADO");
console.log("  _id  :", String(user._id));
console.log("  email:", user.email);
console.log("  name :", user.name);
console.log("  role :", user.role);
console.log("  pass : (hash bcrypt guardado, no se imprime)");

await mongoose.disconnect();
