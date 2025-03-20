"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { User } from "firebase/auth";
import Link from "next/link";
import { LogOut, Brain, Settings, Plus, User as UserIcon, Search, Clock, LineChart, Calendar } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Redirect to login page if not authenticated
        router.push("/authorization");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <motion.aside 
        className="w-64 border-r border-gray-800 p-6 hidden md:block"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <motion.div 
            className="w-6 h-6 bg-accent rounded-sm"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          ></motion.div>
          <span className="font-medium text-base tracking-tight">optimapped.</span>
        </Link>
        
        {/* Navigation */}
        <nav className="space-y-1">
          <motion.div
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-gray-800/50 font-medium"
            whileHover={{ x: 2 }}
          >
            <Brain size={18} />
            <span>Focus Mapping</span>
          </motion.div>
          
          <motion.div
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-800/30 transition-colors cursor-pointer"
            whileHover={{ x: 2 }}
          >
            <Clock size={18} />
            <span>Time Insights</span>
          </motion.div>
          
          <motion.div
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-800/30 transition-colors cursor-pointer"
            whileHover={{ x: 2 }}
          >
            <LineChart size={18} />
            <span>Progress</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-800/30 transition-colors cursor-pointer"
            whileHover={{ x: 2 }}
          >
            <UserIcon size={18} />
            <span>Profile</span>
          </motion.div>
          
          <motion.div
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-800/30 transition-colors cursor-pointer"
            whileHover={{ x: 2 }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </motion.div>
        </nav>
        
        {/* User Section */}
        <div className="absolute bottom-6">
          <motion.button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <motion.header 
          className="border-b border-gray-800 p-6 flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">My Focus Journey</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search insights..."
                className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-800/50 text-sm border border-gray-700 focus:outline-none focus:border-accent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                  {user?.displayName?.[0] || user?.email?.[0] || '?'}
                </div>
              )}
              <span className="text-sm hidden lg:inline-block">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <motion.div 
          className="flex-1 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Welcome Message */}
          <motion.div 
            className="bg-gray-800/30 rounded-xl p-6 mb-8 border border-gray-800"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-medium mb-2">Welcome, {user?.displayName || 'there'}!</h2>
            <p className="text-foreground/70 mb-4">Map your cognitive patterns and optimize your focus based on neuroscientific research.</p>
            <motion.button
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} />
              Start Focus Assessment
            </motion.button>
          </motion.div>

          {/* Focus Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div 
              className="bg-gray-800/20 rounded-xl p-5 border border-gray-800"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-foreground/70 text-sm">Focus Score</h3>
                <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">+5%</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">78</span>
                <span className="text-foreground/50 text-sm">/100</span>
              </div>
              <p className="text-xs text-foreground/50 mt-2">Based on your last 7 days of activity</p>
            </motion.div>

            <motion.div 
              className="bg-gray-800/20 rounded-xl p-5 border border-gray-800"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-foreground/70 text-sm">Peak Focus Hours</h3>
                <Calendar size={16} className="text-foreground/50" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">9-11 AM</span>
              </div>
              <p className="text-xs text-foreground/50 mt-2">Schedule deep work during these hours</p>
            </motion.div>

            <motion.div 
              className="bg-gray-800/20 rounded-xl p-5 border border-gray-800"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-foreground/70 text-sm">Focus Streak</h3>
                <div className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">+2 days</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">5 days</span>
              </div>
              <p className="text-xs text-foreground/50 mt-2">Consistent focus improves cognitive control</p>
            </motion.div>
          </div>

          {/* Recent Focus Maps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Your Focus Maps</h2>
              <button className="text-sm text-accent hover:underline">View all</button>
            </div>
            
            {/* If no maps exist yet */}
            <motion.div 
              className="border border-dashed border-gray-700 rounded-xl p-10 text-center"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Brain size={32} className="mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium mb-2">No focus maps yet</h3>
              <p className="text-foreground/70 mb-4 max-w-md mx-auto">
                Create your first cognitive focus map to visualize your attention patterns. Based on peer-reviewed research in neuroscience.
              </p>
              <motion.button
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={16} />
                Create Your First Focus Map
              </motion.button>
            </motion.div>

            {/* Maps Grid (commented out until you have actual maps) */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <motion.div 
                  key={item}
                  className="border border-gray-800 rounded-lg p-4 hover:border-accent/50 transition-colors cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  <div className="h-32 bg-gray-800 rounded-md mb-3"></div>
                  <h3 className="font-medium mb-1">Cognitive Map {item}</h3>
                  <p className="text-sm text-foreground/70">Last edited 2 days ago</p>
                </motion.div>
              ))}
            </div> */}
          </div>

          {/* Research-Based Insights */}
          <motion.div 
            className="bg-gray-800/20 rounded-xl p-6 border border-gray-800"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-lg font-medium mb-4">Science-Backed Focus Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">1</div>
                <div>
                  <p className="font-medium mb-1">Pomodoro Technique</p>
                  <p className="text-foreground/70">Research shows 25-minute focus sessions followed by 5-minute breaks improve sustained attention</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">2</div>
                <div>
                  <p className="font-medium mb-1">Circadian Rhythm Optimization</p>
                  <p className="text-foreground/70">Align difficult tasks with your biological peak alertness periods</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">3</div>
                <div>
                  <p className="font-medium mb-1">Digital Distraction Management</p>
                  <p className="text-foreground/70">Studies show constant notifications reduce IQ by up to 10 points</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">4</div>
                <div>
                  <p className="font-medium mb-1">Mindfulness Practice</p>
                  <p className="text-foreground/70">Regular meditation increases prefrontal cortex activity related to focus</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Mobile navigation */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center py-3 px-6 md:hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.button
          className="flex flex-col items-center justify-center text-accent"
          whileTap={{ scale: 0.9 }}
        >
          <Brain size={20} />
          <span className="text-xs mt-1">Focus</span>
        </motion.button>
        
        <motion.button
          className="flex flex-col items-center justify-center text-foreground/70"
          whileTap={{ scale: 0.9 }}
        >
          <Plus size={20} />
          <span className="text-xs mt-1">New Map</span>
        </motion.button>
        
        <motion.button
          className="flex flex-col items-center justify-center text-foreground/70"
          whileTap={{ scale: 0.9 }}
        >
          <LineChart size={20} />
          <span className="text-xs mt-1">Progress</span>
        </motion.button>
        
        <motion.button
          className="flex flex-col items-center justify-center text-foreground/70"
          whileTap={{ scale: 0.9 }}
        >
          <UserIcon size={20} />
          <span className="text-xs mt-1">Profile</span>
        </motion.button>
      </motion.nav>
    </div>
  );
}