# Ticket ID Refactor: Sequential Integer IDs

## Goal

Replace CUID-based ticket IDs with sequential integers starting from 1 (like GitHub Issues), and support cross-referencing tickets via `#<number>` notation.

## Scope

- Only `Ticket.id` changes — other models (User, Server, Label, Comment, Attachment, PermissionRequest, LinkCode, SetupStatus, AuditLog) keep CUID primary keys
- Five foreign key columns auto-adapt from TEXT to INTEGER: `Comment.ticketId`, `Attachment.ticketId`, `TicketLabel.ticketId`, `PermissionRequest.ticketId`, `AuditLog.ticketId`
- Global sequential numbering (not per-server)
- No migration of old data — drop and recreate

---

## 1. Database Schema

**Change:** `Ticket.id` from `String @default(cuid())` to `Int @default(autoincrement())`

```
model Ticket {
  id         Int          @id @default(autoincrement())
  title      String
  body       String
  type       TicketType
  status     TicketStatus @default(open)
  priority   Priority     @default(medium)
  authorId   String       @map("author_id")
  serverId   String?      @map("server_id")
  assigneeId String?      @map("assignee_id")
  createdAt  DateTime     @default(now()) @map("created_at")
  updatedAt  DateTime     @updatedAt @map("updated_at")
  closedAt   DateTime?    @map("closed_at")
  // relations unchanged
}
```

**Cascade:** Prisma auto-adapts these FKs from String to Int:
- `Comment.ticketId`
- `Attachment.ticketId`
- `TicketLabel.ticketId`
- `PermissionRequest.ticketId`
- `AuditLog.ticketId`

**Migration strategy:** Delete old migrations, update schema, run `prisma migrate dev` to generate fresh migration. SQLite AUTOINCREMENT starts from 1.

---

## 2. Backend API

### Type changes
- All TypeScript interfaces: `ticket.id: number` (was `string`)
- Prisma Client regenerated types automatically reflect the new schema

### Route params
- `GET/PATCH/POST /api/tickets/:id` — parse `req.params.id` as integer (Zod `z.coerce.number()`)
- `POST /api/tickets/:id/approve`, `/reopen`, `/close`, etc. — same treatment

### WebSocket events
- `ticketId` field in emitted events changes from CUID string to integer
- No consumer-side change needed beyond parsing as int

### No backend changes for auto-link
- `#<number>` rendering is done on the frontend only
- No preprocessing of ticket body or comment content on the server

---

## 3. Frontend

### TypeScript types

```typescript
// frontend/src/types/ticket.ts
export interface Ticket {
  id: number  // was: string
  // ...
}
```

All referencing types (`Comment`, `Attachment`, `AuditLog`, `PermissionRequest`) update `ticketId` from `string` to `number`. TypeScript compiler finds all mismatches.

### Routing
- `/tickets/:id` — unchanged route syntax, `id` is now a numeric string like `"1"`
- `router.push(`/tickets/${ticket.id}`)` — works naturally with number IDs

### Auto-link `#<number>`

On ticket detail and comment list views, render body text with `#<number>` replaced by clickable links:

```typescript
function renderLinks(text: string): string {
  return text.replace(/#(\d+)/g,
    '<a href="/tickets/$1" class="ticket-ref">#$1</a>')
}
```

Bound via `v-html` with no other HTML escaping needed (the regex only matches digits, no XSS risk).

---

## 4. Minecraft Plugin

### Ticket model
```java
public class Ticket {
    private final int id;  // was: String
    // ...
}
```

### API client JSON parsing
```java
int id = obj.get("id").getAsInt();          // create/get tickets
int ticketId = obj.get("ticketId").getAsInt(); // WebSocket events
```

### Commands
```java
// /lt ticket <id> — IntegerArgumentType replaces StringArgumentType
IntegerArgumentType.integer(1)
tk.getId() == ticketId  // int comparison, was .equals()
```
