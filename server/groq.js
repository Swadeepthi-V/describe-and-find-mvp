// server/groq.js — Groq API call, validation, retry, in-memory cache

import Groq from 'groq-sdk';
import photos from '../photos.json' with { type: 'json' };

const { vocab } = photos;
const VALID = {
  look: new Set(vocab.look),
  person: new Set(vocab.person),
  when: new Set(vocab.when),
};

let cache = null; // { tags, accuracy, timestamp }

function validate(tags) {
  return tags.map((t) => ({
    id: t.id,
    look: VALID.look.has(t.look) ? t.look : null,
    person: VALID.person.has(t.person) ? t.person : null,
    when: VALID.when.has(t.when) ? t.when : null,
  }));
}

function computeAccuracy(aiTags) {
  const truth = {};
  for (const p of photos.photos) truth[p.id] = { look: p.look, person: p.person, when: p.when };

  let lookC = 0, personC = 0, whenC = 0, allC = 0;
  const total = photos.photos.length;

  for (const t of aiTags) {
    const gt = truth[t.id];
    if (!gt) continue;
    const lOk = t.look === gt.look;
    const pOk = t.person === gt.person;
    const wOk = t.when === gt.when;
    if (lOk) lookC++;
    if (pOk) personC++;
    if (wOk) whenC++;
    if (lOk && pOk && wOk) allC++;
  }

  return {
    look: { correct: lookC, total, pct: ((lookC / total) * 100).toFixed(1) },
    person: { correct: personC, total, pct: ((personC / total) * 100).toFixed(1) },
    when: { correct: whenC, total, pct: ((whenC / total) * 100).toFixed(1) },
    all: { correct: allC, total, pct: ((allC / total) * 100).toFixed(1) },
  };
}

export function getCached() {
  return cache;
}

export function clearCache() {
  cache = null;
}

async function callGroq(client) {
  const systemPrompt = `You are an AI photo tagger. Respond strictly with JSON.

Controlled Vocabularies:
- look: ${JSON.stringify(vocab.look)}
- person: ${JSON.stringify(vocab.person)}
- when: ${JSON.stringify(vocab.when)}

Instruction:
Classify each photo from the user's list. Choose exactly one value per category from the vocabulary above.
Return JSON in format: {"tags": [{"id": 1, "look": "...", "person": "...", "when": "..."}]}`;

  const captions = photos.photos.map((p) => `id ${p.id}: ${p.caption}`).join('\n');

  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please return JSON for these 43 photos:\n${captions}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  return response.choices[0].message.content;
}

export async function runTagging() {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let raw;
  try {
    raw = await callGroq(client);
  } catch (err) {
    if (err.status === 429) {
      const retryAfter = err.headers?.['retry-after'] || 30;
      const e = new Error('rate_limit');
      e.retryAfter = retryAfter;
      throw e;
    }
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // retry once
    raw = await callGroq(client);
    parsed = JSON.parse(raw);
  }

  if (!Array.isArray(parsed.tags)) {
    throw new Error('invalid_response: "tags" array missing');
  }

  const validated = validate(parsed.tags);
  const accuracy = computeAccuracy(validated);

  // merge ground truth for admin comparison
  const ground = {};
  for (const p of photos.photos) ground[p.id] = { look: p.look, person: p.person, when: p.when };

  const tagsWithTruth = validated.map((t) => ({
    ...t,
    _truth: ground[t.id] || null,
  }));

  cache = { tags: tagsWithTruth, accuracy, timestamp: new Date().toISOString(), cached: false };

  // subsequent reads are cached
  const result = { ...cache, cached: false };
  cache.cached = true;
  return result;
}
