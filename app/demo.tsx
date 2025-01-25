"use client";

import { useState, useEffect } from "react";
import StoryPlayer from "./story-player";

export default function StoryPlayerDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 180; // 3 minutes in seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((time) => {
          if (time >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return time + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleNext = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };
  const handlePrevious = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
      <StoryPlayer
        title="The Enchanted Forest"
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
      <StoryPlayer
        title="The Enchanted Forest"
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
      <StoryPlayer
        title="The Case Of The Mischievous Pixies"
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
}
