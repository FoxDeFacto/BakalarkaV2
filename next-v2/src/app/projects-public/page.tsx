// src/app/projects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectFilters } from '@/lib/types';
import { projectsApi } from '@/lib/api';
import { ProjectCard } from '@/components/Projects/ProjectCard';
import { ProjectFilters as ProjectFiltersComponent } from '@/components/Projects/ProjectFilters';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);

  const fetchProjects = async (pageNum = 1, newFilters: ProjectFilters = filters) => {
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
  };

  // Initial load
  useEffect(() => {
    fetchProjects(1);
  }, []);

  const handleFilterChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters);
    fetchProjects(1, newFilters);
  };

  const handleLoadMore = () => {
    fetchProjects(page + 1);
  };

  return (
    <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="mt-2 text-lg text-gray-600">
          Browse and explore student research projects and seminar papers.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <ProjectFiltersComponent onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>

        {/* Projects grid */}
        <div className="flex-1">
          {error && (
            <Alert variant="danger" message={error}/>
          )}

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
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} isPublic={true} />
              ))}
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
);
}