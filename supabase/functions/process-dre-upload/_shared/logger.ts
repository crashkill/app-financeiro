/**
 * Sistema de Logs para Edge Functions (local)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export type LogLevel = 'trace' | 'info' | 'warn' | 'error';
export interface LogEntry { level: LogLevel; message: string; source: string; execution_id?: string; metadata?: Record<string, any>; user_id?: string; ip_address?: string; user_agent?: string; created_at?: string; }
export interface LoggerConfig { source: string; execution_id?: string; user_id?: string; enableConsole?: boolean; enableDatabase?: boolean; minLevel?: LogLevel; }
const LOG_LEVELS: Record<LogLevel, number> = { trace: 0, info: 1, warn: 2, error: 3 };
export class Logger { private config: LoggerConfig; private supabase: any;
  constructor(config: LoggerConfig) { this.config = { enableConsole: true, enableDatabase: false, minLevel: 'info', ...config }; try { this.supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''); } catch { this.config.enableDatabase = false; } }
  private shouldLog(level: LogLevel): boolean { return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel || 'info']; }
  private formatConsoleMessage(entry: LogEntry): string { const ts = new Date().toISOString(); const level = entry.level.toUpperCase().padEnd(5); const source = entry.source.padEnd(20); let msg = `[${ts}] ${level} ${source} ${entry.message}`; if (entry.execution_id) msg += ` [exec:${entry.execution_id}]`; if (entry.metadata && Object.keys(entry.metadata).length > 0) msg += ` ${JSON.stringify(entry.metadata)}`; return msg; }
  private writeToConsole(entry: LogEntry): void { if (!this.config.enableConsole) return; const m = this.formatConsoleMessage(entry); if (entry.level === 'trace') console.debug(m); else if (entry.level === 'info') console.info(m); else if (entry.level === 'warn') console.warn(m); else console.error(m); }
  private async writeToDatabase(entry: LogEntry): Promise<void> { if (!this.config.enableDatabase || !this.supabase) return; await this.supabase.from('system_logs').insert({ level: entry.level, message: entry.message, source: entry.source, execution_id: entry.execution_id, metadata: entry.metadata, user_id: entry.user_id, ip_address: entry.ip_address, user_agent: entry.user_agent, created_at: new Date().toISOString() }); }
  private async log(level: LogLevel, message: string, metadata?: Record<string, any>): Promise<void> { if (!this.shouldLog(level)) return; const entry: LogEntry = { level, message, source: this.config.source, execution_id: this.config.execution_id, user_id: this.config.user_id, metadata, created_at: new Date().toISOString() }; this.writeToConsole(entry); this.writeToDatabase(entry).catch(() => {}); }
  async trace(message: string, metadata?: Record<string, any>) { return this.log('trace', message, metadata); }
  async info(message: string, metadata?: Record<string, any>) { return this.log('info', message, metadata); }
  async warn(message: string, metadata?: Record<string, any>) { return this.log('warn', message, metadata); }
  async error(message: string, metadata?: Record<string, any>) { return this.log('error', message, metadata); }
}
export const logger = new Logger({ source: 'excel-parser' });
