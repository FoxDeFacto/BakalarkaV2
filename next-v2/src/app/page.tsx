// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        </div>
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Student Project Repository
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              A platform for students, teachers, and the public to access and manage research projects and seminar papers.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/projects">
                <Button variant="primary" size="lg">
                  Browse Projects
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Explore our platform</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage student projects
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform provides tools for project management, collaboration, and showcasing student work.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-y-10 gap-x-8 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  </div>
                  Project Documentation
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Upload and showcase complete project documentation, including manuscripts, posters, and presentations.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  </div>
                  Teacher-Student Collaboration
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Teachers can provide structured guidance with milestones, consultations, and evaluations.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  </div>
                  Project Progress Tracking
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Track project progress through defined milestones and development stages for better time management.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  </div>
                  Communication Tools
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Built-in commenting system for feedback and discussion between students and teachers on projects.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-blue-600">
        <div className="px-6 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start managing your projects today
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join our platform to showcase your work, get guidance from teachers, and collaborate with peers.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Get started
                </Button>
              </Link>
              <Link href="/projects" className="text-sm font-semibold leading-6 text-white">
                Browse projects <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}