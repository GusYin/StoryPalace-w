"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface StoryPlayerProps {
  title: string;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentTime: number;
  isPlaying: boolean;
}

export default function StoryPlayer({
  title,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  currentTime,
  isPlaying,
}: StoryPlayerProps) {
  // Calculate the rotation angle based on current time and duration
  const rotation = (currentTime / duration) * 360;

  return (
    <Card className="w-[300px] bg-[#FDF8F7]">
      <CardHeader>
        <CardTitle className="text-center text-[#1B4B40] text-xl font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8">
        {/* Progress Dial */}
        <div className="relative w-48 h-48">
          {/* Outer circle */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(125deg, #EEE7E4 0%, #F9F6F5 100%)",
              boxShadow: "0px 4px 24px -1px rgba(0, 0, 0, 0.08)",
            }}
          />
          {/* Inner circle */}
          <div
            className="absolute inset-2 rounded-full"
            style={{
              background: "linear-gradient(125deg, #FCFBFA 0%, #E7DFDD 100%)",
            }}
          />
          <div
            className="absolute top-0 left-1/2 w-1 h-4 bg-[#1B4B40] origin-bottom"
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transformOrigin: "bottom center",
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#1B4B40] hover:text-[#1B4B40]/80 hover:bg-transparent"
            onClick={onPrevious}
          >
            <SkipBack className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#1B4B40] hover:text-[#1B4B40]/80 hover:bg-transparent"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? (
              <Pause className="h-12 w-12" />
            ) : (
              <Play className="h-12 w-12" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#1B4B40] hover:text-[#1B4B40]/80 hover:bg-transparent"
            onClick={onNext}
          >
            <SkipForward className="h-8 w-8" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
