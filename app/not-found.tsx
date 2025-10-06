"use client";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#300A24] text-white">
      <div className="text-center p-6">
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-gray-300">The page you are looking for does not exist.</p>
      </div>
    </div>
  );
}