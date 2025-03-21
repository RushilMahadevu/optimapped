"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ArrowLeft, ArrowRight, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

// Types for focus assessment questions and responses
interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    value: number;
  }[];
  category: "attention" | "distraction" | "environment" | "habits" | "cognitive";
}

// Assessment questions
const focusQuestions: Question[] = [
  {
    id: 1,
    text: "How long can you typically focus on a single task before feeling the need to switch?",
    options: [
      { text: "Less than 15 minutes", value: 1 },
      { text: "15-30 minutes", value: 2 },
      { text: "30-60 minutes", value: 3 },
      { text: "More than 60 minutes", value: 4 },
    ],
    category: "attention"
  },
  {
    id: 2,
    text: "How often do you check your phone or other notifications during focused work?",
    options: [
      { text: "Every few minutes", value: 1 },
      { text: "Every 15-30 minutes", value: 2 },
      { text: "Only during breaks", value: 3 },
      { text: "I keep devices away during focus time", value: 4 },
    ],
    category: "distraction"
  },
  {
    id: 3,
    text: "What time of day do you feel most mentally alert?",
    options: [
      { text: "Early morning (5am-9am)", value: 3 },
      { text: "Late morning (9am-12pm)", value: 4 },
      { text: "Afternoon (1pm-5pm)", value: 3 },
      { text: "Evening (6pm-10pm)", value: 2 },
      { text: "Late night (after 10pm)", value: 1 },
    ],
    category: "habits"
  },
  {
    id: 4,
    text: "How would you describe your typical work environment?",
    options: [
      { text: "Noisy with frequent interruptions", value: 1 },
      { text: "Somewhat distracting", value: 2 },
      { text: "Mostly quiet with occasional interruptions", value: 3 },
      { text: "Controlled environment with minimal distractions", value: 4 },
    ],
    category: "environment"
  },
  {
    id: 5,
    text: "How often do you find yourself daydreaming or with your mind wandering during tasks?",
    options: [
      { text: "Very frequently (multiple times per hour)", value: 1 },
      { text: "Frequently (a few times per hour)", value: 2 },
      { text: "Occasionally (a few times per day)", value: 3 },
      { text: "Rarely (once a day or less)", value: 4 },
    ],
    category: "cognitive"
  },
  {
    id: 6,
    text: "How do you typically react when you receive a notification during focused work?",
    options: [
      { text: "Check it immediately", value: 1 },
      { text: "Feel anxious but try to resist checking", value: 2 },
      { text: "Usually ignore until a natural break", value: 3 },
      { text: "I silence all notifications during focus time", value: 4 },
    ],
    category: "distraction"
  },
  {
    id: 7,
    text: "How often do you use techniques like the Pomodoro method or scheduled breaks?",
    options: [
      { text: "Never heard of them", value: 1 },
      { text: "I know about them but rarely use them", value: 2 },
      { text: "I use them occasionally", value: 3 },
      { text: "I consistently structure my work with these techniques", value: 4 },
    ],
    category: "habits"
  },
  {
    id: 8,
    text: "After being interrupted, how long does it typically take you to refocus?",
    options: [
      { text: "More than 15 minutes", value: 1 },
      { text: "5-15 minutes", value: 2 },
      { text: "1-5 minutes", value: 3 },
      { text: "Less than a minute", value: 4 },
    ],
    category: "attention"
  },
  {
    id: 9,
    text: "How often do you multitask during activities requiring concentration?",
    options: [
      { text: "Almost always", value: 1 },
      { text: "Frequently", value: 2 },
      { text: "Occasionally", value: 3 },
      { text: "Rarely or never", value: 4 },
    ],
    category: "cognitive"
  },
  {
    id: 10,
    text: "How do you organize your workspace before starting focused work?",
    options: [
      { text: "I don't organize it specifically", value: 1 },
      { text: "Minimal cleanup of immediate distractions", value: 2 },
      { text: "Organize tools and materials needed for the task", value: 3 },
      { text: "Methodically prepare environment and remove all distractions", value: 4 },
    ],
    category: "environment"
  }
];

export default function FocusAssessmentPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [showResults, setShowResults] = useState(false);

  // Calculate results based on answers
  const calculateResults = () => {
    // Calculate the overall focus score (0-100)
    const totalPoints = Object.values(answers).reduce((sum, value) => sum + value, 0);
    const maxPossiblePoints = focusQuestions.length * 4; // Maximum 4 points per question
    const focusScore = Math.round((totalPoints / maxPossiblePoints) * 100);
    
    // Calculate category scores
    const categoryScores: {[key: string]: {score: number, maxScore: number}} = {
      attention: {score: 0, maxScore: 0},
      distraction: {score: 0, maxScore: 0},
      environment: {score: 0, maxScore: 0},
      habits: {score: 0, maxScore: 0},
      cognitive: {score: 0, maxScore: 0},
    };
    
    focusQuestions.forEach(q => {
      const answer = answers[q.id] || 0;
      categoryScores[q.category].score += answer;
      categoryScores[q.category].maxScore += 4; // Max points per question
    });
    
    // Determine peak focus hours based on question 3
    const timePreference = answers[3] || 3; // Default to morning if not answered
    let peakFocusHours = "9-11 AM"; // Default
    
    switch(timePreference) {
      case 1: peakFocusHours = "10PM-12AM"; break;
      case 2: peakFocusHours = "6-9 PM"; break;
      case 3: peakFocusHours = "1-4 PM"; break;
      case 4: peakFocusHours = "9-11 AM"; break;
      case 5: peakFocusHours = "5-8 AM"; break;
    }
    
    // Determine focus strengths and areas for improvement
    const categoryPercentages = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      percentage: Math.round((data.score / data.maxScore) * 100)
    }));
    
    const strengths = categoryPercentages
      .filter(cat => cat.percentage >= 70)
      .sort((a, b) => b.percentage - a.percentage)
      .map(cat => cat.category);
      
    const improvements = categoryPercentages
      .filter(cat => cat.percentage < 70)
      .sort((a, b) => a.percentage - b.percentage)
      .map(cat => cat.category);
    
    return {
      focusScore,
      categoryScores: Object.fromEntries(
        Object.entries(categoryScores).map(([k, v]) => 
          [k, Math.round((v.score / v.maxScore) * 100)]
        )
      ),
      peakFocusHours,
      strengths: strengths.length > 0 ? strengths : ["balanced"],
      improvements: improvements.length > 0 ? improvements : []
    };
  };

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [focusQuestions[currentQuestion].id]: value
    }));
    
    if (currentQuestion < focusQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const results = calculateResults();

  // Map category names to readable versions
  const categoryLabels: {[key: string]: string} = {
    attention: "Sustained Attention",
    distraction: "Distraction Management",
    environment: "Environment Optimization",
    habits: "Focus Habits",
    cognitive: "Cognitive Control"
  };

  const getCategoryAdvice = (category: string) => {
    switch(category) {
      case "attention":
        return "Practice focused work sessions in increasing durations. Start with 25 minutes and gradually build up.";
      case "distraction":
        return "Use app blockers and notification silencers during focus sessions. Create a digital minimalism routine.";
      case "environment":
        return "Designate a specific focus zone with minimal visual clutter. Use noise-cancelling headphones if needed.";
      case "habits":
        return "Implement the Pomodoro Technique or time-blocking to structure your work day.";
      case "cognitive":
        return "Practice mindfulness meditation for 10 minutes daily to strengthen your attentional control.";
      default:
        return "Focus on building consistent routines that support your cognitive strengths.";
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <motion.header 
        className="border-b border-gray-800 p-6 flex items-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft size={18} />
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </motion.header>
      
      <main className="flex-1 container max-w-3xl mx-auto px-6 py-10">
        {!showResults ? (
          <motion.div
            key={`question-${currentQuestion}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col"
          >
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-bold">Focus Assessment</h1>
              <span className="text-sm font-medium text-foreground/70">
                Question {currentQuestion + 1} of {focusQuestions.length}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1 bg-gray-800 rounded-full mb-8">
              <motion.div 
                className="h-full bg-accent rounded-full"
                initial={{ width: `${(currentQuestion / focusQuestions.length) * 100}%` }}
                animate={{ width: `${((currentQuestion + 1) / focusQuestions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <div className="bg-gray-800/30 rounded-xl p-6 mb-6 border border-gray-800">
              <h2 className="text-lg font-medium mb-4">{focusQuestions[currentQuestion].text}</h2>
              <div className="space-y-3">
                {focusQuestions[currentQuestion].options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswer(option.value)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-700 hover:border-accent transition-colors flex items-center justify-between cursor-pointer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span>{option.text}</span>
                    <ArrowRight size={16} className="text-gray-500" />
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentQuestion === 0 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <ArrowLeft size={16} />
                Previous
              </button>
              
              <div className="text-sm text-foreground/50">
                {currentQuestion + 1} of {focusQuestions.length}
              </div>
            </div>
          </motion.div>
        ) : (
          // Results display
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-bold">Your Focus Assessment Results</h1>
            </div>
            
            {/* Completion message */}
            <motion.div
              className="flex items-center justify-center gap-3 p-6 bg-accent/20 rounded-xl mb-8 text-accent border border-accent/30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CheckCircle />
              <span className="font-medium">Assessment completed successfully!</span>
            </motion.div>
            
            {/* Focus score */}
            <motion.div 
              className="bg-gray-800/30 rounded-xl p-6 mb-6 border border-gray-800 flex md:flex-row flex-col gap-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex-1">
                <h2 className="text-lg font-medium mb-4">Your Focus Score</h2>
                <div className="flex flex-col items-center">
                  <div className="relative mb-3">
                    <svg className="w-32 h-32">
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        fill="transparent" 
                        className="text-gray-700" 
                      />
                      <motion.circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={351.86} 
                        strokeDashoffset={351.86 - (351.86 * results.focusScore / 100)}
                        strokeLinecap="round"
                        className="text-accent" 
                        initial={{ strokeDashoffset: 351.86 }}
                        animate={{ strokeDashoffset: 351.86 - (351.86 * results.focusScore / 100) }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                      >
                        <span className="text-3xl font-bold">{results.focusScore}</span>
                        <span className="text-sm text-foreground/50">/100</span>
                      </motion.div>
                    </div>
                  </div>
                  <p className="text-sm text-center text-foreground/70">
                    {results.focusScore >= 80 ? "Excellent focus abilities!" : 
                     results.focusScore >= 60 ? "Good focus with room for improvement" :
                     "Focus is an area you can significantly strengthen"}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-md font-medium mb-3">Focus Category Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(results.categoryScores).map(([category, score]) => (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{categoryLabels[category]}</span>
                        <span>{score}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full">
                        <motion.div 
                          className="h-full bg-accent rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Key insights */}
            <motion.div 
              className="bg-gray-800/30 rounded-xl p-6 mb-6 border border-gray-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-lg font-medium mb-4">Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-medium mb-2">Your Peak Focus Hours</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-accent" />
                    <span className="font-bold">{results.peakFocusHours}</span>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Schedule your most demanding cognitive tasks during these hours
                  </p>
                </div>
                
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-medium mb-2">Focus Strengths</h3>
                  <ul className="space-y-1 mb-2">
                    {results.strengths.map((strength, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>{categoryLabels[strength] || strength}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-foreground/70">
                    Leverage these strengths in your daily focus routine
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Recommendations */}
            <motion.div 
              className="bg-gray-800/30 rounded-xl p-6 mb-8 border border-gray-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-lg font-medium mb-4">Focus Recommendations</h2>
              <div className="space-y-4">
                {results.improvements.length > 0 ? (
                  results.improvements.map((area, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium mb-1">Improve {categoryLabels[area]}</p>
                        <p className="text-sm text-foreground/70">{getCategoryAdvice(area)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                      <Brain size={16} />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Maintain Your Strong Performance</p>
                      <p className="text-sm text-foreground/70">
                        Continue your excellent focus practices and consider teaching others your techniques.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Return to Dashboard
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestion(0);
                  setAnswers({});
                }}
                className="px-6 py-3 bg-transparent border border-gray-700 rounded-lg font-medium hover:bg-gray-800/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Retake Assessment
              </motion.button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}