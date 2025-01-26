import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import { styled } from "styled-components";

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
}: {
  angle: number;
  onRotate: (angle: number) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    drawKnob();
  }, [angle]);

  const drawKnob = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 122; // 244px / 2

    // Outer circle shadow effects
    ctx.save();
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)"; // #FFFFFF with 50% opacity
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 8;

    ctx.shadowColor = "rgba(174, 150, 142, 0.5)"; // #AE968E with 50% opacity
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    ctx.shadowBlur = 8;

    ctx.shadowColor = "rgba(0, 0, 0, 0.25)"; // #000000 with 25% opacity
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 31;
    ctx.shadowBlur = 60;

    // Outer circle gradient

    // Calculate gradient points for 5 o'clock -> 11 o'clock
    const angle5oclock = 60 * (Math.PI / 180); // 5 o'clock in radians
    const angle11oclock = 240 * (Math.PI / 180); // 11 o'clock in radians

    const outerGradient = ctx.createLinearGradient(
      centerX + outerRadius * Math.cos(angle5oclock),
      centerY + outerRadius * Math.sin(angle5oclock),
      centerX + outerRadius * Math.cos(angle11oclock),
      centerY + outerRadius * Math.sin(angle11oclock)
    );
    outerGradient.addColorStop(0, "#EEE7E4");
    outerGradient.addColorStop(1, "#F9F6F5");

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - 1, 0, Math.PI * 2);
    ctx.fillStyle = outerGradient;
    ctx.fill();
    ctx.restore();

    // Draw outer circle stroke (gradient)
    // Draw outer circle stroke (gradient) INSIDE
    const strokeRadius = outerRadius - 1 - ctx.lineWidth / 2; // Move inward by half the stroke width

    const strokeGradient = ctx.createLinearGradient(
      centerX + outerRadius * Math.cos(angle5oclock),
      centerY + outerRadius * Math.sin(angle5oclock),
      centerX + outerRadius * Math.cos(angle11oclock),
      centerY + outerRadius * Math.sin(angle11oclock)
    );
    strokeGradient.addColorStop(0, "#FFFFFF");
    strokeGradient.addColorStop(1, "#CDC3C0");

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
    innerGradient.addColorStop(0, "#FCFBFA");
    innerGradient.addColorStop(1, "#E7DFDD");

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

    ctx.fillStyle = "#004D3D";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.roundRect(-3.125, -innerRadius - 5, 6.25, 29.28, 5);
    ctx.fill();
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateAngle(e);
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
        onMouseMove={isDragging ? calculateAngle : undefined}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      />
    </KnobContainer>
  );
};

const AudioPlayer = () => {
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
    <AppContainer>
      <Title>{stories[selectedIndex].title}</Title>

      <RotationKnob angle={rotationAngle} onRotate={setRotationAngle} />

      <Controls>
        <ControlButton
          onClick={() =>
            setSelectedIndex(
              (prev) => (prev - 1 + stories.length) % stories.length
            )
          }
        >
          <i className="material-icons">skip_previous</i>
        </ControlButton>

        <ControlButton onClick={isPlaying ? pauseAudio : playAudio}>
          <i className="material-icons">{isPlaying ? "pause" : "play_arrow"}</i>
        </ControlButton>

        <ControlButton
          onClick={() =>
            setSelectedIndex((prev) => (prev + 1) % stories.length)
          }
        >
          <i className="material-icons">skip_next</i>
        </ControlButton>
      </Controls>
    </AppContainer>
  );
};

// Styled components
const AppContainer = styled.div`
  background: #faf1ee;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #004d3d;
  font-family: "Dosis", sans-serif;
  font-size: 2rem;
  margin-bottom: 103px;
  text-align: center;
  max-width: 600px;
`;

const KnobContainer = styled.div`
  position: relative;
  width: 426px;
  height: 426px;
  margin: 2rem 0 0 0; // Removed bottom margin

  canvas {
    width: 100%;
    height: 100%;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: calc(
    103px - (426px - 244px) / 2
  ); // Compensate for circle position
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: #004d3d;
  cursor: pointer;
  padding: 1rem;

  i {
    font-size: 2.5rem;
  }

  &:hover {
    opacity: 0.8;
  }
`;

export default AudioPlayer;
