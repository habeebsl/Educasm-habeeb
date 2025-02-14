import { useState, useEffect} from "react";
import storageService from "../../services/storageService";

export default function StreakComponent() {
  const [streak, setStreak] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getCurrentStreak = () => {
    let lastDate = storageService.getLastDate();
    const currentDate = new Date().toISOString().split('T')[0];

    if (!lastDate) {
        storageService.setLastDate();
        storageService.setUserStreak(1);
        return 1;
    }

    const lastDateObj = new Date(lastDate);
    const currentDateObj = new Date(currentDate);
    const diffInDays = Math.floor((currentDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))

    let currentStreak = storageService.getUserStreak() || 0;

    if (diffInDays === 1) {
        currentStreak += 1;
    } else if (diffInDays > 1) {
        currentStreak = 1;
    }

    storageService.setUserStreak(currentStreak)
    storageService.setLastDate()

    return currentStreak;
};

  useEffect(() => {
    const currentStreak = getCurrentStreak()
    setStreak(currentStreak)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="relative flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full shadow-md cursor-pointer hover:bg-orange-200"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-lg font-bold text-gray-800">{streak}</span>
        <span className="text-2xl">🔥</span>
        {showTooltip && (
          <div className="absolute top-10 right-0 bg-gray-800 text-white text-sm px-2 py-1 rounded-md shadow-md whitespace-nowrap z-50">
            Keep your streak going!
          </div>
        )}
      </div>
    </div>
  );  
}
