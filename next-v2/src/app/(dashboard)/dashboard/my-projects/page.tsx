// src/app/(dashboard)/dashboard/my-projects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withRole } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project } from '@/lib/types';
import { projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import DashboardLayout from '@/components/layout/DashboardLayout';

function MyProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      try {
        const params = { student: user.id.toString() };
        const response = await projectsApi.getProjects(params);
        setProjects(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  // Group projects by status
  const projectsByStatus: Record<string, Project[]> = {
    draft: [],
    in_progress: [],
    submitted: [],
    evaluated: [],
    completed: [],
  };

  projects.forEach(project => {
    if (projectsByStatus[project.status]) {
      projectsByStatus[project.status].push(project);
    }
  });

  const statusDisplayOrder = [
    { key: 'in_progress', display: 'In Progress' },
    { key: 'draft', display: 'Draft' },
    { key: 'submitted', display: 'Submitted' },
    { key: 'evaluated', display: 'Evaluated' },
    { key: 'completed', display: 'Completed' },
  ];

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Projects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your project portfolio
            </p>
          </div>
          <Link href="/dashboard/create-project">
            <Button variant="primary">Create Project</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" message={error} />
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 bg-white shadow rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't created any projects yet.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/create-project">
                <Button variant="primary">Create Your First Project</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {statusDisplayOrder.map(({ key, display }) => (
              projectsByStatus[key] && projectsByStatus[key].length > 0 && (
                <div key={key}>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{display} Projects</h2>
                  <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Field
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projectsByStatus[key].map((project) => (
                          <tr key={project.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {project.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{project.year}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 truncate max-w-xs">{project.field}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{project.type_display}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(project.updated_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link 
                                href={`/dashboard/projects/${project.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                View
                              </Link>
                              <Link 
                                href={`/dashboard/projects/${project.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withRole(MyProjectsPage, ['student']);
