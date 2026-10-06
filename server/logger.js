// server/logger.js — append-only JSONL logger

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'search_log.jsonl');

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function appendLog(row) {
  ensureDir();
  const line = JSON.stringify({ ...row, timestamp: new Date().toISOString() }) + '\n';
  fs.appendFileSync(LOG_FILE, line, 'utf8');
}

export function readAllLogs() {
  ensureDir();
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

export function computeAggregates(logs) {
  const sessions = {};
  let feedbackEaseSum = 0;
  let feedbackEaseCount = 0;
  let feedbackFoundYesCount = 0;
  let feedbackFoundTotal = 0;

  for (const row of logs) {
    const sid = row.sessionId || 'unknown';
    if (!sessions[sid]) sessions[sid] = { searches: 0, scenarios: 0, targetsFoundToday: 0, targetsFoundGuided: 0 };
    sessions[sid].searches++;
    if (row.mode === 'scenario') {
      sessions[sid].scenarios++;
      if (row.targetFound?.today) sessions[sid].targetsFoundToday++;
      if (row.targetFound?.guided) sessions[sid].targetsFoundGuided++;
    }

    if (row.mode === 'feedback' || row.easeRating !== undefined || row.foundPhoto !== undefined || row.found !== undefined || row.ease !== undefined) {
      const ease = row.easeRating ?? row.ease;
      if (typeof ease === 'number' && !isNaN(ease) && ease >= 1 && ease <= 5) {
        feedbackEaseSum += ease;
        feedbackEaseCount++;
      }
      const isYes = row.foundPhoto === 'Yes' || row.found === true;
      const isNo = row.foundPhoto === 'No' || row.found === false;
      if (isYes || isNo) {
        feedbackFoundTotal++;
        if (isYes) feedbackFoundYesCount++;
      }
    }
  }

  const sessArr = Object.entries(sessions).map(([id, v]) => ({ sessionId: id, ...v }));
  const totalScenarios = sessArr.reduce((s, x) => s + x.scenarios, 0);
  const totalFoundToday = sessArr.reduce((s, x) => s + x.targetsFoundToday, 0);
  const totalFoundGuided = sessArr.reduce((s, x) => s + x.targetsFoundGuided, 0);

  return {
    totalLogs: logs.length,
    totalSessions: sessArr.length,
    sessions: sessArr,
    scenarioTargetFoundRate: {
      today: totalScenarios ? ((totalFoundToday / totalScenarios) * 100).toFixed(1) : null,
      guided: totalScenarios ? ((totalFoundGuided / totalScenarios) * 100).toFixed(1) : null,
    },
    feedbackStats: {
      avgEase: feedbackEaseCount ? (feedbackEaseSum / feedbackEaseCount).toFixed(1) : null,
      foundPhotoYesPct: feedbackFoundTotal ? ((feedbackFoundYesCount / feedbackFoundTotal) * 100).toFixed(1) : null,
      totalFeedback: feedbackEaseCount || feedbackFoundTotal,
    },
  };
}
