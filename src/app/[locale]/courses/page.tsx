'use client';

import AdminOnlyRoute from '@/components/auth/AdminOnlyRoute';

export default function CoursesPage() {
  return (
    <AdminOnlyRoute featureName="Courses">
      <div className="min-h-screen bg-gradient-gaming">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-neon mb-8">
            Courses Management
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-stakeados-dark/50 backdrop-blur-sm border border-stakeados-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-stakeados-primary mb-4">
                Create New Course
              </h3>
              <p className="text-stakeados-gray-300 mb-4">
                Add new educational content to the platform.
              </p>
              <button className="bg-stakeados-primary hover:bg-stakeados-primary-dark text-white px-4 py-2 rounded-lg">
                Create Course
              </button>
            </div>

            <div className="bg-stakeados-dark/50 backdrop-blur-sm border border-stakeados-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-stakeados-primary mb-4">
                Manage Courses
              </h3>
              <p className="text-stakeados-gray-300 mb-4">
                Edit, delete, and organize existing courses.
              </p>
              <button className="bg-stakeados-primary hover:bg-stakeados-primary-dark text-white px-4 py-2 rounded-lg">
                Manage
              </button>
            </div>

            <div className="bg-stakeados-dark/50 backdrop-blur-sm border border-stakeados-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-stakeados-primary mb-4">
                Course Analytics
              </h3>
              <p className="text-stakeados-gray-300 mb-4">
                View performance metrics and engagement data.
              </p>
              <button className="bg-stakeados-primary hover:bg-stakeados-primary-dark text-white px-4 py-2 rounded-lg">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminOnlyRoute>
  );
}
