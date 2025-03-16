"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.header 
        className="flex justify-between items-center p-6 sm:p-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-6 h-6 bg-accent rounded-sm"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          ></motion.div>
          <span className="font-medium text-base tracking-tight">optimapped.</span>
        </div>
        <nav className="hidden sm:flex gap-8">
          <Link href="#features" passHref>
            <motion.a 
              className="text-sm text-muted hover:text-accent transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Features
            </motion.a>
          </Link>
          <Link href="#about" passHref>
            <motion.a 
              className="text-sm text-muted hover:text-accent transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              About
            </motion.a>
          </Link>
          <Link href="#contact" passHref>
            <motion.a 
              className="text-sm text-muted hover:text-accent transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Contact
            </motion.a>
          </Link>
        </nav>
      </motion.header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow px-6 sm:px-10">
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-4xl mb-3 text-foreground font-bold">
            Focus better.
          </h1>
          <p className="text-sm text-muted mb-12">
            The scientific planning tool for maximum productivity
          </p>
        </motion.div>

        {/* Get Started Button */}
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/authorization" passHref>
            <motion.button
              className="w-full bg-white text-gray-800 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors shadow-md shadow-white/20 cursor-pointer border border-gray-100"
              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(255, 255, 255, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Get Started
            </motion.button>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="flex justify-center p-6 sm:p-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <p className="text-sm text-muted opacity-70">
          © {new Date().getFullYear()} Optimapped. All rights reserved.
        </p>
      </motion.footer>
    </div>
  );
}