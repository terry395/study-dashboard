/**
 * modules.ts — All database operations for the Modules table.
 *
 * Each function returns { data, error } following Supabase conventions.
 * The user_id is taken from the active Supabase session (RLS handles access).
 */
import { supabase } from '@/lib/supabase'
import type { Module } from '@/types'

export type ModuleInsert = Omit<Module, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type ModuleUpdate = Partial<ModuleInsert>

/** Fetch all modules for the signed-in user, newest first */
export async function getModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('created_at', { ascending: false })

  return { data: (data ?? []) as Module[], error }
}

/** Fetch a single module by ID */
export async function getModule(id: string) {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as Module | null, error }
}

/** Create a new module */
export async function createModule(payload: ModuleInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('modules')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  return { data: data as Module | null, error }
}

/** Update an existing module */
export async function updateModule(id: string, payload: ModuleUpdate) {
  const { data, error } = await supabase
    .from('modules')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Module | null, error }
}

/** Delete a module */
export async function deleteModule(id: string) {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id)

  return { error }
}
