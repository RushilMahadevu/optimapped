"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle authentication logic here
    console.log({ email, password, name, isLogin });
  };

  const handleGoogleSignIn = () => {
    // Implement Google authentication logic
    console.log("Signing in with Google");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.header 
        className="flex justify-between items-center p-6 sm:p-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" passHref>
          <div className="flex items-center gap-2 cursor-pointer">
            <motion.div 
              className="w-6 h-6 bg-accent rounded-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            ></motion.div>
            <span className="font-medium text-base tracking-tight">optimapped.</span>
          </div>
        </Link>
      </motion.header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow px-6 sm:px-10">
        <motion.div 
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl mb-6 text-foreground font-bold text-center">
            {isLogin ? "Sign In" : "Create Account"}
          </h1>
          
          {/* Social Sign-in Options */}
          <motion.div 
            className="space-y-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <motion.button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-background border border-gray-700 text-foreground text-sm hover:bg-gray-900 transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              Continue with Google
            </motion.button>
          </motion.div>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted">or continue with email</span>
            </div>
          </div>
          
          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {!isLogin && (
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm text-muted">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-gray-700 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm text-muted">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-gray-700 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm text-muted">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-gray-700 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            
            <motion.button
              type="submit"
              className="w-full bg-white text-gray-800 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors shadow-md shadow-white/20 cursor-pointer border border-gray-100 mt-6"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(255, 255, 255, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </motion.button>
          </motion.form>
          
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button 
              className="text-sm text-accent hover:underline cursor-pointer"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="flex justify-center p-6 sm:p-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <p className="text-sm text-muted opacity-70">
          © {new Date().getFullYear()} Optimapped. All rights reserved.
        </p>
      </motion.footer>
    </div>
  );
}