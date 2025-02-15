import { useState, useEffect } from "react";

const MAX_HEARTS = 10;

export const NoHeartsPopup = ({
  updateHearts,
}: {
  updateHearts: (hearts: number | ((prevHearts: number) => number)) => void;
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const refillInterval = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

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
        // Calculate how many refill intervals have passed
        const intervalsPassed = Math.floor((now - targetTime) / refillInterval) + 1;
        updateHearts((prevHearts: number) => {
          const newHeartCount = Math.min(prevHearts + intervalsPassed, MAX_HEARTS);
          if (newHeartCount < MAX_HEARTS) {
            // Set the next target time based on the number of intervals that passed
            const nextTime = targetTime + intervalsPassed * refillInterval;
            localStorage.setItem("heartReplenishTime", nextTime.toString());
          } else {
            // Remove the timer if hearts are full
            localStorage.removeItem("heartReplenishTime");
          }
          return newHeartCount;
        });
        setIsVisible(false);
        clearInterval(timer);
        return;
      }

      // Update the countdown display
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
