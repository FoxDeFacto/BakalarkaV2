// src/components/projects/ProjectCard.tsx
import Link from 'next/link';
import { Project } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface ProjectCardProps {
  project: Project;
  isPublic?: boolean;
}

export function ProjectCard({ project, isPublic }: ProjectCardProps) {
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
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-4">
        {project.thumbnail ? (
          <div className="aspect-w-16 aspect-h-9 mb-4">
            <img
              src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${project.thumbnail}`}
              alt={project.title}
              className="object-cover w-full h-48 rounded"
            />
          </div>
        ) : (
          <div className="bg-gray-200 flex items-center justify-center h-48 mb-4 rounded">
            <svg
              className="h-12 w-12 text-gray-400"
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
          </div>
        )}

        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 truncate">{project.title}</h3>
          <Badge variant={getStatusBadgeColor(project.status)}>
            {project.status_display}
          </Badge>
        </div>

        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>

        <div className="mt-3">
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {project.student_name}
          </div>

          <div className="flex items-center mt-1 text-sm text-gray-500">
            <svg
              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {project.year}
          </div>

          <div className="flex items-center mt-1 text-sm text-gray-500">
            <svg
              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {project.field}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.keywords.slice(0, 3).map((keyword, index) => (
            <Badge key={index} variant="gray" size="sm">
              {keyword}
            </Badge>
          ))}
          {project.keywords.length > 3 && (
            <Badge variant="gray" size="sm">
              +{project.keywords.length - 3} více
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <Link
            href={isPublic ? `/projects-public/${project.id}` : `/projects/${project.id}`}
            className="text-orange-600 hover:text-orange-800 font-medium"
          >
            Zobrazit detail →
          </Link>
        </div>
      </div>
    </div>
  );
}
