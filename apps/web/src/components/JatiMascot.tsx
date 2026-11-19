import React, { useState, useEffect } from 'react';

export type JatiPose = 'idle' | 'hover' | 'thinking' | 'success' | 'gali';

interface JatiMascotProps {
  pose?: JatiPose;
  size?: number;
  interactive?: boolean;
  onPoseChange?: (pose: JatiPose) => void;
  onClick?: () => void;
  className?: string;
  showSpeech?: boolean;
  speechText?: string;
  autoFloat?: boolean;
}

const POSE_IMAGES: Record<JatiPose, string> = {
  idle: '/mascot/idle.png',
  hover: '/mascot/hover.png',
  thinking: '/mascot/thinking.png',
  success: '/mascot/success.png',
  gali: '/mascot/gali.png',
};

export function JatiMascot({
  pose = 'idle',
  size = 200,
  interactive = true,
  onPoseChange,
  onClick,
  className = '',
  showSpeech = false,
  speechText = 'Halo Bos! Saya Jati, siap bantu analisis.',
  autoFloat = true,
}: JatiMascotProps) {
  const [currentPose, setCurrentPose] = useState<JatiPose>(pose);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setCurrentPose(pose);
  }, [pose]);

  const effectivePose = isHovered && currentPose === 'idle' ? 'hover' : currentPose;

  const handleClick = () => {
    // Trigger bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 650);

    if (onClick) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    if (!interactive) return;
    setIsHovered(true);
    if (onPoseChange && currentPose === 'idle') {
      onPoseChange('hover');
    }
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setIsHovered(false);
    if (onPoseChange && currentPose === 'idle') {
      onPoseChange('idle');
    }
  };

  return (
    <div
      className={`jati-mascot-wrapper ${className} ${interactive ? 'is-interactive' : ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`Maskot Jati (${effectivePose})`}
    >
      {/* Speech Bubble */}
      {showSpeech && (
        <div className="jati-speech-bubble">
          <span>{speechText}</span>
          <div className="jati-speech-arrow" />
        </div>
      )}

      {/* Mascot Body Container with Float and Bounce */}
      <div
        className={`jati-body-container ${autoFloat ? 'is-floating' : ''} ${isBouncing ? 'is-bouncing' : ''}`}
      >
        {/* Layered Images for Smooth Cross-fade Transition using standard <img> tags */}
        {(Object.keys(POSE_IMAGES) as JatiPose[]).map((p) => (
          <img
            key={p}
            src={POSE_IMAGES[p]}
            alt={`Jati ${p}`}
            className={`jati-pose-img ${effectivePose === p ? 'active' : ''}`}
            loading="eager"
            draggable={false}
          />
        ))}
      </div>

      {/* Synchronized Ground Shadow */}
      <div className={`jati-shadow ${autoFloat ? 'is-floating' : ''}`} />
    </div>
  );
}
