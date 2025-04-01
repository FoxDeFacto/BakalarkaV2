// src/app/(dashboard)/dashboard/projects/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { withAuth } from '@/lib/auth';
import { useAuth } from '@/lib/auth';
import { Project, ProjectFilters } from '@/lib/types';
import { projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ProjectFilters as ProjectFiltersComponent } from '@/components/Projects/ProjectFilters';
import DashboardLayout from '@/components/layout/DashboardLayout';

function ProjectsPage() {
  const { isStudent } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);

  // Use useCallback to ensure fetchProjects doesn't change on every render
  const fetchProjects = useCallback(async (pageNum = 1, newFilters: ProjectFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      // Convert filters to query params
      const params: Record<string, string> = {
        page: pageNum.toString(),
      };

      if (newFilters.search) params.search = newFilters.search;
      if (newFilters.year) params.year = newFilters.year.toString();
      if (newFilters.field) params.field = newFilters.field;
      if (newFilters.status) params.status = newFilters.status;
      if (newFilters.type_of_work) params.type_of_work = newFilters.type_of_work;
      if (newFilters.keywords && newFilters.keywords.length) {
        params.keywords = newFilters.keywords.join(',');
      }

      const response = await projectsApi.getProjects(params);
      
      // If it's page 1, replace projects; otherwise, append
      if (pageNum === 1) {
        setProjects(response.results);
      } else {
        setProjects((prev) => [...prev, ...response.results]);
      }
      
      setTotalProjects(response.count);
      setHasMorePages(response.results.length === 20 && response.count > page * 20);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Initial load - only run once
  useEffect(() => {
    fetchProjects(1, {});
  }, []);

  const handleFilterChange = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
    fetchProjects(1, newFilters);
  }, [fetchProjects]);

  const handleLoadMore = useCallback(() => {
    fetchProjects(page + 1);
  }, [fetchProjects, page]);

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse and manage all projects
            </p>
          </div>
          {isStudent && (
            <Link href="/dashboard/create-project">
              <Button variant="primary">Create Project</Button>
            </Link>
          )}
        </div>

        {error && (
          <Alert variant="danger" message={error} />
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <ProjectFiltersComponent onFilterChange={handleFilterChange} initialFilters={filters} />
          </div>

          {/* Projects table */}
          <div className="flex-1">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {totalProjects} project{totalProjects !== 1 ? 's' : ''} found
              </p>
            </div>

            {loading && projects.length === 0 ? (
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
                  Try adjusting your filters to find what you're looking for.
                </p>
                {isStudent && (
                  <div className="mt-4">
                    <Link href="/dashboard/create-project">
                      <Button variant="primary">Create a New Project</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto bg-white shadow rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Field
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {project.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{project.student_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{project.year}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 truncate max-w-xs">{project.field}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                project.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}
                            >
                              {project.status_display}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{project.type_display}</div>
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

                {hasMorePages && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      isLoading={loading}
                      disabled={loading}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ProjectsPage);