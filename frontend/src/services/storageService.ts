import { UserContext } from "../types";

  interface TestResult {
    topic: string;
    examType: 'JEE' | 'NEET';
    score: number;
    predictedRank: number;
    date: string;
  }
  
  interface UserProgress {
    level: number;
    streak: number;
    bestStreak: number;
    totalQuestions: number;
    correctAnswers: number;
    testResults: TestResult[];
    lastActive: string;
  }
  
  class StorageService {
    private readonly USER_INFO_KEY = 'edu_ai_user_info';
    private readonly PROGRESS_KEY = 'edu_ai_progress';
    private readonly HISTORY_KEY = 'edu_ai_history';
    private readonly SESSION_ID_KEY = 'edu_ai_session_id';
    private readonly STREAK_KEY = 'edu_ai_streak';
    private readonly STREAK_LAST_DATE_KEY = 'edu_ai_last_date';
    private readonly HEARTS_KEY = 'edu_ai_hearts'
    private readonly LAST_HEARTS_KEY = 'edu_ai_stored_last_hearts'
    private readonly STORED_CONSECUTIVE_CORRECT_KEY = 'edu_ai_stored_consecutive_correct'

    constructor() {
      // Initialize if needed
    }
  
    saveUserInfo(info: UserContext): void {
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(info))
      localStorage.setItem(this.SESSION_ID_KEY, crypto.randomUUID())
    }
  
    getUserInfo(): UserContext | null {
      const data = localStorage.getItem(this.USER_INFO_KEY);
      return data ? JSON.parse(data) : null;
    }

    getHearts() {
      const hearts = localStorage.getItem(this.HEARTS_KEY);
      if (hearts !== null) {
        return parseInt(hearts);
      }
      this.setHearts(10);
      return 10;
    }

    setHearts(value: number) {
      localStorage.setItem(this.HEARTS_KEY, String(value))
    }

    setStoredLastHeartTime(time: Date) {
      localStorage.setItem(this.LAST_HEARTS_KEY, time.toString())
    }

    getStoredLastHeartTime() {
      const time = localStorage.getItem(this.LAST_HEARTS_KEY);
      return time ? new Date(time).getTime() : null;
    }

    getStoredConsecutive() {
      return parseInt(localStorage.getItem(this.STORED_CONSECUTIVE_CORRECT_KEY) || '0')
    }

    setStoredConsecutive(value: number) {
      localStorage.setItem(this.STORED_CONSECUTIVE_CORRECT_KEY, String(value))
    }

    getLastDate() {
      return localStorage.getItem(this.STREAK_LAST_DATE_KEY)
    }

    setLastDate() {
      const currentDate = new Date().toISOString().split('T')[0]
      localStorage.setItem(this.STREAK_LAST_DATE_KEY, currentDate)
    }

    getUserStreak() {
     return parseInt(localStorage.getItem(this.STREAK_KEY) || '0', 10) 
    }

    setUserStreak(streak: number) {
      localStorage.setItem(this.STREAK_KEY, String(streak))
    }

    getSessionId(): string | null {
      const data = localStorage.getItem(this.SESSION_ID_KEY)
      return data ? data : null;
    } 
  
    hasUser(): boolean {
      return !!this.getUserInfo();
    }
  
    // Progress Methods
    saveProgress(progress: UserProgress): void {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progress));
    }
  
    getProgress(): UserProgress {
      const data = localStorage.getItem(this.PROGRESS_KEY);
      return data ? JSON.parse(data) : {
        level: 1,
        streak: 0,
        bestStreak: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        testResults: [],
        lastActive: new Date().toISOString()
      };
    }
  
    updateProgress(updates: Partial<UserProgress>): void {
      const current = this.getProgress();
      this.saveProgress({ ...current, ...updates });
    }
  
    // Test Result Methods
    addTestResult(result: TestResult): void {
      const progress = this.getProgress();
      progress.testResults.push(result);
      this.saveProgress(progress);
    }
  
    getTestResults(): TestResult[] {
      return this.getProgress().testResults;
    }
  
    // Utility Methods
    clearAll(): void {
      localStorage.removeItem(this.USER_INFO_KEY);
      localStorage.removeItem(this.PROGRESS_KEY);
      localStorage.removeItem(this.HISTORY_KEY);
    }
  }
  
  // Create and export a single instance
  export const storageService = new StorageService();
  export default storageService;
