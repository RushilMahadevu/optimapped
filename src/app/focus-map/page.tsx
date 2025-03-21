"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Trash, 
  Plus, 
  Minus, 
  AlertCircle,
  Sparkles, // Add this for the AI insights button
  Loader2, // Add this for loading state
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth'; // Add this import
import { getGeminiResponse, GeminiResponse } from '../utils/geminiApi';
import { marked } from 'marked';

// Types for focus map nodes
interface FocusNode {
  id: string;
  type: 'task' | 'break' | 'habit' | 'environment';
  label: string;
  description?: string;
  position: { x: number; y: number };
  category?: string;
  score?: number;
  color?: string;
}

interface FocusMap {
  id?: string;
  name: string;
  nodes: FocusNode[];
  createdAt?: string;
  updatedAt?: string;
}

// Focus assessment result type
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

// Category colors for visual distinction
const categoryColors = {
  attention: '#4f46e5', // indigo
  distraction: '#ef4444', // red
  environment: '#10b981', // emerald
  habits: '#f59e0b', // amber
  cognitive: '#8b5cf6', // violet
};

const FocusMapPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // Update the type here
  const [focusData, setFocusData] = useState<FocusAssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusMap, setFocusMap] = useState<FocusMap>({
    name: 'My Focus Map',
    nodes: [],
  });
  const [selectedNode, setSelectedNode] = useState<FocusNode | null>(null);
  const [mapName, setMapName] = useState('My Focus Map');
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch focus assessment data from Firestore
  const fetchFocusData = async (userId: string) => {
    try {
      // Get user document to retrieve latest assessment data
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists() && userDoc.data().latestFocusAssessment) {
        const assessmentData = userDoc.data().latestFocusAssessment;
        setFocusData(assessmentData);
        
        // Initialize map with focus assessment data
        generateInitialMap(assessmentData);
      } else {
        // Also check localStorage as backup
        const localData = localStorage.getItem('focusAssessmentResults');
        if (localData) {
          const parsedData = JSON.parse(localData);
          setFocusData(parsedData);
          generateInitialMap(parsedData);
        } else {
          // No assessment data available
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching focus data:", error);
      setLoading(false);
    }
  };

  // Generate initial focus map based on assessment data
  const generateInitialMap = (assessmentData: FocusAssessmentResult) => {
    const nodes: FocusNode[] = [];
    
    // Create center node representing the user
    nodes.push({
      id: 'center',
      type: 'task',
      label: 'My Focus',
      description: `Overall focus score: ${assessmentData.focusScore}%`,
      position: { x: 500, y: 300 },
      score: assessmentData.focusScore
    });
    
    // Create category nodes
    const categories = Object.entries(assessmentData.categoryScores);
    const angleIncrement = (2 * Math.PI) / categories.length;
    
    categories.forEach(([category, score], index) => {
      const angle = index * angleIncrement;
      const radius = 180;
      const x = 500 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      nodes.push({
        id: category,
        type: 'task',
        label: formatCategoryName(category),
        description: `Score: ${score}%`,
        position: { x, y },
        category,
        score,
        color: categoryColors[category as keyof typeof categoryColors] || '#6b7280'
      });
    });
    
    setFocusMap({
      name: 'My Focus Map',
      nodes,
    });
    
    setLoading(false);
    setHasUnsavedChanges(true);
  };
  
  // Format category name for display
  const formatCategoryName = (category: string): string => {
    const categoryLabels: {[key: string]: string} = {
      attention: "Sustained Attention",
      distraction: "Distraction Management", 
      environment: "Environment Optimization",
      habits: "Focus Habits",
      cognitive: "Cognitive Control"
    };
    
    return categoryLabels[category] || category;
  };

  // Save the focus map to Firestore
  const saveMap = async () => {
    if (!user) {
      console.error("No authenticated user");
      return;
    }
    
    try {
      const mapData = {
        ...focusMap,
        name: mapName,
        updatedAt: new Date().toISOString(),
        createdAt: focusMap.createdAt || new Date().toISOString()
      };
      
      // Save to Firestore
      const mapsRef = collection(db, "users", user.uid, "focus-maps");
      
      if (focusMap.id) {
        // Update existing map
        await setDoc(doc(db, "users", user.uid, "focus-maps", focusMap.id), mapData);
      } else {
        // Create new map
        const newMapRef = await addDoc(mapsRef, {
          ...mapData,
          createdAt: serverTimestamp(),
        });
        
        setFocusMap({
          ...mapData,
          id: newMapRef.id
        });
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving focus map:", error);
    }
  };

  // Handle node selection
  const handleNodeSelect = (node: FocusNode) => {
    setSelectedNode(node === selectedNode ? null : node);
  };
  
  // Handle node position update
  const updateNodePosition = (id: string, newPos: { x: number; y: number }) => {
    setFocusMap(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === id ? { ...node, position: newPos } : node
      )
    }));
    setHasUnsavedChanges(true);
  };
  
  // Add a new node
  const addNode = (type: FocusNode['type']) => {
    const newId = `node-${Date.now()}`;
    const newNode: FocusNode = {
      id: newId,
      type,
      label: `New ${type}`,
      position: { x: 500 + Math.random() * 100 - 50, y: 300 + Math.random() * 100 - 50 },
    };
    
    setFocusMap(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedNode(newNode);
    setHasUnsavedChanges(true);
  };
  
  // Update node properties
  const updateNode = (id: string, updates: Partial<FocusNode>) => {
    setFocusMap(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === id ? { ...node, ...updates } : node
      )
    }));
    
    if (selectedNode?.id === id) {
      setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
    }
    
    setHasUnsavedChanges(true);
  };
  
  // Delete a node
  const deleteNode = (id: string) => {
    setFocusMap(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== id),
    }));
    
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
    
    setHasUnsavedChanges(true);
  };
  
  // Handle map dragging
  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };
  
  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - startPos.x) * (1 / zoom);
    const dy = (e.clientY - startPos.y) * (1 / zoom);
    
    setViewportOffset({
      x: viewportOffset.x + dx,
      y: viewportOffset.y + dy
    });
    
    setStartPos({ x: e.clientX, y: e.clientY });
  };
  
  const endDrag = () => {
    setIsDragging(false);
  };
  
  // Zoom controls
  const handleZoom = (zoomIn: boolean) => {
    setZoom(prev => {
      const newZoom = zoomIn ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(2, newZoom));
    });
  };

  // Function to generate AI insights about the focus map
  const generateAiInsights = async () => {
    console.log("Generating AI insights...");
    setAiLoading(true);
    setAiError(null);
  
    try {
      // Create a detailed map data object based on the focus map data
      const mapData = {
        overallScore: focusData?.focusScore || 0,
        categoryScores: focusData?.categoryScores || {},
        nodeCount: focusMap.nodes.length,
        nodeTypes: focusMap.nodes.reduce((types, node) => {
          types[node.type] = (types[node.type] || 0) + 1;
          return types;
        }, {} as Record<string, number>)
      };
  
      // Include mapData details in the prompt
      const prompt = `
        I want you to analyze my focus map and provide personalized insights and suggestions only provide 3.
        
        Here's my full focus data:
        ${JSON.stringify(mapData, null, 2)}
        
        Based on the above, please provide make sure it stays CONCISE and actionable insights on the following:
        1. A brief analysis of my current focus strengths and weaknesses
        2. 3-5 specific, actionable suggestions to improve my focus
        3. Recommendations for how I could better structure my focus map
      `;
  
      const response = await getGeminiResponse(prompt);
  
      if (response.error) {
        setAiError(response.error);
      } else {
        setAiInsights(response.text);
        console.log("AI insights successfully generated!");
      }
    } catch (error) {
      setAiError(`Failed to generate insights: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
  }, [focusMap.nodes]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <motion.header 
        className="border-b border-gray-800 p-6 flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={mapName}
            onChange={(e) => {
              setMapName(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
          />
          
          <motion.button
            onClick={() => generateAiInsights()}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={aiLoading || !focusData}
          >
            {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            AI Insights
          </motion.button>
          
          <motion.button
            onClick={saveMap}
            disabled={!hasUnsavedChanges}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              hasUnsavedChanges ? 'bg-accent text-white' : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={{ scale: hasUnsavedChanges ? 1.02 : 1 }}
            whileTap={{ scale: hasUnsavedChanges ? 0.98 : 1 }}
          >
            <Save size={18} />
            Save Map
          </motion.button>
        </div>
      </motion.header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Tools */}
        <motion.div 
          className="w-64 border-r border-gray-800 p-6 overflow-y-auto"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {focusData ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4">Focus Assessment</h2>
                <div className="space-y-4">
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground/70">Overall Score</span>
                      <span className="font-semibold">{focusData.focusScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full">
                      <div 
                        className="h-full rounded-full bg-accent" 
                        style={{ width: `${focusData.focusScore}%` }}
                      />
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-sm text-foreground/70">Category Scores</h3>
                  {Object.entries(focusData.categoryScores).map(([category, score]) => (
                    <div key={category} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] || '#6b7280' }} 
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{formatCategoryName(category)}</span>
                          <span>{score}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${score}%`,
                              backgroundColor: categoryColors[category as keyof typeof categoryColors] || '#6b7280'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4">Add Elements</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => addNode('task')}
                    className="w-full px-4 py-2 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg text-sm text-left border border-gray-700"
                  >
                    + Add Task Node
                  </button>
                  <button
                    onClick={() => addNode('habit')}
                    className="w-full px-4 py-2 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg text-sm text-left border border-gray-700"
                  >
                    + Add Habit Node
                  </button>
                  <button
                    onClick={() => addNode('break')}
                    className="w-full px-4 py-2 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg text-sm text-left border border-gray-700"
                  >
                    + Add Break Node
                  </button>
                  <button
                    onClick={() => addNode('environment')}
                    className="w-full px-4 py-2 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg text-sm text-left border border-gray-700"
                  >
                    + Add Environment Node
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="text-amber-500 mb-4" size={40} />
              <p className="text-center text-foreground/70 mb-4">
                No focus assessment data available. Complete an assessment to create a focus map.
              </p>
              <Link 
                href="/focus-assessment" 
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90"
              >
                Take Focus Assessment
              </Link>
            </div>
          )}
        </motion.div>

        {/* Main canvas area */}
        <div className="flex-1 relative overflow-hidden" onMouseDown={startDrag} onMouseMove={onDrag} onMouseUp={endDrag} onMouseLeave={endDrag}>
          {/* Canvas Dotted Background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${viewportOffset.x % (20 * zoom)}px ${viewportOffset.y % (20 * zoom)}px`,
            }}
          />

          {/* Canvas Controls */}
          <div className="absolute top-4 right-4 flex gap-2 bg-gray-800/70 p-2 rounded-lg backdrop-blur-sm z-10">
            <button
              onClick={() => handleZoom(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => handleZoom(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700"
            >
              <Minus size={16} />
            </button>
          </div>
          
          {/* Canvas */}
          <div 
            className="w-full h-full cursor-move"
            style={{
              transform: `scale(${zoom}) translate(${viewportOffset.x}px, ${viewportOffset.y}px)`
            }}
          >
            {/* Render nodes */}
            {focusMap.nodes.map((node) => (
              <motion.div
                key={node.id}
                className={`absolute bg-gray-800/70 backdrop-blur-sm border rounded-lg p-4 cursor-pointer transition-shadow ${
                  node.id === selectedNode?.id ? 'shadow-lg border-accent' : 'border-gray-700 hover:border-gray-500'
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: 'translate(-50%, -50%)',
                  width: node.id === 'center' ? '240px' : '160px',
                  backgroundColor: node.color ? `${node.color}20` : undefined,
                  borderColor: node.id === selectedNode?.id ? 'var(--accent)' : node.color || undefined,
                  cursor: node.id === 'center' ? 'pointer' : 'move'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeSelect(node);
                }}
                drag={node.id !== 'center'} // Only allow dragging for non-center nodes
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={() => setIsDragging(false)} // Prevent canvas drag when dragging nodes
                onDrag={(_, info) => {
                  // Only update position for non-center nodes
                  if (node.id !== 'center') {
                    const x = node.position.x + info.delta.x / zoom;
                    const y = node.position.y + info.delta.y / zoom;
                    
                    updateNodePosition(node.id, { x, y });
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  {node.category && (
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: node.color || '#6b7280' }} 
                    />
                  )}
                  <div className="text-xs text-foreground/50 ml-auto">
                    {node.type}
                  </div>
                </div>
                
                <h3 className="font-medium text-sm mb-1 truncate">
                  {node.label}
                </h3>
                
                {node.description && (
                  <p className="text-xs text-foreground/70 truncate">
                    {node.description}
                  </p>
                )}
                
                {node.score !== undefined && (
                  <div className="mt-2 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${node.score}%`,
                        backgroundColor: node.color || 'var(--accent)' 
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right sidebar - Properties or AI Insights */}
        {aiInsights ? (
          <motion.div 
            className="w-144 border-l border-gray-800 p-6 overflow-y-auto" // Changed from w-72 to w-96 for more width
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">AI Focus Insights</h2>
              <button
                onClick={() => setAiInsights(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                &times;
              </button>
            </div>
            
            {aiError ? (
              <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm">{aiError}</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: marked.parse(aiInsights) }} />
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={() => setAiInsights(null)}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
              >
                Return to Node Editor
              </button>
            </div>
          </motion.div>
        ) : selectedNode ? (
          // Your existing selected node editor
          <motion.div 
            className="w-72 border-l border-gray-800 p-6 overflow-y-auto"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Node Properties</h2>
              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="text-red-500 hover:text-red-400"
              >
                <Trash size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-foreground/70 mb-1">Label</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-foreground/70 mb-1">Description</label>
                <textarea
                  value={selectedNode.description || ''}
                  onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm text-foreground/70 mb-1">Type</label>
                <select
                  value={selectedNode.type}
                  onChange={(e) => updateNode(selectedNode.id, { type: e.target.value as FocusNode['type'] })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="task">Task</option>
                  <option value="break">Break</option>
                  <option value="habit">Habit</option>
                  <option value="environment">Environment</option>
                </select>
              </div>
              
              {selectedNode.id !== 'center' && (
                <div>
                  <label className="block text-sm text-foreground/70 mb-1">Category</label>
                  <select
                    value={selectedNode.category || ''}
                    onChange={(e) => {
                      const category = e.target.value;
                      updateNode(selectedNode.id, { 
                        category: category || undefined,
                        color: category ? categoryColors[category as keyof typeof categoryColors] : undefined
                      });
                    }}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="">None</option>
                    <option value="attention">Attention</option>
                    <option value="distraction">Distraction</option>
                    <option value="environment">Environment</option>
                    <option value="habits">Habits</option>
                    <option value="cognitive">Cognitive</option>
                  </select>
                </div>
              )}
              
              {selectedNode.score !== undefined && (
                <div>
                  <label className="block text-sm text-foreground/70 mb-1">Score</label>
                  {/* For assessment-derived nodes (center node or category nodes), show a non-editable score */}
                  {(selectedNode.id === 'center' || Object.keys(categoryColors).includes(selectedNode.id)) ? (
                    <div className="flex flex-col">
                      <div className="w-full h-2 bg-gray-700 rounded-full mt-1 mb-2">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${selectedNode.score}%`,
                            backgroundColor: selectedNode.color || 'var(--accent)' 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-foreground/50">
                        <span>0%</span>
                        <span className="font-medium text-sm">{selectedNode.score}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  ) : (
                    // For user-created nodes, allow score editing
                    <>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedNode.score}
                        onChange={(e) => updateNode(selectedNode.id, { score: parseInt(e.target.value) })}
                        className="w-full accent-accent"
                      />
                      <div className="flex justify-between text-xs text-foreground/50">
                        <span>0%</span>
                        <span>{selectedNode.score}%</span>
                        <span>100%</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default FocusMapPage;