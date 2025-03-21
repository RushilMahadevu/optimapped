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
  Brain,
  Clock,
  Check
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Types for focus map nodes and connections
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

interface Connection {
  id: string;
  source: string;
  target: string;
  label?: string;
  strength?: number;
}

interface FocusMap {
  id?: string;
  name: string;
  nodes: FocusNode[];
  connections: Connection[];
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

// Category icons for visual distinction
const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'attention':
      return <Brain size={16} />;
    case 'habits':
      return <Clock size={16} />;
    default:
      return <Brain size={16} />;
  }
};

const FocusMapPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [focusData, setFocusData] = useState<FocusAssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusMap, setFocusMap] = useState<FocusMap>({
    name: 'My Focus Map',
    nodes: [],
    connections: [],
  });
  const [selectedNode, setSelectedNode] = useState<FocusNode | null>(null);
  const [mapName, setMapName] = useState('My Focus Map');
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    
    // Create connections from center to each category
    const connections: Connection[] = categories.map(([category]) => ({
      id: `center-${category}`,
      source: 'center',
      target: category,
      strength: assessmentData.categoryScores[category as keyof typeof assessmentData.categoryScores] / 100
    }));
    
    setFocusMap({
      name: 'My Focus Map',
      nodes,
      connections,
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
      connections: prev.connections.filter(
        conn => conn.source !== id && conn.target !== id
      )
    }));
    
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
    
    setHasUnsavedChanges(true);
  };
  
  // Add a connection between nodes
  const addConnection = (sourceId: string, targetId: string) => {
    const newId = `conn-${Date.now()}`;
    const newConnection: Connection = {
      id: newId,
      source: sourceId,
      target: targetId,
      strength: 0.5
    };
    
    setFocusMap(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
    
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
            {/* Render connections */}
            <svg 
              width="100%" 
              height="100%" 
              className="absolute top-0 left-0 pointer-events-none"
              style={{ transform: `scale(${1/zoom})` }}
            >
              {focusMap.connections.map((conn) => {
                const sourceNode = focusMap.nodes.find(n => n.id === conn.source);
                const targetNode = focusMap.nodes.find(n => n.id === conn.target);
                
                if (!sourceNode || !targetNode) return null;
                
                // Scale positions based on zoom and offset
                const sourceX = (sourceNode.position.x * zoom) + viewportOffset.x;
                const sourceY = (sourceNode.position.y * zoom) + viewportOffset.y;
                const targetX = (targetNode.position.x * zoom) + viewportOffset.x;
                const targetY = (targetNode.position.y * zoom) + viewportOffset.y;
                
                // Calculate line opacity based on connection strength
                const opacity = 0.3 + (conn.strength || 0.5) * 0.7;
                const strokeWidth = 1 + (conn.strength || 0.5) * 2;
                
                // Determine color based on source node category
                const color = sourceNode.color || '#6b7280';
                
                return (
                  <line
                    key={conn.id}
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    strokeDasharray={conn.strength && conn.strength < 0.3 ? "4 2" : undefined}
                  />
                );
              })}
            </svg>
            
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
                  width: node.id === 'center' ? '120px' : '160px',
                  backgroundColor: node.color ? `${node.color}20` : undefined,
                  borderColor: node.id === selectedNode?.id ? 'var(--accent)' : node.color || undefined
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeSelect(node);
                }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={() => setIsDragging(false)} // Prevent canvas drag when dragging nodes
                onDrag={(_, info) => {
                  // Update node position while dragging
                  const x = node.position.x + info.delta.x / zoom;
                  const y = node.position.y + info.delta.y / zoom;
                  updateNodePosition(node.id, { x, y });
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

        {/* Right sidebar - Properties */}
        {selectedNode && (
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
                </div>
              )}
              
              <div>
                <label className="block text-sm text-foreground/70 mb-3">Connections</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {focusMap.nodes
                    .filter(n => n.id !== selectedNode.id)
                    .map(node => {
                      const isConnected = focusMap.connections.some(
                        conn => (conn.source === selectedNode.id && conn.target === node.id) || 
                               (conn.target === selectedNode.id && conn.source === node.id)
                      );
                      
                      return (
                        <div key={node.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {node.category && (
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: node.color || '#6b7280' }} 
                              />
                            )}
                            <span className="text-sm truncate">{node.label}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (isConnected) {
                                // Remove connection
                                setFocusMap(prev => ({
                                  ...prev,
                                  connections: prev.connections.filter(
                                    conn => !((conn.source === selectedNode.id && conn.target === node.id) || 
                                           (conn.target === selectedNode.id && conn.source === node.id))
                                  )
                                }));
                              } else {
                                // Add connection
                                addConnection(selectedNode.id, node.id);
                              }
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isConnected 
                                ? 'bg-accent text-white' 
                                : 'bg-gray-800 text-foreground/50 hover:bg-gray-700'
                            }`}
                          >
                            {isConnected ? <Check size={14} /> : <Plus size={14} />}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FocusMapPage;