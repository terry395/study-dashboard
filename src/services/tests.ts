/**
 * tests.ts — Supabase queries for the Tests table.
 */
import { supabase } from '@/lib/supabase'
import type { Test } from '@/types'

export type TestInsert = Omit<Test, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'module'>
export type TestUpdate = Partial<TestInsert>

export async function getTests() {
  const { data, error } = await supabase
    .from('tests')
    .select('*, module:modules(id, name, colour, code)')
    .order('date', { ascending: true })

  return { data: (data ?? []) as Test[], error }
}

export async function getTest(id: string) {
  const { data, error } = await supabase
    .from('tests')
    .select('*, module:modules(id, name, colour, code)')
    .eq('id', id)
    .single()

  return { data: data as Test | null, error }
}

export async function createTest(payload: TestInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('tests')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  return { data: data as Test | null, error }
}

export async function updateTest(id: string, payload: TestUpdate) {
  const { data, error } = await supabase
    .from('tests')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Test | null, error }
}

export async function deleteTest(id: string) {
  const { error } = await supabase.from('tests').delete().eq('id', id)
  return { error }
}
