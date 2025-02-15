import { useState, useEffect } from "react";
import storageService from "../../services/storageService";

interface Hearts {
  hearts: number;
  updateHearts: (hearts: number) => void;
  storedConsecutive: number;
}

const MAX_HEARTS = 10;
const CONSECUTIVE_PROBLEMS_FOR_HEART = 5;

export default function HeartsComponent({ hearts, updateHearts, storedConsecutive }: Hearts) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getHeartsText = () => {
    let unique = null;
    if (hearts === 10) {
      unique = 'You have full hearts';
    } else {
      unique = `You have ${hearts} hearts`;
    }

    return `
    ${unique} ❤️.

    Hearts Refill every 2 hours.
    Answer 5 questions without failing to gain a heart.
    `;
  };

  useEffect(() => {
    if (storedConsecutive >= CONSECUTIVE_PROBLEMS_FOR_HEART) {
      if (hearts < MAX_HEARTS) {
        const newHearts = hearts + 1;
        updateHearts(newHearts);
      }
      storageService.setStoredConsecutive(0);
    }
  }, [storedConsecutive, hearts, updateHearts]);

  return (
    <div 
      className="relative flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full shadow-md cursor-pointer hover:bg-orange-200"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-lg font-bold text-gray-800">{hearts}</span>
      <span className="text-2xl">❤️</span>
      {showTooltip && (
        <div className="absolute top-10 right-3 bg-gray-800 text-white text-sm px-2 py-1 pb-7 rounded-md shadow-md whitespace-pre-wrap w-96 z-50">
          {getHeartsText()}
        </div>
      )}
    </div>
  );
}