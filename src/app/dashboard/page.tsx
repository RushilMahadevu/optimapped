"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { LogOut, Brain, Settings, Plus, User as UserIcon, Search, Clock, LineChart, AlertTriangle, Award, Map, RotateCcw, ScanEye } from "lucide-react";

// Type definition for focus assessment results
interface FocusAssessmentResult {
  focusScore: number;
  categoryScores: {
    attention: number;
    distraction: number;
    environment: number;
    habits: number;
    cognitive: number;
  };
  peakFocusHours: string;
  strengths: string[];
  improvements: string[];
  completedAt?: string;
}

// Map category names to readable versions
const categoryLabels: {[key: string]: string} = {
  attention: "Sustained Attention",
  distraction: "Distraction Management",
  environment: "Environment Optimization",
  habits: "Focus Habits",
  cognitive: "Cognitive Control"
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusData, setFocusData] = useState<FocusAssessmentResult | null>(null);
  const [showRetakeWarning, setShowRetakeWarning] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch focus assessment data when user is authenticated
        fetchFocusData(currentUser.uid);
      } else {
        // Redirect to login page if not authenticated
        router.push("/authorization");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch focus assessment data from Firestore
  const fetchFocusData = async (userId: string) => {
    try {
      // Get user document to retrieve latest assessment data
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists() && userDoc.data().latestFocusAssessment) {
        setFocusData(userDoc.data().latestFocusAssessment);
      } else {
        // Also check localStorage as backup
        const localData = localStorage.getItem('focusAssessmentResults');
        if (localData) {
          const parsedData = JSON.parse(localData);
          setFocusData(parsedData);
          
          // Since we found data in localStorage but not in Firestore,
          // we should save it to Firestore for consistency
          try {
            await setDoc(doc(db, "users", userId), {
              latestFocusAssessment: parsedData,
              lastUpdated: serverTimestamp(),
            }, { merge: true });
          } catch (error) {
            console.error("Error syncing local data to Firestore:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching focus data:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Format relative time (e.g. "2 days ago")
  const getRelativeTimeString = (dateString?: string): string => {
    if (!dateString) return "Recently";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  // Get strength text based on score
  const getStrengthText = (score: number): string => {
    if (score >= 90) return "Exceptional";
    if (score >= 80) return "Very Strong";
    if (score >= 70) return "Strong";
    if (score >= 60) return "Above Average";
    if (score >= 50) return "Average";
    if (score >= 40) return "Below Average";
    if (score >= 30) return "Needs Improvement";
    return "Significant Attention Required";
  }

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
            <ScanEye size={18} />
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
            className={`bg-gray-800/30 rounded-xl p-6 mb-8 border ${focusData ? 'border-gray-800' : 'border-accent/30'}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {focusData ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium mb-2">Welcome back, {user?.displayName || 'there'}!</h2>
                  <p className="text-foreground/70">
                    {focusData.focusScore >= 80 
                      ? "You're showing excellent focus capabilities! Keep up the great work."
                      : focusData.focusScore >= 60
                      ? "Your focus profile shows promising patterns. Regular practice will help you improve."
                      : "We've identified specific areas to help you build stronger focus habits."}
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowRetakeWarning(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 cursor-pointer whitespace-nowrap"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw size={16} />
                  Retake Assessment
                </motion.button>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-medium mb-2">Welcome, {user?.displayName || 'there'}!</h2>
                <p className="text-foreground/70 mb-4">Map your cognitive patterns and optimize your focus based on neuroscientific research.</p>
                <motion.button
                  onClick={() => router.push('/focus-assessment')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={16} />
                  Start Focus Assessment
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Focus Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Focus Score Card */}
            <motion.div 
              className={`bg-gray-800/20 rounded-xl p-5 border ${focusData ? 'border-gray-800' : 'border-gray-700'}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-foreground/70 text-sm">Focus Score</h3>
                <LineChart size={16} className={focusData ? "text-accent" : "text-foreground/50"} />
              </div>
              
              {focusData ? (
                <>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold">{focusData.focusScore}</span>
                    <span className="text-foreground/50 text-sm mb-1">/100</span>
                  </div>
                  <div className="mb-2 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${
                        focusData.focusScore >= 80 ? 'bg-green-500' :
                        focusData.focusScore >= 60 ? 'bg-blue-500' :
                        focusData.focusScore >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      initial={{ width: '0%' }}
                      animate={{ width: `${focusData.focusScore}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-foreground/70">
                    {getStrengthText(focusData.focusScore)} · {getRelativeTimeString(focusData.completedAt)}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium">Not available</span>
                  </div>
                  <div className="mb-2 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-gray-600 rounded-full"></div>
                  </div>
                  <p className="text-xs text-foreground/70">Complete an assessment to get your score</p>
                </>
              )}
            </motion.div>

            {/* Peak Focus Hours Card */}
            <motion.div 
              className={`bg-gray-800/20 rounded-xl p-5 border ${focusData ? 'border-gray-800' : 'border-gray-700'}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-foreground/70 text-sm">Peak Focus Time</h3>
                <Clock size={16} className={focusData ? "text-accent" : "text-foreground/50"} />
              </div>
              
              {focusData ? (
                <>
                  <div className="flex items-center mb-1">
                    <span className="text-2xl font-bold">{focusData.peakFocusHours}</span>
                  </div>
                  <div className="mb-2 flex items-center space-x-1">
                    {Array.from({length: 5}).map((_, i) => {
                      const timeSlots = ["5-8 AM", "9-11 AM", "1-4 PM", "6-9 PM", "10PM-12AM"];
                      const isActive = focusData.peakFocusHours.includes(timeSlots[i]);
                      return (
                        <div key={i} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-full h-2 rounded-full ${isActive ? 'bg-white' : 'bg-gray-700'}`}
                          ></div>
                          <span className="text-[10px] text-foreground/50 mt-1 hidden md:inline">
                            {i === 0 ? "AM" : i === 1 ? "Mid" : i === 2 ? "PM" : i === 3 ? "Eve" : "Night"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-foreground/70">Schedule deep work during these hours</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Not determined</span>
                  </div>
                  <div className="mb-2 flex items-center space-x-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div className="w-full h-2 bg-gray-700 rounded-full"></div>
                        <span className="text-[10px] text-foreground/50 mt-1 hidden md:inline">
                          {i === 0 ? "AM" : i === 1 ? "Mid" : i === 2 ? "PM" : i === 3 ? "Eve" : "Night"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-foreground/70">Take assessment to discover your optimal hours</p>
                </>
              )}
            </motion.div>

            {/* Focus Strength Card */}
            <motion.div 
              className={`bg-gray-800/20 rounded-xl p-5 border ${focusData ? 'border-gray-800' : 'border-gray-700'}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-foreground/70 text-sm">Focus Strength</h3>
                <Brain size={16} className={focusData ? "text-accent" : "text-foreground/50"} />
              </div>
              
              {focusData && focusData.strengths && focusData.strengths.length > 0 ? (
                <>
                  <div className="flex items-center mb-1">
                    <span className="text-xl font-bold truncate">
                      {focusData.strengths[0] === "balanced" 
                        ? "Balanced Profile" 
                        : categoryLabels[focusData.strengths[0]] || focusData.strengths[0]}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Award size={12} className="text-accent" />
                      <span className="text-foreground/70">Your top cognitive strength</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/70">Leverage this strength in your productivity system</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Unknown</span>
                  </div>
                  <div className="mb-2">
                    <div className="w-24 h-1.5 bg-gray-700 rounded-full"></div>
                  </div>
                  <p className="text-xs text-foreground/70">Complete assessment to identify your strengths</p>
                </>
              )}
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
              <Map size={32} className="mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium mb-2">No focus maps yet</h3>
              <p className="text-foreground/70 mb-4 max-w-md mx-auto">
                Create your first cognitive focus map to visualize your attention patterns. Based on peer-reviewed research in neuroscience.
              </p>
              <motion.button
                onClick={() => router.push('/focus-assessment')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/80"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={16} />
                Create Your First Focus Map
              </motion.button>
            </motion.div>
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
        
        {/* Retake Warning Modal */}
        {showRetakeWarning && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background border border-gray-800 rounded-lg max-w-md w-full p-6"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <AlertTriangle className="text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Are you sure?</h3>
                  <p className="text-foreground/70 mb-4">
                    It&apos;s recommended to only retake the assessment if you made mistakes in your answers. Your focus score will naturally improve through creating and following focus maps rather than retaking the assessment.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRetakeWarning(false)}
                  className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRetakeWarning(false);
                    router.push('/focus-assessment');
                  }}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
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
          onClick={() => router.push('/focus-assessment')}
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