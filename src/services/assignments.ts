/**
 * assignments.ts — Supabase queries for the Assignments table.
 */
import { supabase } from '@/lib/supabase'
import type { Assignment } from '@/types'

export type AssignmentInsert = Omit<Assignment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'module' | 'group_members' | 'files'>
export type AssignmentUpdate = Partial<AssignmentInsert>

/** Fetch all assignments with module info */
export async function getAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      module:modules(id, name, colour, code),
      group_members:assignment_group_members(id, name),
      files:assignment_files(id, file_name, storage_path, file_size, uploaded_at)
    `)
    .order('due_date', { ascending: true })

  return { data: (data ?? []) as Assignment[], error }
}

/** Fetch a single assignment by ID */
export async function getAssignment(id: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      module:modules(id, name, colour, code),
      group_members:assignment_group_members(id, name),
      files:assignment_files(id, file_name, storage_path, file_size, uploaded_at)
    `)
    .eq('id', id)
    .single()

  return { data: data as Assignment | null, error }
}

/** Create an assignment */
export async function createAssignment(payload: AssignmentInsert) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('assignments')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  return { data: data as Assignment | null, error }
}

/** Update an assignment */
export async function updateAssignment(id: string, payload: AssignmentUpdate) {
  const { data, error } = await supabase
    .from('assignments')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Assignment | null, error }
}

/** Delete an assignment */
export async function deleteAssignment(id: string) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id)

  return { error }
}

/** Quick-update just the status */
export async function updateAssignmentStatus(id: string, status: Assignment['status']) {
  return updateAssignment(id, { status })
}

// ── Group members ────────────────────────────────────────────────────────────

/** Replace all group members for an assignment */
export async function setGroupMembers(assignmentId: string, names: string[]) {
  // Delete existing members then re-insert
  await supabase
    .from('assignment_group_members')
    .delete()
    .eq('assignment_id', assignmentId)

  if (names.length === 0) return { error: null }

  const { error } = await supabase
    .from('assignment_group_members')
    .insert(names.map(name => ({ assignment_id: assignmentId, name })))

  return { error }
}
