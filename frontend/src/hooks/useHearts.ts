import { useState, useEffect } from "react";
import storageService from "../services/storageService";

const HEART_REGENERATION_TIME = 2 * 60 * 60 * 1000;
const MAX_HEARTS = 10;

export function useHearts() {
    const [hearts, setHearts] = useState(storageService.getHearts());
    const [lastHeartTime, setLastHeartTime] = useState<number | null>(null);

    useEffect(() => {
        const storedHearts = storageService.getHearts();
        const storedLastHeartTime = storageService.getStoredLastHeartTime();
        const heartReplenishTime = localStorage.getItem("heartReplenishTime");

        if (heartReplenishTime && storedHearts === 0) {
            setHearts(0);
            return;
        }

        if (storedLastHeartTime) {
            const currentTime = Date.now();
            const timePassed = currentTime - storedLastHeartTime;
            const missedHearts = Math.floor(timePassed / HEART_REGENERATION_TIME);
            
            if (missedHearts > 0) {
                const newHearts = Math.min(storedHearts + missedHearts, MAX_HEARTS);
                setHearts(newHearts);
                storageService.setHearts(newHearts);
                
                const newLastHeartTime = currentTime - (timePassed % HEART_REGENERATION_TIME);
                setLastHeartTime(newLastHeartTime);
                storageService.setStoredLastHeartTime(new Date(newLastHeartTime));
            }
        }
    }, []);

    const updateHearts = (value: number) => {
        setHearts(value);
        storageService.setHearts(value);
        
        if (hearts === 0 && value > 0) {
            localStorage.removeItem("heartReplenishTime");
        }
        
        if (value < hearts) {
            const currentTime = Date.now();
            setLastHeartTime(currentTime);
            storageService.setStoredLastHeartTime(new Date(currentTime));
        }
    };

    const decrementHearts = () => {
        setHearts(prev => {
            const newValue = prev <= 0 ? 0 : prev - 1;
            storageService.setHearts(newValue);
            
            if (newValue === 0) {
                const replenishTime = Date.now() + HEART_REGENERATION_TIME;
                localStorage.setItem("heartReplenishTime", replenishTime.toString());
            }
            
            return newValue;
        });
    };

    return { hearts, lastHeartTime, updateHearts, decrementHearts };
}

export function useStoredConsecutive() {
    const [storedConsecutive, setStoredConsecutive] = useState(storageService.getStoredConsecutive())
    const incrementStoredConsecutive = () => setStoredConsecutive(prev => prev+1)
    const resetStoredConsecutive = () => {
        storageService.setStoredConsecutive(0)
        setStoredConsecutive(0)
    }
    return {storedConsecutive, incrementStoredConsecutive, resetStoredConsecutive}
}