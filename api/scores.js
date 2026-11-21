// Leaderboard API (Vercel Node function), backed by Supabase.
//   GET  /api/scores           -> { top: [{ name, score, wave }] }   best run per name, top 10
//   POST /api/scores  { name, score, wave, secs }
//                              -> { ok, rank, best, top }
// Env vars (Vercel -> Project -> Settings -> Environment Variables):
//   SUPABASE_SERVICE_ROLE_KEY  required, the service_role / secret key (never sent to browsers)
//   SUPABASE_URL               optional, defaults to this project's Supabase URL
// Table + view: see supabase/leaderboard.sql.

const crypto = require('crypto');

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://dkgwmqujhxwnzrnxiswm.supabase.co').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TOP_N = 10;
const NAME_RE = /^[A-Z0-9_]{1,15}$/;
const MAX_POINTS_PER_SEC = 300; // generous ceiling; real runs score far less
const MIN_GAP_SECS = 15;        // one submit per player every 15s

function headers(extra) {
  const h = { apikey: KEY, 'Content-Type': 'application/json', ...extra };
  if (KEY.startsWith('eyJ')) h.Authorization = 'Bearer ' + KEY; // legacy JWT service_role key
  return h;
}

async function rest(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: headers(opts.headers) });
  if (!r.ok) throw new Error(`supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r;
}

async function topScores() {
  const r = await rest(`leaderboard?select=name,score,wave&limit=${TOP_N}`);
  return r.json();
}

// count rows matching a filter without fetching them
async function count(path) {
  const r = await rest(path, { headers: { Prefer: 'count=exact', Range: '0-0' } });
  const m = /\/(\d+)$/.exec(r.headers.get('content-range') || '');
  return m ? +m[1] : 0;
}

function clientIpHash(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim() || 'unknown';
  return crypto.createHash('sha256').update((process.env.IP_SALT || KEY) + '|' + ip).digest('hex').slice(0, 32);
}

// returns a cleaned entry, or a string explaining why it was rejected
function validate(body) {
  if (!body || typeof body !== 'object') return 'bad request';
  const name = String(body.name || '').trim().replace(/^@/, '').toUpperCase();
  const score = Number(body.score), wave = Number(body.wave), secs = Number(body.secs);
  if (!NAME_RE.test(name)) return 'name must be 1-15 letters, numbers or _';
  if (!Number.isInteger(score) || score < 0 || score > 10000000) return 'bad score';
  if (!Number.isInteger(wave) || wave < 1 || wave > 999) return 'bad wave';
  if (!Number.isFinite(secs) || secs < 1 || secs > 86400) return 'bad play time';
  if (score > secs * MAX_POINTS_PER_SEC) return 'score not possible in that time';
  return { name, score, wave, play_secs: Math.round(secs) };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!KEY) return res.status(503).json({ error: 'leaderboard not configured' });
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return res.status(200).json({ top: await topScores() });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
    const entry = validate(body);
    if (typeof entry === 'string') return res.status(400).json({ error: entry });

    const ip_hash = clientIpHash(req);
    const since = new Date(Date.now() - MIN_GAP_SECS * 1000).toISOString();
    if (await count(`scores?select=id&ip_hash=eq.${ip_hash}&created_at=gte.${encodeURIComponent(since)}`))
      return res.status(429).json({ error: 'slow down, try again in a few seconds' });

    await rest('scores', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ ...entry, ip_hash }) });

    // rank of this name's best run among every name's best run
    const own = await (await rest(`leaderboard?select=score&name=eq.${entry.name}&limit=1`)).json();
    const best = own.length ? own[0].score : entry.score;
    const rank = 1 + await count(`leaderboard?select=name&score=gt.${best}`);
    return res.status(200).json({ ok: true, rank, best, top: await topScores() });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: 'leaderboard unavailable' });
  }
};
module.exports.validate = validate;
