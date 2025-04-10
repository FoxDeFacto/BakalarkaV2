// src/app/projects-public/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { publicProjectsApi, commentsApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/lib/auth';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

export default function PublicProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { user, isAuthenticated } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await publicProjectsApi.getProject(projectId);
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }
    
    setSubmittingComment(true);
    setCommentError(null);
    
    try {
      await commentsApi.createComment({
        project: projectId,
        comment_text: commentText.trim(),
      });
      
      // Refresh project to get the new comment
      const updatedProject = await publicProjectsApi.getProject(projectId);
      setProject(updatedProject);
      setCommentText('');
      setCommentSuccess('Komentář úspěšně přidán!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setCommentSuccess(null);
      }, 3000);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <Alert
          variant="danger"
          title="Error"
          message={error || 'Project not found'}
        />
        <div className="mt-4">
          <Link href="/projects-public" className="text-orange-600 hover:text-orange-800">
            ← Zpět
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to get badge color based on status
  const getStatusBadgeColor = (status: string): 'gray' | 'blue' | 'green' | 'red' | 'yellow' => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'submitted':
        return 'yellow';
      case 'evaluated':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/projects-public" className="inline-flex items-center text-orange-600 hover:text-orange-800">
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Zpět
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Project header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <div className="mt-1 flex items-center">
                <span className="text-sm text-gray-500 mr-2">By {project.student_name}</span>
                <Badge variant={getStatusBadgeColor(project.status)}>
                  {project.status_display}
                </Badge>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Badge variant="gray" size="lg" className="mr-2">
                {project.year}
              </Badge>
              <Badge variant="gray" size="lg">
                {project.type_display}
              </Badge>
            </div>
          </div>
        </div>

        {/* Project content */}
        <div className="p-6">
          {/* Thumbnail/image */}
          {project.thumbnail && (
            <div className="mb-6">
              <img
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.thumbnail}`}
                alt={project.title}
                className="w-full max-h-96 object-contain rounded"
              />
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Popis</h2>
            <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
          </div>

          {/* Field and keywords */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Oblast & Klíčová slova</h2>
            <div className="flex flex-col space-y-2">
              <div>
                <span className="text-gray-500">Obor: </span>
                <span className="text-gray-900">{project.field}</span>
              </div>
              <div>
                <span className="text-gray-500">Klíčová slova: </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {project.keywords.map((keyword, i) => (
                    <Badge key={i} variant="gray" size="sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Files */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Soubory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.document && (
                <a
                  href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.document}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <svg
                    className="h-6 w-6 text-gray-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Document</span>
                </a>
              )}

              {project.poster && (
                <a
                  href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.poster}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <svg
                    className="h-6 w-6 text-gray-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Plagát</span>
                </a>
              )}

              {project.video && (
                <a
                  href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.video}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <svg
                    className="h-6 w-6 text-gray-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Video</span>
                </a>
              )}
            </div>
          </div>

          {/* Teachers */}
          {project.teachers && project.teachers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Učitelé</h2>
              <div className="space-y-3">
                {project.teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                      {teacher.teacher_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{teacher.teacher_name}</div>
                      <div className="text-sm text-gray-500">{teacher.role_display}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Komentáře</h2>
            
            {/* Add comment form if authenticated */}
            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                {commentSuccess && (
                  <div className="mb-3">
                    <Alert variant="success" message={commentSuccess} />
                  </div>
                )}
                
                <Textarea
                  label="Přidat komentář"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  fullWidth
                  error={commentError || undefined}
                />
                <div className="mt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submittingComment}
                    disabled={submittingComment || !commentText.trim()}
                  >
                    Přidat komentář
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">
                  <Link href="/login" className="text-orange-600 hover:text-orange-800">
                    Přihlášení
                  </Link>
                  {' '} pro přidání komentáře.
                </p>
              </div>
            )}
            
              {/* Comments list */}
              {project.comments && project.comments.length > 0 ? (
                <div className="space-y-4">             
                  {project.comments
                    .slice() // Create a copy to avoid mutating original array
                    .sort((a, b) => {
                      // Safely handle date comparison with type coercion
                      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                            {comment.user_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {comment.user_name || 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {comment.created_at 
                                    ? new Date(comment.created_at).toLocaleString() 
                                    : 'Date unavailable'}
                                </div>
                              </div>
                              {comment.user_role && (
                                <Badge variant="gray" size="sm">
                                  {comment.user_role}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                              {comment.comment_text || 'No comment text'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Zatím bez komentářů.</p>
              )}
          </div>
          
          {/* Call to action for logged in users */}
          {isAuthenticated && (
            <div className="mt-8 p-6">
              <div className="flex space-x-4">
                
                {/* Only show this for teachers */}
                {user?.role === 'teacher' && (
                  <Link href={`/dashboard/assigned`}>
                    <Button variant="outline">
                      Správa přiřazených projektů
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}