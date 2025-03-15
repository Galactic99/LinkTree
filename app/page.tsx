import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
      <div className="max-w-5xl w-full text-center backdrop-blur-lg bg-white/5 rounded-2xl p-8 shadow-2xl border border-white/10">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Welcome to Your Custom Linktree Generator
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Create your personalized link page with advanced customization options
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/auth/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </Link>
          <Link
            href="/features"
            className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Learn More
          </Link>
        </div>
      </div>
    </main>
  );
}
