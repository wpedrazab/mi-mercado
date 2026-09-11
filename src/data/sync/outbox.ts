import type { Table } from 'dexie'
import { db } from '../local/db'
import { supabase } from '../remote/supabaseClient'
import type { OutboxEntry, OutboxOp, SyncedRow, SyncTableName } from '../local/types'

export async function enqueue(table: SyncTableName, op: OutboxOp, rowId: string, payload: Record<string, unknown> | null) {
  await db.outbox.add({
    table,
    op,
    rowId,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  })
}

async function sendOne(entry: OutboxEntry): Promise<void> {
  const { table, op, rowId, payload } = entry

  if (op === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', rowId)
    if (error) throw error
    return
  }

  // insert y update se resuelven igual: la fila ya existe localmente con su
  // id definitivo (generado en el cliente), así que un upsert cubre ambos
  // casos sin distinguir si el servidor ya la conocía.
  const { error } = await supabase.from(table).upsert(payload as Record<string, unknown>)
  if (error) throw error
}

/**
 * Procesa el outbox en orden de creación y se detiene en el primer error.
 * El orden importa: una fila hija (p.ej. list_items) puede depender de que
 * su padre (shopping_lists) ya se haya empujado, así que saltarse una
 * entrada fallida para seguir con las siguientes rompería esa dependencia.
 * Se reintenta desde ahí en el siguiente flush.
 */
export async function flushOutbox(): Promise<{ sent: number; pending: number }> {
  let sent = 0

  while (true) {
    const entry = await db.outbox.orderBy('createdAt').first()
    if (!entry) break

    try {
      await sendOne(entry)
      await db.outbox.delete(entry.id!)

      const remaining = await db.outbox.where({ table: entry.table, rowId: entry.rowId }).count()
      if (remaining === 0) {
        const table = db[entry.table] as unknown as Table<SyncedRow, string>
        await table.update(entry.rowId, { dirty: 0 })
      }

      sent += 1
    } catch (err) {
      await db.outbox.update(entry.id!, {
        attempts: entry.attempts + 1,
        lastError: err instanceof Error ? err.message : String(err),
      })
      break
    }
  }

  const pending = await db.outbox.count()
  return { sent, pending }
}
