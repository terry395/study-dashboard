// ─── Core Database Types ─────────────────────────────────────────────────────
// These mirror the Supabase table columns exactly.

export interface Profile {
  id: string
  user_id: string
  name: string
  email: string
  created_at: string
}

export type ModuleColor =
  | '#6366f1' | '#8b5cf6' | '#ec4899' | '#ef4444'
  | '#f59e0b' | '#22c55e' | '#14b8a6' | '#38bdf8'
  | '#f97316' | '#84cc16'

export interface Module {
  id: string
  user_id: string
  name: string
  code: string | null
  lecturer_name: string | null
  lecturer_email: string | null
  description: string | null
  academic_year: string | null
  semester: string | null
  colour: string
  created_at: string
  updated_at: string
}

export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Completed'
export type AssignmentType   = 'Individual' | 'Group'

export interface Assignment {
  id: string
  user_id: string
  module_id: string | null
  name: string
  description: string | null
  due_date: string          // ISO date string YYYY-MM-DD
  due_time: string | null   // HH:MM
  status: AssignmentStatus
  assignment_type: AssignmentType
  weightage: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  module?: Module
  group_members?: AssignmentGroupMember[]
  files?: AssignmentFile[]
}

export interface AssignmentGroupMember {
  id: string
  assignment_id: string
  name: string
}

export interface AssignmentFile {
  id: string
  assignment_id: string
  file_name: string
  storage_path: string
  file_size: number
  uploaded_at: string
}

export interface Test {
  id: string
  user_id: string
  module_id: string | null
  name: string
  date: string          // YYYY-MM-DD
  start_time: string    // HH:MM
  end_time: string | null
  location: string | null
  topics: string[]
  weightage: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  module?: Module
}

export type GoalPriority = 'Low' | 'Medium' | 'High'
export type GoalStatus   = 'Not Started' | 'In Progress' | 'Completed'

export interface StudyGoal {
  id: string
  user_id: string
  module_id: string | null
  title: string
  description: string | null
  target_date: string | null  // YYYY-MM-DD (specific day, optional)
  week_start: string          // YYYY-MM-DD (Monday of the goal's week)
  priority: GoalPriority
  status: GoalStatus
  created_at: string
  updated_at: string
  // Joined
  module?: Module
}

export interface StudySession {
  id: string
  user_id: string
  module_id: string | null
  study_goal_id: string | null
  topic: string | null
  start_time: string   // ISO datetime
  end_time: string     // ISO datetime
  duration_seconds: number
  created_at: string
  // Joined
  module?: Module
  study_goal?: StudyGoal
}

export interface CalendarCategory {
  id: string
  user_id: string
  name: string
  colour: string
  icon: string
  created_at: string
}

export type CalendarEventSource = 'manual' | 'assignment' | 'test' | 'study_session'

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  category_id: string | null
  start_datetime: string   // ISO datetime
  end_datetime: string     // ISO datetime
  all_day: boolean
  location: string | null
  description: string | null
  colour: string | null
  recurrence_rule: string | null  // e.g. "FREQ=WEEKLY;BYDAY=MO"
  source_type: CalendarEventSource
  assignment_id: string | null
  test_id: string | null
  module_id: string | null
  created_at: string
  updated_at: string
  // Joined
  category?: CalendarCategory
  module?: Module
}

// ─── App / UI Types ──────────────────────────────────────────────────────────

export type DeadlineStatus = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'upcoming'

export interface DeadlineInfo {
  status: DeadlineStatus
  label: string   // e.g. "Due in 3 days", "Overdue by 2 days"
  daysFromNow: number
}

export interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
}
