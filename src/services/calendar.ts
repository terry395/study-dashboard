/**
 * calendar.ts — Supabase queries for calendar_events and calendar_categories.
 */
import { supabase } from '@/lib/supabase'
import type { CalendarEvent, CalendarCategory } from '@/types'

// ── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await supabase
    .from('calendar_categories')
    .select('*')
    .order('name')

  return { data: (data ?? []) as CalendarCategory[], error }
}

export async function createCategory(payload: Omit<CalendarCategory, 'id' | 'user_id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('calendar_categories')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  return { data: data as CalendarCategory | null, error }
}

export async function updateCategory(id: string, payload: Partial<Omit<CalendarCategory, 'id' | 'user_id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('calendar_categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return { data: data as CalendarCategory | null, error }
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('calendar_categories').delete().eq('id', id)
  return { error }
}

/** Seed default categories for a new user */
export async function seedDefaultCategories(userId: string) {
  const defaults = [
    { name: 'School',      colour: '#6366f1', icon: 'graduation-cap', user_id: userId },
    { name: 'Work',        colour: '#f59e0b', icon: 'briefcase',       user_id: userId },
    { name: 'Family',      colour: '#22c55e', icon: 'home',            user_id: userId },
    { name: 'Personal',    colour: '#38bdf8', icon: 'user',            user_id: userId },
    { name: 'Appointment', colour: '#ec4899', icon: 'stethoscope',     user_id: userId },
    { name: 'Event',       colour: '#f97316', icon: 'star',            user_id: userId },
    { name: 'Other',       colour: '#8b90a8', icon: 'circle',          user_id: userId },
  ]

  // Only insert if no categories exist yet
  const { data: existing } = await supabase
    .from('calendar_categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  await supabase.from('calendar_categories').insert(defaults)
}

// ── Events ────────────────────────────────────────────────────────────────────

export type EventInsert = Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'module'>
export type EventUpdate = Partial<EventInsert>

export async function getEvents(from?: string, to?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*, category:calendar_categories(id, name, colour, icon)')
    .order('start_datetime')

  if (from) query = query.gte('start_datetime', from)
  if (to)   query = query.lte('start_datetime', to)

  const { data, error } = await query
  return { data: (data ?? []) as CalendarEvent[], error }
}

export async function createEvent(payload: EventInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  return { data: data as CalendarEvent | null, error }
}

export async function updateEvent(id: string, payload: EventUpdate) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return { data: data as CalendarEvent | null, error }
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  return { error }
}

/** Upsert a system-generated event (assignment/test) by source type + source id */
export async function upsertSystemEvent(event: EventInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Find existing system event for this source
  const matchCol = event.assignment_id ? 'assignment_id' : 'test_id'
  const matchVal = event.assignment_id ?? event.test_id

  if (!matchVal) return

  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id')
    .eq(matchCol, matchVal)
    .eq('source_type', event.source_type)
    .maybeSingle()

  if (existing) {
    await supabase.from('calendar_events').update(event).eq('id', existing.id)
  } else {
    await supabase.from('calendar_events').insert({ ...event, user_id: user.id })
  }
}
