import { getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-green-400">404</h1>
        </div>

        {/* Error message */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Page Not Found
        </h2>

        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        {/* Navigation options */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`/${locale}`}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
            >
              Go Home
            </a>
            <a
              href={`/${locale}/admin`}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
            >
              Admin Dashboard
            </a>
          </div>
        </div>

        {/* Helpful links */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4">
            Popular Destinations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <a
              href={`/${locale}`}
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              🏠 Homepage
            </a>
            <a
              href={`/${locale}/admin`}
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              ⚙️ Admin Panel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
