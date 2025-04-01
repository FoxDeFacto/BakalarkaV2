// src/lib/types.ts

// User types
export interface User {
    id: number;
    username: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    date_joined: string;
    created_at: string;
    updated_at: string;
  }
  
  // Project types
  export type ProjectStatus = 'draft' | 'in_progress' | 'submitted' | 'evaluated' | 'completed';
  export type WorkType = 'SOČ' | 'seminar' | 'other';
  
  export interface Project {
    id: number;
    title: string;
    description: string;
    year: number;
    field: string;
    keywords: string[];
    student: number;
    student_name: string;
    thumbnail: string | null;
    document: string | null;
    poster: string | null;
    video: string | null;
    public_visibility: boolean;
    status: ProjectStatus;
    status_display: string;
    type_of_work: WorkType;
    type_display: string;
    created_at: string;
    updated_at: string;
    
    // Relations (only in detail view)
    teachers?: ProjectTeacher[];
    milestones?: Milestone[];
    comments?: Comment[];
    consultations?: Consultation[];
    evaluations?: ProjectEvaluation[];
  }
  
  // Project Teacher relation
  export type TeacherRole = 'supervisor' | 'consultant' | 'opponent';
  
  export interface ProjectTeacher {
    id: number;
    project: number;
    teacher: number;
    teacher_name: string;
    role: TeacherRole;
    role_display: string;
    accepted: boolean;
    assigned_at: string;
    updated_at: string;
  }
  
  // Milestone types
  export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';
  
  export interface Milestone {
    id: number;
    project: number;
    title: string;
    description: string;
    completion: number | null;
    deadline: string;
    status: MilestoneStatus;
    status_display: string;
    created_at: string;
    updated_at: string;
  }
  
  // Comment types
  export interface Comment {
    id: number;
    project: number;
    user: number;
    user_name: string;
    user_role: 'student' | 'teacher' | 'admin';
    comment_text: string;
    created_at: string;
    updated_at: string;
  }
  
  // Consultation types
  export interface Consultation {
    id: number;
    project: number;
    teacher: number;
    teacher_name: string;
    notes: string | null;
    consultation_date: string;
    created_at: string;
    updated_at: string;
  }
  
  // Evaluation types
  export interface ProjectEvaluation {
    id: number;
    project: number;
    teacher: number;
    teacher_name: string;
    evaluation: string;
    score: number;
    created_at: string;
    updated_at: string;
  }
  
  // Auth types
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    role: 'student' | 'teacher' | 'admin';
  }
  
  export interface AuthTokens {
    access: string;
    refresh: string;
  }
  
  // File Upload types
  export interface UploadResult {
    file_path: string;
    url: string;
  }
  
  // Pagination results
  export interface PaginatedResults<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
  }
  
  // Project filters
  export interface ProjectFilters {
    year?: number;
    field?: string;
    status?: ProjectStatus;
    type_of_work?: WorkType;
    keywords?: string[];
    search?: string;
  }