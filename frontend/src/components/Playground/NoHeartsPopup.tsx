import { useState, useEffect } from "react";


export const NoHeartsPopup = ({ updateHearts }: { updateHearts: (hearts: number) => void }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateTimer = () => {
      const heartReplenishTime = localStorage.getItem("heartReplenishTime");
      
      if (!heartReplenishTime) {
        setIsVisible(false);
        return;
      }

      const now = Date.now();
      const targetTime = parseInt(heartReplenishTime);
      const difference = targetTime - now;

      if (difference <= 0) {
        updateHearts(1);
        localStorage.removeItem("heartReplenishTime");
        setIsVisible(false);
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(timer);
  }, [updateHearts]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Out of Hearts!</h2>
        <p className="text-gray-600 mb-6">Please wait for your hearts to replenish</p>
        <div className="text-xl font-semibold text-red-500 mb-4">{timeLeft}</div>
        <button
          className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          onClick={() => setIsVisible(false)}
        >
          Back
        </button>
      </div>
    </div>
  );
};