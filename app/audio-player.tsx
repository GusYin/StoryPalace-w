import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import styled from "styled-components";

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

    // Drawing implementation similar to SwiftUI version
    // ... (complex canvas drawing code for gradients, shadows, etc)
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
        width={244}
        height={244}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? calculateAngle : undefined}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      />
    </KnobContainer>
  );
};

const AudioPlayerApp = () => {
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
  width: 244px;
  height: 244px;
  margin: 2rem 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 103px;
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

export default AudioPlayerApp;
