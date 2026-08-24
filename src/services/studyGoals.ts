/**
 * studyGoals.ts — Supabase queries for study_goals and study_sessions.
 */
import { supabase } from '@/lib/supabase'
import type { StudyGoal, StudySession } from '@/types'
import { toWeekStart, getCurrentWeekStart } from '@/utils'

export type GoalInsert = Omit<StudyGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'module'>
export type GoalUpdate = Partial<GoalInsert>

// ── Goals ────────────────────────────────────────────────────────────────────

export async function getGoalsForWeek(weekStart?: string) {
  const week = weekStart ?? toWeekStart(getCurrentWeekStart())
  const { data, error } = await supabase
    .from('study_goals')
    .select('*, module:modules(id, name, colour)')
    .eq('week_start', week)
    .order('created_at', { ascending: true })

  return { data: (data ?? []) as StudyGoal[], error }
}

export async function getAllGoals() {
  const { data, error } = await supabase
    .from('study_goals')
    .select('*, module:modules(id, name, colour)')
    .order('week_start', { ascending: false })

  return { data: (data ?? []) as StudyGoal[], error }
}

export async function createGoal(payload: GoalInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('study_goals')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  return { data: data as StudyGoal | null, error }
}

export async function updateGoal(id: string, payload: GoalUpdate) {
  const { data, error } = await supabase
    .from('study_goals')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return { data: data as StudyGoal | null, error }
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('study_goals').delete().eq('id', id)
  return { error }
}

export async function completeGoal(id: string) {
  return updateGoal(id, { status: 'Completed' })
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export type SessionInsert = Omit<StudySession, 'id' | 'user_id' | 'created_at' | 'module' | 'study_goal'>

export async function getSessions() {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*, module:modules(id, name, colour)')
    .order('start_time', { ascending: false })
    .limit(100)

  return { data: (data ?? []) as StudySession[], error }
}

export async function createSession(payload: SessionInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  return { data: data as StudySession | null, error }
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from('study_sessions').delete().eq('id', id)
  return { error }
}
