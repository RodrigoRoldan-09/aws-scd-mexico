/**
 * Carga en la base las preguntas por defecto del FAQ, copiadas de
 * src/messages/{es,en}.json, para que se puedan editar desde el panel.
 * Sin esto el sitio muestra las del JSON y el panel aparece vacío.
 *
 * Idempotente: identifica cada FAQ por su pregunta en español, así que
 * correrlo dos veces actualiza en lugar de duplicar.
 *
 *   npm run seed:faq
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";

function loadEnv(path = ".env.local") {
  const env = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
if (!env.MONGODB_URI) {
  console.error("Falta MONGODB_URI en .env.local");
  process.exit(1);
}

const es = JSON.parse(readFileSync("src/messages/es.json", "utf8")).FAQ;
const en = JSON.parse(readFileSync("src/messages/en.json", "utf8")).FAQ;

// Se recorre hasta que se acabe la numeración en vez de asumir 10: si mañana
// se agrega q11 a los mensajes, este script la toma sin cambios.
const items = [];
for (let n = 1; ; n++) {
  const qEs = es?.[`q${n}`];
  const aEs = es?.[`a${n}`];
  if (!qEs || !aEs) break;
  const qEn = en?.[`q${n}`];
  const aEn = en?.[`a${n}`];
  if (!qEn || !aEn) {
    console.warn(`  aviso: q${n} no tiene traducción al inglés, se usa el español`);
  }
  items.push({
    questionEs: qEs,
    answerEs: aEs,
    questionEn: qEn || qEs,
    answerEn: aEn || aEs,
    order: n,
    isActive: true,
    buttons: [],
  });
}

if (!items.length) {
  console.error("No encontré preguntas (FAQ.q1/FAQ.a1) en src/messages/es.json");
  process.exit(1);
}

const FAQ = mongoose.model(
  "FAQ",
  new mongoose.Schema({}, { strict: false, timestamps: true, collection: "faqs" }),
);

await mongoose.connect(env.MONGODB_URI);
console.log("conectado a:", mongoose.connection.name);

let creadas = 0;
let actualizadas = 0;
for (const it of items) {
  const res = await FAQ.updateOne({ questionEs: it.questionEs }, { $set: it }, { upsert: true });
  if (res.upsertedCount) creadas++;
  else actualizadas++;
}

console.log(`\n${creadas} creadas, ${actualizadas} actualizadas`);
console.log("total en la base:", await FAQ.countDocuments());
for (const f of await FAQ.find().sort({ order: 1 }).lean()) {
  console.log(`  ${String(f.order).padStart(2)}. ${f.questionEs}`);
}

await mongoose.disconnect();
