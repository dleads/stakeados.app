export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-600 border-t-green-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Cargando Stakeados...</p>
      </div>
    </div>
  );
}
