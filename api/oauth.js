// v365 · Sign in with your Life OS account, for Claude (OAuth 2.1 with PKCE).
// ?x=prm and ?x=meta are the well-known discovery documents (see vercel.json), ?x=register is dynamic client
// registration (clients are signed, nothing is stored), ?x=client checks a client for the consent page,
// ?x=approve turns your Life OS sign-in into a one-time code, and ?x=token trades codes and refresh tokens for access.
// Tokens are stored only as hashes, as records you can see and disconnect in Settings › Claude.
import { createClient } from '@supabase/supabase-js';
import { db0, sha, rand, b64u, unb64u, sign, origin } from './_mcp.js';
import { userFrom } from './_lib.js';

const ACCESS_TTL = 30 * 864e5, CODE_TTL = 10 * 6e4;
const okRedirect = u => { try { const x = new URL(u); return x.protocol === 'https:' || ((x.protocol === 'http:') && /^(localhost|127\.0\.0\.1)$/.test(x.hostname)); } catch (e) { return false; } };
const bodyOf = req => { const b = req.body; if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b; const s = Buffer.isBuffer(b) ? b.toString() : String(b || ''); try { return JSON.parse(s); } catch (e) { return Object.fromEntries(new URLSearchParams(s)); } };
const err = (res, code, e, d) => res.status(code).json({ error: e, error_description: d });

export async function clientInfo(id) {
  id = String(id || '');
  if (id.startsWith('lo.')) { const [, data, sig] = id.split('.'); if (!data || sign(data) !== sig) return null; const c = unb64u(data); return c ? { id, name: c.n || 'Claude', redirects: c.r || [] } : null; }
  if (/^https:\/\//.test(id)) { // a client ID metadata document (how Claude can identify itself)
    try { const r = await fetch(id, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(5000) }); if (!r.ok) return null; const m = await r.json(); if (m.client_id && m.client_id !== id) return null; return { id, name: m.client_name || new URL(id).hostname, redirects: (m.redirect_uris || []).filter(okRedirect) }; } catch (e) { return null; } }
  return null;
}
async function personFrom(req, b) {
  const u = await userFrom(req); if (u) return u;
  if (b.refresh_token && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) { try { const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); const { data } = await sb.auth.refreshSession({ refresh_token: String(b.refresh_token) }); if (data && data.user) return data.user; } catch (e) {} }
  return null;
}
async function issue(db, uid, client) {
  const at = rand(32), rt = rand(32), now = Date.now();
  await db.from('records').upsert([
    { user_id: uid, id: 'mcptok_' + sha(at), deleted: false, data: { id: 'mcptok_' + sha(at), kind: 'mcptoken', name: client.name, client_id: client.id, rt: sha(rt), created: now, exp: now + ACCESS_TTL, createdAt: now, updatedAt: now } },
    { user_id: uid, id: 'mcprt_' + sha(rt), deleted: false, data: { id: 'mcprt_' + sha(rt), kind: 'mcprt', name: client.name, client_id: client.id, tok: sha(at), created: now, createdAt: now, updatedAt: now } },
  ], { onConflict: 'user_id,id' });
  return { access_token: at, token_type: 'Bearer', expires_in: Math.round(ACCESS_TTL / 1000), refresh_token: rt, scope: 'lifeos' };
}
const byId = async (db, id) => { const { data } = await db.from('records').select('user_id,data').eq('id', id).eq('deleted', false).limit(1); return data && data[0] ? data[0] : null; };
const forget = (db, uid, id) => db.from('records').delete().eq('user_id', uid).eq('id', id);

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', 'authorization, content-type, mcp-protocol-version');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const x = (req.query && req.query.x) || '', O = origin(req), db = db0();
  if (x === 'prm') return res.status(200).json({ resource: `${O}/mcp`, authorization_servers: [O], scopes_supported: ['lifeos'], bearer_methods_supported: ['header'], resource_name: 'Life OS' });
  if (x === 'meta') return res.status(200).json({ issuer: O, authorization_endpoint: `${O}/oauth/authorize`, token_endpoint: `${O}/api/oauth?x=token`, registration_endpoint: `${O}/api/oauth?x=register`, response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'], scopes_supported: ['lifeos'], client_id_metadata_document_supported: true });
  if (x === 'register') {
    if (req.method !== 'POST') return res.status(405).end(); const b = bodyOf(req); const r = (b.redirect_uris || []).filter(okRedirect).slice(0, 8);
    if (!r.length) return err(res, 400, 'invalid_redirect_uri', 'Give at least one https redirect URI.');
    const n = String(b.client_name || 'Claude').slice(0, 60), data = b64u({ r, n }), id = `lo.${data}.${sign(data)}`;
    return res.status(201).json({ client_id: id, client_id_issued_at: Math.floor(Date.now() / 1000), client_name: n, redirect_uris: r, token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] });
  }
  if (x === 'client') { const c = await clientInfo(req.query.client_id); if (!c) return err(res, 400, 'invalid_client', 'This app isn’t recognised. Start again from Claude.'); if (!c.redirects.includes(String(req.query.redirect_uri || ''))) return err(res, 400, 'invalid_request', 'The return address doesn’t match. Start again from Claude.'); return res.status(200).json({ name: c.name }); }
  if (x === 'approve') {
    if (req.method !== 'POST') return res.status(405).end(); const b = bodyOf(req);
    const c = await clientInfo(b.client_id); if (!c || !c.redirects.includes(String(b.redirect_uri || ''))) return err(res, 400, 'invalid_client', 'Start again from Claude.');
    if (b.code_challenge_method !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(String(b.code_challenge || ''))) return err(res, 400, 'invalid_request', 'PKCE (S256) is required.');
    const u = await personFrom(req, b); if (!u) return err(res, 401, 'login_required', 'Sign in to Life OS in this browser first.');
    const code = rand(32), now = Date.now(), id = 'mcpcode_' + sha(code);
    await db.from('records').upsert({ user_id: u.id, id, deleted: false, data: { id, kind: 'mcpcode', client_id: c.id, name: c.name, redirect_uri: b.redirect_uri, challenge: b.code_challenge, exp: now + CODE_TTL, createdAt: now, updatedAt: now } }, { onConflict: 'user_id,id' });
    const to = new URL(b.redirect_uri); to.searchParams.set('code', code); if (b.state) to.searchParams.set('state', b.state); to.searchParams.set('iss', O);
    return res.status(200).json({ redirect: to.toString() });
  }
  if (x === 'token') {
    if (req.method !== 'POST') return res.status(405).end(); const b = bodyOf(req);
    if (b.grant_type === 'authorization_code') {
      const row = await byId(db, 'mcpcode_' + sha(b.code || '')); if (!row) return err(res, 400, 'invalid_grant', 'That code isn’t valid. Connect again.');
      await forget(db, row.user_id, 'mcpcode_' + sha(b.code || ''));
      const d = row.data; if (d.exp < Date.now()) return err(res, 400, 'invalid_grant', 'That code expired. Connect again.');
      if (b.client_id && b.client_id !== d.client_id) return err(res, 400, 'invalid_grant', 'Wrong client.');
      if (b.redirect_uri && b.redirect_uri !== d.redirect_uri) return err(res, 400, 'invalid_grant', 'Wrong redirect URI.');
      const ch = (await import('node:crypto')).createHash('sha256').update(String(b.code_verifier || '')).digest('base64url'); if (ch !== d.challenge) return err(res, 400, 'invalid_grant', 'PKCE check failed.');
      return res.status(200).json(await issue(db, row.user_id, { id: d.client_id, name: d.name }));
    }
    if (b.grant_type === 'refresh_token') {
      const id = 'mcprt_' + sha(b.refresh_token || ''), row = await byId(db, id); if (!row) return err(res, 400, 'invalid_grant', 'Connect Life OS again.');
      const d = row.data; if (b.client_id && b.client_id !== d.client_id) return err(res, 400, 'invalid_grant', 'Wrong client.');
      const t = await byId(db, 'mcptok_' + d.tok); if (!t) { await forget(db, row.user_id, id); return err(res, 400, 'invalid_grant', 'This connection was removed in Life OS. Connect again.'); }
      await forget(db, row.user_id, id); await forget(db, row.user_id, 'mcptok_' + d.tok);
      return res.status(200).json(await issue(db, row.user_id, { id: d.client_id, name: d.name }));
    }
    return err(res, 400, 'unsupported_grant_type', 'Use authorization_code or refresh_token.');
  }
  return res.status(404).json({ error: 'not found' });
}
