// src/lib/api.ts
import { User, Project, Milestone, Comment, Consultation, ProjectEvaluation, ProjectTeacher } from '@/lib/types'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to handle fetch responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to get error message from the response
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || JSON.stringify(errorData));
    } catch (e) {
      throw new Error(`${response.status} of ${e}: ${response.statusText}`);
    }
  }
  
  return response.json() as Promise<T>;
}

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Initialize tokens from localStorage when in browser
if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
}

// Set tokens and store in localStorage
export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
}

// Clear tokens on logout
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Headers for authenticated requests
function getAuthHeaders() {
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` };
}

// Attempt to refresh the token
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setTokens(data.access, refreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

// Enhanced fetch with token handling
async function fetchWithAuth(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    // Create headers object from existing headers or empty object
    const existingHeaders = options.headers || {};
    
    // Convert headers to a standard record type
    let headersRecord: Record<string, string> = {};
    
    // Handle different types of headers input
    if (existingHeaders instanceof Headers) {
      existingHeaders.forEach((value, key) => {
        headersRecord[key] = value;
      });
    } else if (Array.isArray(existingHeaders)) {
      // Handle headers as string[][]
      existingHeaders.forEach(([key, value]) => {
        headersRecord[key] = value;
      });
    } else {
      // Handle headers as Record<string, string>
      headersRecord = { ...existingHeaders as Record<string, string> };
    }
    
    // Add auth header if token exists
    const authHeaders = getAuthHeaders();
    if (authHeaders.Authorization) {
      headersRecord.Authorization = authHeaders.Authorization;
    }
    
    // Make the request with properly typed headers
    let response = await fetch(url, { 
      ...options, 
      headers: headersRecord 
    });
    
    // If 401 Unauthorized, try to refresh token
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed && accessToken) {
        // Add the new token to headers
        headersRecord.Authorization = `Bearer ${accessToken}`;
        
        // Retry the request with new token
        response = await fetch(url, { 
          ...options, 
          headers: headersRecord 
        });
      }
    }
    
    return response;
  }

// Auth API
export const authApi = {
  async login(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await handleResponse<{ access: string; refresh: string }>(response);
    setTokens(data.access, data.refresh);
    return data;
  },
  
  async register(userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    role: 'student' | 'teacher' | 'admin';
  }) {
    const response = await fetch(`${API_URL}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    return handleResponse<User>(response);
  },
  
  async getCurrentUser() {
    if (!accessToken) return null;
    
    const response = await fetchWithAuth(`${API_URL}/users/me/`);
    return handleResponse<User>(response);
  },
  
  logout() {
    clearTokens();
  },
};

// Public Projects API
export const publicProjectsApi = {
  async getProjects(params: Record<string, string> = {}) {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.set(key, value);
    });
    
    const url = `${API_URL}/public/projects/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    return handleResponse<{ results: Project[]; count: number }>(response);
  },
  
  async getProject(id: number) {
    const response = await fetch(`${API_URL}/public/projects/${id}/`);
    return handleResponse<Project>(response);
  },
};

// Projects API
export const projectsApi = {
  async getProjects(params: Record<string, string> = {}) {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.set(key, value);
    });
    
    const url = `${API_URL}/projects/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetchWithAuth(url);
    
    return handleResponse<{ results: Project[]; count: number }>(response);
  },
  
  async getProject(id: number) {
    const response = await fetchWithAuth(`${API_URL}/projects/${id}/`);
    return handleResponse<Project>(response);
  },
  
  async createProject(projectData: Partial<Project>) {
    const response = await fetchWithAuth(`${API_URL}/projects/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    
    return handleResponse<Project>(response);
  },
  
  async updateProject(id: number, projectData: Partial<Project>) {
    const response = await fetchWithAuth(`${API_URL}/projects/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    
    return handleResponse<Project>(response);
  },
  
  async deleteProject(id: number) {
    const response = await fetchWithAuth(`${API_URL}/projects/${id}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleResponse(response);
    }
    
    return true;
  },
  
  async submitProject(id: number) {
    const response = await fetchWithAuth(`${API_URL}/projects/${id}/submit/`, {
      method: 'POST',
    });
    
    return handleResponse<Project>(response);
  },
};

export const visibleProjectsApi = {
  async getProjects(params: Record<string, string> = {}) {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.set(key, value);
    });
    
    const url = `${API_URL}/visible-projects/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetchWithAuth(url);
    
    return handleResponse<{ results: Project[]; count: number }>(response);
  }
};

// File upload API
export const fileApi = {
  async uploadFile(file: File, type: 'thumbnail' | 'document' | 'poster' | 'video') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await fetchWithAuth(`${API_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });
    
    return handleResponse<{ file_path: string; url: string }>(response);
  },
};

// Milestones API
export const milestonesApi = {
  async getMilestones(projectId?: number) {
    let url = `${API_URL}/milestones/`;
    if (projectId) url += `?project=${projectId}`;
    
    const response = await fetchWithAuth(url);
    return handleResponse<{ results: Milestone[]; count: number }>(response);
  },
  
  async createMilestone(milestoneData: Partial<Milestone>) {
    const response = await fetchWithAuth(`${API_URL}/milestones/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestoneData),
    });
    
    return handleResponse<Milestone>(response);
  },
  
  async updateMilestone(id: number, milestoneData: Partial<Milestone>) {
    const response = await fetchWithAuth(`${API_URL}/milestones/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestoneData),
    });
    
    return handleResponse<Milestone>(response);
  },
  
  async updateCompletion(id: number, completion: number) {
    const response = await fetchWithAuth(`${API_URL}/milestones/${id}/update_completion/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completion }),
    });
    
    return handleResponse<Milestone>(response);
  },
  
  async deleteMilestone(id: number) {
    const response = await fetchWithAuth(`${API_URL}/milestones/${id}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleResponse(response);
    }
    
    return true;
  },
};

// Comments API
export const commentsApi = {
  async getComments(projectId?: number) {
    let url = `${API_URL}/comments/`;
    if (projectId) url += `?project=${projectId}`;
    
    const response = await fetchWithAuth(url);
    return handleResponse<{ results: Comment[]; count: number }>(response);
  },
  
  async createComment(commentData: { project: number; comment_text: string }) {
    const response = await fetchWithAuth(`${API_URL}/comments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    });
    
    return handleResponse<Comment>(response);
  },
  
  async deleteComment(id: number) {
    const response = await fetchWithAuth(`${API_URL}/comments/${id}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleResponse(response);
    }
    
    return true;
  },
};

// Consultations API
export const consultationsApi = {
  async getConsultations(projectId?: number) {
    let url = `${API_URL}/consultations/`;
    if (projectId) url += `?project=${projectId}`;
    
    const response = await fetchWithAuth(url);
    return handleResponse<{ results: Consultation[]; count: number }>(response);
  },
  
  async createConsultation(consultationData: Partial<Consultation>) {
    const response = await fetchWithAuth(`${API_URL}/consultations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultationData),
    });
    
    return handleResponse<Consultation>(response);
  },
  
  async updateConsultation(id: number, consultationData: Partial<Consultation>) {
    const response = await fetchWithAuth(`${API_URL}/consultations/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultationData),
    });
    
    return handleResponse<Consultation>(response);
  },
  
  async deleteConsultation(id: number) {
    const response = await fetchWithAuth(`${API_URL}/consultations/${id}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleResponse(response);
    }
    
    return true;
  },
};

// Project Teachers API
export const projectTeachersApi = {
  async getProjectTeachers(projectId?: number) {
    let url = `${API_URL}/project-teachers/`;
    if (projectId) url += `?project=${projectId}`;
    
    const response = await fetchWithAuth(url);
    return handleResponse<{ results: ProjectTeacher[]; count: number }>(response);
  },
  
  async assignTeacher(data: { project: number; teacher: number; role: string }) {
    const response = await fetchWithAuth(`${API_URL}/project-teachers/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    return handleResponse<ProjectTeacher>(response);
  },
  
  async acceptAssignment(id: number) {
    const response = await fetchWithAuth(`${API_URL}/project-teachers/${id}/accept/`, {
      method: 'POST',
    });
    
    return handleResponse<ProjectTeacher>(response);
  },

  async declineAssignment(id: number) {
    const response = await fetchWithAuth(`${API_URL}/project-teachers/${id}/decline/`, {
      method: 'POST',
    });
    
    return handleResponse<{ detail: string }>(response);
  },
  
  async removeTeacher(id: number) {
    const response = await fetchWithAuth(`${API_URL}/project-teachers/${id}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleResponse(response);
    }
    
    return true;
  },
};

// Evaluations API
export const evaluationsApi = {
  async getEvaluations(projectId?: number) {
    let url = `${API_URL}/evaluations/`;
    if (projectId) url += `?project=${projectId}`;
    
    const response = await fetchWithAuth(url);
    return handleResponse<{ results: ProjectEvaluation[]; count: number }>(response);
  },
  
  async createEvaluation(evaluationData: Partial<ProjectEvaluation>) {
    const response = await fetchWithAuth(`${API_URL}/evaluations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluationData),
    });
    
    return handleResponse<ProjectEvaluation>(response);
  },
  
  async updateEvaluation(id: number, evaluationData: Partial<ProjectEvaluation>) {
    const response = await fetchWithAuth(`${API_URL}/evaluations/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluationData),
    });
    
    return handleResponse<ProjectEvaluation>(response);
  },
  
  async deleteEvaluation(id: number) {
    const response = await fetchWithAuth(`${API_URL}/evaluations/${id}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleResponse(response);
    }
    
    return true;
  },
};


// User API
export const usersApi = {
  async getUsers(role?: string) {
    let url = `${API_URL}/users/`;
    if (role) url += `?role=${role}`;
    
    const response = await fetchWithAuth(url);
    return handleResponse<{ results: User[]; count: number }>(response);
  },
  
  async getUser(id: number) {
    const response = await fetchWithAuth(`${API_URL}/users/${id}/`);
    return handleResponse<User>(response);
  },

  async updateUser(id: number, userData: Partial<User>) {
    const response = await fetchWithAuth(`${API_URL}/users/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    return handleResponse<User>(response);
  },
  
  async deleteUser(id: number) {
    const response = await fetchWithAuth(`${API_URL}/users/${id}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleResponse(response);
    }
    
    return true;
  },
};