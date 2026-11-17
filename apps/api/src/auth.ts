import {createClient} from '@supabase/supabase-js';
import type {FastifyRequest, FastifyReply} from 'fastify';
import {pool} from './db.js';
import {cfg} from './config.js';

export type Principal = {id:string;displayName:string;role:'ADMIN'|'NATIONAL'|'REGIONAL'|'RH'|'KOREA'|'SF'};
let authClient: ReturnType<typeof createClient> | null = null;
function getAuthClient() {
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('Supabase Auth belum dikonfigurasi');
  authClient ??= createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{autoRefreshToken:false,persistSession:false}});
  return authClient;
}

export async function requirePrincipal(request:FastifyRequest, reply:FastifyReply): Promise<Principal|null> {
  const bearer = request.headers.authorization;
  if (!bearer?.startsWith('Bearer ') || bearer.length < 15) {
    reply.code(401).send({error:'Login diperlukan.'}); return null;
  }
  let subject:string;
  try {
    const {data,error} = await getAuthClient().auth.getUser(bearer.slice(7));
    if (error || !data.user?.id) {reply.code(401).send({error:'Sesi tidak valid.'});return null;}
    subject = data.user.id;
  } catch {
    reply.code(503).send({error:'Layanan autentikasi belum tersedia.'}); return null;
  }
  const result = await pool.query<{id:string;display_name:string;role:Principal['role']}>(
    'SELECT id, display_name, role FROM app_users WHERE auth_uid=$1::uuid AND is_active=true LIMIT 1',[subject]);
  const user = result.rows[0];
  if (!user) {reply.code(403).send({error:'Akun belum diberi akses oleh Admin.'}); return null;}
  return {id:user.id,displayName:user.display_name,role:user.role};
}
export function canViewArea(principal:Principal) {return ['ADMIN','NATIONAL','REGIONAL','RH'].includes(principal.role);}
export function unrestricted(principal:Principal) {return ['ADMIN','NATIONAL'].includes(principal.role);}
