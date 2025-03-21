"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { 
  ArrowLeft, 
  UserCircle, 
  Save, 
  Trash2, 
  LogOut,
  Settings as SettingsIcon,
  Clock,
  LineChart,
  ScanEye
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserSettings(currentUser.uid);
      } else {
        // Redirect to login page if not authenticated
        router.push("/authorization");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserSettings = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.settings) {
          setDarkMode(userData.settings.darkMode ?? true);
          setNotifications(userData.settings.notifications ?? true);
        }
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, "users", user.uid), {
        "settings.darkMode": darkMode,
        "settings.notifications": notifications,
      });
      
      // Show success message here
      alert("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      // Show error message here
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
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-800/30 transition-colors cursor-pointer"
            whileHover={{ x: 2 }}
            onClick={() => router.push('/dashboard')}
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
            <UserCircle size={18} />
            <span>Profile</span>
          </motion.div>
          
          <motion.div
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-gray-800/50 font-medium"
            whileHover={{ x: 2 }}
          >
            <SettingsIcon size={18} />
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
      <main className="flex-1">
        {/* Header */}
        <motion.header 
          className="border-b border-gray-800 p-6 flex items-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            className="mr-4 md:hidden"
            onClick={() => router.back()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="text-xl font-bold">Settings</h1>
        </motion.header>

        <motion.div 
          className="p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Settings Navigation Tabs */}
          <div className="flex space-x-1 mb-6 border-b border-gray-800">
            <button 
              className="px-4 py-2 text-sm font-medium border-b-2 border-accent text-accent"
            >
              Account
            </button>
          </div>

          {/* Account Settings */}
          <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
          >
            <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            
            <div className="mb-6 flex items-center">
                {user?.photoURL ? (
                <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full mr-4"
                />
                ) : (
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xl mr-4">
                    {user?.displayName?.[0] || user?.email?.[0] || '?'}
                </div>
                )}
                <div>
                <h3 className="font-medium">{user?.displayName || 'User'}</h3>
                <p className="text-sm text-foreground/70">{user?.email}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-foreground/70 mb-1">Display Name</label>
                    <input 
                    type="text" 
                    defaultValue={user?.displayName || ''} 
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>
                <div>
                    <label className="block text-sm text-foreground/70 mb-1">Email</label>
                    <input 
                    type="email" 
                    defaultValue={user?.email || ''} 
                    readOnly
                    className="w-full px-3 py-2 bg-gray-800/30 border border-gray-700 rounded-lg text-foreground/70"
                    />
                </div>
                </div>
            </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
            <div className="flex flex-row gap-3">
              <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
              >
                  <Trash2 size={16} />
                  Delete Account
              </motion.button>
              
              <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-lg hover:bg-orange-500/30"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSignOut}
              >
                  <LogOut size={16} />
                  Sign Out
              </motion.button>
            </div>
            </div>

            <div className="flex justify-end pt-4">
              <motion.button
                  className="px-4 py-2 bg-accent text-white rounded-lg flex items-center gap-2"
                  onClick={saveSettings}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
              >
                  <Save size={16} />
                  Save Changes
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

      </main>
    </div>
  );
}