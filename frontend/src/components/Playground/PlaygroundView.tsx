import React, { useState, useEffect, useRef } from "react";
import { SearchBar } from "../shared/SearchBar";
import { Loading } from "../shared/Loading";
import { api } from "../../services/api";
import StreakComponent from "./Streak";
import HeartsComponent from "./Hearts";
import { transformQuestion } from "../../utils/helpers";
import { Trophy, Timer, Target, Award, Pause, Play, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { Question, UserContext } from "../../types";
import { useHearts, useStoredConsecutive } from "../../hooks/useHearts";
import { NoHeartsPopup } from "./NoHeartsPopup";


interface PlaygroundViewProps {
  initialQuery?: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  userContext: UserContext;
}

interface Stats {
  questions: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  avgTime: number;
}

interface DifficultyMetrics {
  currentDifficulty: number;
  performanceScore: number;
  lastQuestionTime: number;
  lastQuestionCorrect: boolean;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  initialQuery,
  onError,
  onSuccess
}) => {
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery || "");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestionTime, setCurrentQuestionTime] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState<
    number | null
  >(null);

  const [sessionStats, setSessionStats] = useState({
    totalQuestions: 0,
    sessionLimit: 25,
    isSessionComplete: false,
  });

  const [stats, setStats] = useState<Stats>({
    questions: 0,
    accuracy: 0,
    streak: 0,
    bestStreak: 0,
    avgTime: 0,
  });

  const [difficultyMetrics, setDifficultyMetrics] = useState<DifficultyMetrics>({
    currentDifficulty: 3,
    performanceScore: 0,
    lastQuestionTime: 0,
    lastQuestionCorrect: false
  });
  
  const TIME_THRESHOLDS = {
    FAST: 10,
    MODERATE: 20,
    SLOW: 30
  };

  const DIFFICULTY_BOUNDS = {
    MIN: 1,
    MAX: 5
  };

  const calculateNextDifficulty = (time: number, isCorrect: boolean): number => {
    const { currentDifficulty } = difficultyMetrics;

    let adjustment = 0;
    
    if (time <= TIME_THRESHOLDS.FAST) {
      adjustment += 0.5;
    } else if (time >= TIME_THRESHOLDS.SLOW) {
      adjustment -= 0.5;
    }
    
    if (isCorrect) {
      adjustment += 0.5;
    } else {
      adjustment -= 1;
    }

    const newDifficulty = Math.max(
      DIFFICULTY_BOUNDS.MIN,
      Math.min(DIFFICULTY_BOUNDS.MAX, currentDifficulty + adjustment)
    );
    
    return newDifficulty;
  };

  const updateDifficultyMetrics = (time: number, isCorrect: boolean) => {
    const newDifficulty = calculateNextDifficulty(time, isCorrect);
    
    setDifficultyMetrics(() => ({
      currentDifficulty: newDifficulty,
      performanceScore: calculatePerformanceScore(time, isCorrect),
      lastQuestionTime: time,
      lastQuestionCorrect: isCorrect
    }));
  };

  const calculatePerformanceScore = (time: number, isCorrect: boolean): number => {
    const timeScore = Math.max(0, 1 - (time / TIME_THRESHOLDS.SLOW));
    const correctnessScore = isCorrect ? 1 : 0;
    return (timeScore + correctnessScore) / 2;
  };

  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [preloadedQuestion, setPreloadedQuestion] = useState<Question | null>(null);
  const [shouldShowNext, setShouldShowNext] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const { storedConsecutive, incrementStoredConsecutive, resetStoredConsecutive } = useStoredConsecutive()
  const { hearts, decrementHearts, updateHearts } = useHearts()
  const isPausedRef = useRef(isPaused);
  const COUNTDOWN_DURATION = 5;
  const countdownTimeRef = useRef<number>(COUNTDOWN_DURATION);

  const startQuestionTimer = (): void => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentQuestionTime(prev => prev + 1);
      }
    }, 1000)
    setTimerInterval(interval);
  };

  const stopQuestionTimer = (): void => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const prefetchNextQuestion = async () => {
    try {
      const response = await api.getPlaygroundQuestion(query, 1)
      const data = response.data.content
      const question = transformQuestion(data)      
      setNextQuestion(question)
    } catch (error) {
      console.error("Error prefetching next question:", error);
    }
  }

  const fetchNewQuestion = async () => {
    if (!query) return;

    if (sessionStats.totalQuestions >= sessionStats.sessionLimit) {
      setSessionStats((prev) => ({ ...prev, isSessionComplete: true }));
      stopQuestionTimer();
      onSuccess("Congratulations! You've completed your practice session! 🎉");
      return;
    }

    try {
      console.log('Fetching next question with difficulty:', difficultyMetrics.currentDifficulty);
      const response = await api.getPlaygroundQuestion(
        query, 
        difficultyMetrics.currentDifficulty
      );
      const data = response.data.content;
      const question = transformQuestion(JSON.parse(data));
      setPreloadedQuestion(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      onError("Failed to generate question. Please try again.");
    }
  };

  const handleSearch = async (newQuery: string) => {
    try {
      setIsInitialLoading(true);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuery(newQuery);

      const response = await api.getPlaygroundQuestion(newQuery, 1)
      const data = response.data.content
      console.log(data)
      const firstQuestion = transformQuestion(JSON.parse(data))
      console.log(firstQuestion)
      setCurrentQuestion(firstQuestion);
      setSelectedAnswer(null);
      setCurrentQuestionTime(0)
      startQuestionTimer()

      const isSameTopic = newQuery === query;
      if (!isSameTopic) {
        setStats({
          questions: 0,
          accuracy: 0,
          streak: 0,
          bestStreak: 0,
          avgTime: 0,
        });
        setSessionStats({
          totalQuestions: 0,
          sessionLimit: 25,
          isSessionComplete: false,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      onError("Failed to start practice session");
    } finally {
      setIsInitialLoading(false);
      setIsPaused(false)
    }
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (newPausedState) {
      stopQuestionTimer()
      stopCountdown();
    } else {
      const interval = setInterval(() => {
        setCurrentQuestionTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      startCountdown()
    }
  };

  const updateStats = (isCorrect: boolean): void => {
    setStats((prev) => {
      const newQuestions = prev.questions + 1;
      const newAccuracy = (prev.accuracy * prev.questions + (isCorrect ? 100 : 0)) / newQuestions;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      
      return {
        questions: newQuestions,
        accuracy: newAccuracy,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        avgTime: (prev.avgTime * prev.questions + currentQuestionTime) / newQuestions,
      };
    });
  };

  const startCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    setNextQuestionCountdown(countdownTimeRef.current);

    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        countdownTimeRef.current = Math.max(0, countdownTimeRef.current - 0.1);
        setNextQuestionCountdown(parseFloat(countdownTimeRef.current.toFixed(1)));

        if (countdownTimeRef.current <= 0) {
          clearInterval(interval);
          setCountdownInterval(null);
          setShouldShowNext(true)
        }
      }
    }, 100);

    setCountdownInterval(interval);
  };

  const stopCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
  
    setSelectedAnswer(index);
    setShowExplanation(true);
    stopQuestionTimer();
    
    const isCorrect = index === currentQuestion.correctAnswer;
    updateDifficultyMetrics(currentQuestionTime, isCorrect);
    updateStats(isCorrect);
    
    if (isCorrect) {
      incrementStoredConsecutive() 
    } else {
      resetStoredConsecutive()
      decrementHearts()
    }

    if (isPaused) {
      setIsPaused(false);
    }
    
    fetchNewQuestion();
    startCountdown();
  };

  useEffect(() => {
    return () => {
      stopQuestionTimer();
      stopCountdown();
    };
  }, []);
  
  useEffect(() => {
    setIsPaused(false);
    stopCountdown();
    countdownTimeRef.current = COUNTDOWN_DURATION
  }, [currentQuestion]);

  useEffect(() => {
    if (query) {
      fetchNewQuestion();
    }
  }, [query]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (nextQuestion) {
      prefetchNextQuestion();
    }
  }, [nextQuestion]);

  useEffect(() => {
    if (shouldShowNext && preloadedQuestion) {
      console.log('Transitioning to next question:', preloadedQuestion);
      setCurrentQuestion(preloadedQuestion);
      setPreloadedQuestion(null);
      setShouldShowNext(false);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentQuestionTime(0);
      startQuestionTimer();
      setSessionStats(prev => ({
        ...prev,
        totalQuestions: prev.totalQuestions + 1
      }));
    }
  }, [shouldShowNext, preloadedQuestion]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);

  useEffect(() => {
    setIsPaused(false)
  }, [currentQuestion])

  const formatAccuracy = (accuracy: number): number => {
    return Math.round(accuracy);
  };

  if (isInitialLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (hearts <= 0) {
    return (
    <div className="flex flex-col items-center justify-center bg-gray-900 mt-20">
      <svg
        fill="red"
        width="200"
        height="200"
        version="1.1"
        id="Capa_1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 516.248 516.249"
        xmlSpace="preserve"
      >
        <g>
          <g>
            <path d="M205.585,132.113c4.303-4.944,4.169-12.833-0.765-17.155C183.477,96.225,124.582,54.81,55.091,93.48 c0,0-97.939,50.452-32.646,177.079c48.396,80.736,172.364,88.645,225.474,170.814c3.558,5.509,6.273,4.915,6.579-1.635 l3.213-68.161c0.306-6.551-3.424-15.014-8.348-18.905c-4.925-3.893-5.585-11.198-1.492-16.323l20.78-25.981 c4.093-5.116,2.658-11.638-3.213-14.554l-41.435-20.598c-5.871-2.917-6.569-8.722-1.568-12.948l44.571-37.714 c5.001-4.236,4.131-9.658-1.951-12.106l-84.82-34.167c-6.082-2.448-7.525-8.443-3.213-13.388L205.585,132.113z"></path> 
            <path d="M304.434,115.254c-3.548,5.508-10.089,13.407-15.482,17.146l-36.136,25.054c-5.384,3.739-5.355,9.754,0.066,13.436 l77.562,52.689c5.422,3.681,5.192,9.285-0.526,12.498l-49.064,27.664c-5.709,3.223-6.054,8.97-0.766,12.843l33.526,24.557 c5.288,3.872,5.498,10.423,0.459,14.621l-28.879,24.116c-5.029,4.198-5.805,11.762-1.721,16.897l1.166,1.463 c4.083,5.125,5.747,14.344,3.787,20.598c-4.743,15.108-12.947,42.151-17.04,61.085c-1.387,6.407,0.42,7.01,3.815,1.396 c59.345-98.111,129.38-64.452,211.234-162.095c20.406-21.889,55.406-105.608,0-166.942 C434.11,54.36,340.331,59.515,304.434,115.254z"></path> 
          </g>
        </g>
      </svg>

      <p className="mt-4 text-white text-lg text-center">
        Come back later when your hearts are refilled ❤️
      </p>

      <NoHeartsPopup updateHearts={updateHearts} />
    </div>

    )
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col">
    <div className="fixed top-4 right-4 flex-row-reverse flex gap-4 z-50">
      <StreakComponent />
      <HeartsComponent hearts={hearts} updateHearts={updateHearts} storedConsecutive={storedConsecutive} />
    </div>
      {!currentQuestion || sessionStats.isSessionComplete ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            What do you want to practice?
          </h1>
          
          <div className="w-full max-w-xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Enter what you want to practice..."
              centered={true}
              className="bg-gray-900/80"
            />
            
            <p className="text-sm text-gray-400 text-center mt-1">
              Press Enter to search
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="text-sm text-gray-400">Try:</span>
              <button
                onClick={() => handleSearch("Quantum Physics")}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 
                  border border-purple-500/30 transition-colors text-xs sm:text-sm text-purple-300"
              >
                ⚛️ Quantum Physics
              </button>
              <button
                onClick={() => handleSearch("Machine Learning")}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 
                  border border-blue-500/30 transition-colors text-xs sm:text-sm text-blue-300"
              >
                🤖 Machine Learning
              </button>
              <button
                onClick={() => handleSearch("World History")}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 
                  border border-green-500/30 transition-colors text-xs sm:text-sm text-green-300"
              >
                🌍 World History
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-2">
            <div className="card">
              <div className="flex items-center gap-2 text-primary">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">Score</span>
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatAccuracy(stats.accuracy)}%
              </div>
            </div>
            
            {/* <div className="card">
              <div className="flex items-center justify-between">
                <span className="stats-value text-blue-500">
                  {Math.round(difficultyMetrics.currentDifficulty * 10) / 10}
                </span>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <span className="stats-label">Difficulty</span>
            </div> */}

            <div className="card">
              <div className="flex items-center justify-between">
                <span className="stats-value text-xs sm:text-base text-primary">
                  {stats.questions}
                </span>
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="stats-label text-xs sm:text-sm">Questions</span>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <span className="stats-value text-yellow-500">
                  {stats.streak}
                </span>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="stats-label">Streak</span>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <span className="stats-value text-purple-500">
                  {currentQuestionTime}s
                </span>
                <Timer className="w-5 h-5 text-purple-500" />
              </div>
              <span className="stats-label">Time</span>
            </div>
          </div>

          <div className="card flex-1 flex flex-col mt-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xs sm:text-base font-medium leading-relaxed 
                text-gray-200 max-w-3xl whitespace-pre-line tracking-wide">
                {currentQuestion?.text}
              </h2>
              <button
                onClick={togglePause}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                {isPaused ? (
                  <Play className="w-5 h-5 text-primary" />
                ) : (
                  <Pause className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>

            <div className="space-y-2">
              {currentQuestion?.options?.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                    text-xs sm:text-sm leading-relaxed ${
                      selectedAnswer === null
                        ? "bg-card hover:bg-gray-800"
                        : idx === currentQuestion.correctAnswer
                        ? "bg-green-500/20 text-green-500"
                        : selectedAnswer === idx
                        ? "bg-red-500/20 text-red-500"
                        : "bg-card"
                    }`}
                >
                  <span className="inline-block w-5 sm:w-6 font-medium">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
            {showExplanation && (
              <div className="mt-3 space-y-2 text-sm">
                {!isPaused && nextQuestionCountdown !== null && (
                  <div className="mb-2">
                    <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary transition-all duration-100"
                        style={{
                          width: `${(nextQuestionCountdown / COUNTDOWN_DURATION) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-400 text-center">
                      Next question in {nextQuestionCountdown.toFixed(0)}s
                    </div>
                  </div>
                )}

                <div className={`px-3 py-2 rounded-lg ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded-full ${
                      selectedAnswer === currentQuestion.correctAnswer
                        ? "bg-green-500/20"
                        : "bg-red-500/20"
                    }`}>
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedAnswer === currentQuestion.correctAnswer
                          ? "Correct!"
                          : `Incorrect. The right answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}`}
                      </p>
                      <p className="text-xs mt-1 opacity-90">
                        {currentQuestion.explanation.correct}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-blue-400">
                      {currentQuestion.explanation.key_point}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
