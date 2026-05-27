import { getIO } from './index.js';
import { getDefinition, resolveHooks } from '../services/template.service.js';

export function emitTicketUpdate(serverId: string, event: string, data: any) {
  const io = getIO();
  if (!io) return;
  io.of('/mc').to(`server:${serverId}`).emit(event, data);
}

export function emitToAllServers(event: string, data: any) {
  const io = getIO();
  if (!io) return;
  io.of('/mc').emit(event, data);
}

export function emitHookExecute(serverId: string, ticket: {
  id: number;
  title: string;
  template: string;
  formData: string | null;
  author?: { minecraftUuid?: string | null; minecraftName?: string | null } | null;
}, event: string) {
  const def = getDefinition(ticket.template);
  if (!def) return;
  const commands = resolveHooks(def, event);
  if (commands.length === 0) return;

  const formData: Record<string, string> = ticket.formData ? JSON.parse(ticket.formData) : {};

  const resolved = commands.map(cmd =>
    cmd
      .replace(/\{ticket_id\}/g, String(ticket.id))
      .replace(/\{ticket_title\}/g, ticket.title)
      .replace(/\{player_name\}/g, ticket.author?.minecraftName || 'unknown')
      .replace(/\{player_uuid\}/g, ticket.author?.minecraftUuid || 'unknown')
      .replace(/\{field\.(\w+)\}/g, (_, id: string) => formData[id] || '')
  );

  const io = getIO();
  if (!io) return;
  io.of('/mc').to(`server:${serverId}`).emit('hook:execute', {
    ticketId: ticket.id,
    event,
    playerUuid: ticket.author?.minecraftUuid || null,
    commands: resolved,
  });
}
