import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen justify-between p-6 sm:p-8">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black dark:bg-white rounded-sm"></div>
          <span className="font-medium text-base tracking-tight">optimapped</span>
        </div>
        <nav className="hidden sm:flex gap-6">
          <a href="#features" className="text-sm hover:text-accent transition-colors">Features</a>
          <a href="#about" className="text-sm hover:text-accent transition-colors">About</a>
          <a href="#contact" className="text-sm hover:text-accent transition-colors">Contact</a>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center gap-8 py-12 flex-grow">
        <div className="text-center max-w-md">
          <h1 className="app-heading text-3xl sm:text-4xl mb-3">
            Plan your journey
          </h1>
          <p className="text-sm text-muted mb-8">
            The minimalist planning tool for maximum productivity
          </p>
        </div>

        {/* Login form */}
        <div className="w-full max-w-xs">
          <form className="flex flex-col gap-4">
            <div>
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full px-4 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full px-4 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-md text-sm font-medium hover:bg-dark-gray dark:hover:bg-light-gray transition-colors"
            >
              Sign In
            </button>
          </form>
          <div className="text-center mt-4">
            <Link href="/signup" className="text-xs text-muted hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex justify-center py-6">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Optimapped. All rights reserved.
        </p>
      </footer>
    </div>
  );
}