export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-green-400 mb-4">404</h1>
        <p className="text-lg text-gray-300 mb-8">
          La página que buscas no existe o fue movida.
        </p>
        <a
          href="/"
          className="inline-block bg-green-500 hover:bg-green-600 text-black font-medium px-6 py-3 rounded-md"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
