import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import { styled } from "styled-components";
import { SkipNextIcon } from "./icons/skip-next-icon";
import { SkipPreviousIcon } from "./icons/skip-previous-icon";
import { PauseIcon } from "./icons/pause-icon";
import { PlayIcon } from "./icons/play-icon";

// Story data model
interface Story {
  title: string;
  audioUrl: string;
}

const stories: Story[] = [
  { title: "The Adventure of the Lost City", audioUrl: "/audio/lost_city.mp3" },
  {
    title: "The Mystery of the Hidden Treasure",
    audioUrl: "/audio/hidden_treasure.mp3",
  },
  {
    title: "The Journey to the Enchanted Forest",
    audioUrl: "/audio/enchanted_forest.mp3",
  },
];

const RotationKnob = ({
  angle,
  onRotate,
  storiesCount,
}: {
  angle: number;
  onRotate: (angle: number) => void;
  storiesCount: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartAngle = useRef(0);
  const dragStartRotation = useRef(0);
  const currentAngle = useRef(angle);
  const step = 360 / storiesCount;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up proper device pixel ratio scaling
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    ctx.scale(devicePixelRatio, devicePixelRatio);
    drawKnob();
  }, [angle]);

  useEffect(() => {
    if (!isDragging) {
      currentAngle.current = angle;
    }
  }, [angle, isDragging]);

  const drawKnob = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get proper dimensions
    const rect = canvas.getBoundingClientRect();
    const centerX = Math.round(rect.width / 2);
    const centerY = Math.round(rect.height / 2);
    const outerRadius = 122; // 244px / 2

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer circle with crisp edges
    ctx.save();

    // Use integer values for coordinates
    const intCenterX = Math.round(centerX);
    const intCenterY = Math.round(centerY);
    const intRadius = Math.round(outerRadius);

    // Outer circle shadow effects
    ctx.save();
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)"; // #FFFFFF with 50% opacity
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 8;

    ctx.shadowColor = "rgba(174, 150, 142, 0.5)"; // #AE968E with 50% opacity
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    ctx.shadowBlur = 35;

    ctx.shadowColor = "rgba(0, 0, 0, 0.25)"; // #000000 with 25% opacity
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 31;
    ctx.shadowBlur = 60;

    // Outer circle gradient

    // Calculate gradient points for 5 o'clock -> 11 o'clock
    const angle5oclock = 60 * (Math.PI / 180); // 5 o'clock in radians
    const angle11oclock = 240 * (Math.PI / 180); // 11 o'clock in radians

    const outerGradient = ctx.createLinearGradient(
      intCenterX + intRadius * Math.cos(angle5oclock),
      intCenterY + intRadius * Math.sin(angle5oclock),
      intCenterX + intRadius * Math.cos(angle11oclock),
      intCenterY + intRadius * Math.sin(angle11oclock)
    );
    outerGradient.addColorStop(0, "#516C67");
    outerGradient.addColorStop(1, "#3B4A47");

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(intCenterX, intCenterY, intRadius - 1, 0, Math.PI * 2);
    ctx.fillStyle = outerGradient;
    ctx.fill();
    ctx.restore();

    // Draw outer circle stroke (gradient) INSIDE
    const strokeRadius = outerRadius - 1 - ctx.lineWidth / 2; // Move inward by half the stroke width

    const strokeGradient = ctx.createLinearGradient(
      centerX + outerRadius * Math.cos(angle5oclock),
      centerY + outerRadius * Math.sin(angle5oclock),
      centerX + outerRadius * Math.cos(angle11oclock),
      centerY + outerRadius * Math.sin(angle11oclock)
    );
    strokeGradient.addColorStop(0, "#666666");
    strokeGradient.addColorStop(1, "#293331");

    ctx.beginPath();
    ctx.arc(centerX, centerY, strokeRadius, 0, Math.PI * 2);
    ctx.strokeStyle = strokeGradient;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw inner circle (224px diameter)
    const innerRadius = 112; // 224px / 2
    const innerGradient = ctx.createLinearGradient(
      centerX + innerRadius * Math.cos(angle5oclock),
      centerY + innerRadius * Math.sin(angle5oclock),
      centerX + innerRadius * Math.cos(angle11oclock),
      centerY + innerRadius * Math.sin(angle11oclock)
    );
    innerGradient.addColorStop(0, "#546D69");
    innerGradient.addColorStop(1, "#3A403F");

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = innerGradient;
    ctx.fill();

    // Draw inner circle stroke
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.2;
    ctx.stroke();

    // Draw indicator hand
    const indicatorAngle = ((angle - 90) * Math.PI) / 180; // Convert to radians and offset
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(indicatorAngle);

    ctx.fillStyle = "#07C5A5";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.roundRect(-3.125, -innerRadius - 5, 6.25, 29.28, 5);
    ctx.fill();
    ctx.restore();
  };

  // Add mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rawAngle =
      (Math.atan2(mouseY - centerY, mouseX - centerX) * 180) / Math.PI;
    const angleDelta = rawAngle - dragStartAngle.current;

    const unsnappedAngle = dragStartRotation.current + angleDelta;
    onRotate(unsnappedAngle);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    dragStartAngle.current =
      (Math.atan2(mouseY - centerY, mouseX - centerX) * 180) / Math.PI;
    dragStartRotation.current = angle;
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    // Snap to nearest step using current angle prop
    const snappedAngle = Math.round(angle / step) * step;
    onRotate(snappedAngle);
    setIsDragging(false);
  };

  const calculateAngle = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const angle =
      (Math.atan2(mouseY - centerY, mouseX - centerX) * 180) / Math.PI;
    onRotate(angle);
  };

  return (
    <KnobContainer>
      <canvas
        ref={canvasRef}
        width={426}
        height={426}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </KnobContainer>
  );
};

const DarkThemeStoryPlayer = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    const step = 360 / stories.length;
    const newIndex = Math.round(rotationAngle / step) % stories.length;
    setSelectedIndex(newIndex < 0 ? stories.length + newIndex : newIndex);
  }, [rotationAngle]);

  const playAudio = () => {
    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: [stories[selectedIndex].audioUrl],
        onend: () => setIsPlaying(false),
      });
    }
    soundRef.current.play();
    setIsPlaying(true);
  };

  const pauseAudio = () => {
    soundRef.current?.pause();
    setIsPlaying(false);
  };

  return (
    <AppContainer className="h-full md:max-h-[500px] font-dosis py-3 px-10 rounded-2xl bg=[#161D1C] text-white">
      <Title className="text-xl font-medium">
        {stories[selectedIndex].title}
      </Title>

      <div className="mt-12 mb-12">
        <RotationKnob
          angle={rotationAngle}
          onRotate={setRotationAngle}
          storiesCount={stories.length}
        />
      </div>

      <Controls>
        <ControlButton
          onClick={() =>
            setSelectedIndex(
              (prev) => (prev - 1 + stories.length) % stories.length
            )
          }
          aria-label="Previous story"
        >
          <SkipPreviousIcon />
        </ControlButton>

        <ControlButton onClick={isPlaying ? pauseAudio : playAudio}>
          {isPlaying ? <PlayIcon /> : <PauseIcon />}
        </ControlButton>

        <ControlButton
          onClick={() =>
            setSelectedIndex((prev) => (prev + 1) % stories.length)
          }
          aria-label="Next story"
        >
          <SkipNextIcon />
        </ControlButton>
      </Controls>
    </AppContainer>
  );
};

// Styled components
const AppContainer = styled.div`
  background: #161d1c;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  font-family: "Dosis", sans-serif;
  //margin-bottom: calc(116px - (426px - 244px) / 2); // 116px - container padding
  text-align: center;
  max-width: 600px;
`;

const KnobContainer = styled.div`
  position: relative;
  width: 244px;
  height: 244px;
  canvas {
    width: 100%;
    height: 100%;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 2rem;
  // margin-top: calc(
  //   103px - (426px - 244px) / 2
  // ); // Compensate for circle position
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: #07c5a5;
  cursor: pointer;
  padding: 1rem;

  i {
    font-size: 2.5rem;
  }

  &:hover {
    opacity: 0.8;
  }
  svg {
    width: 40px; // Control size through CSS
    height: 40px;
    vertical-align: middle;

    /* Optional hover effects */
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.1);
    }
  }
`;

export default DarkThemeStoryPlayer;
