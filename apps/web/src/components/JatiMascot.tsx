import React, { useState, useEffect, useRef } from 'react';

export type JatiPose = 'idle' | 'hover' | 'thinking' | 'success' | 'gali' | 'rancang';

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
  rancang: '/mascot/rancang.png',
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
  const [isBlinking, setIsBlinking] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPose(pose);
  }, [pose]);

  // Periodic natural blinking every 4.5s
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, []);

  // 3D Look-At Mouse Tracking (Gaze tracking across dashboard)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Realistic 3D angle range (-15deg to +15deg)
      const maxAngle = 15;
      const rotY = Math.max(-maxAngle, Math.min(maxAngle, (dx / (window.innerWidth / 2)) * maxAngle));
      const rotX = Math.max(-maxAngle, Math.min(maxAngle, (-dy / (window.innerHeight / 2)) * maxAngle));

      setTilt({ x: rotX, y: rotY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const effectivePose = isHovered && currentPose === 'idle' ? 'hover' : currentPose;

  const handleClick = () => {
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
    setTilt({ x: 0, y: 0 });
    if (onPoseChange && currentPose === 'idle') {
      onPoseChange('idle');
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`jati-mascot-wrapper ${className} ${interactive ? 'is-interactive' : ''}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '800px',
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`Maskot Jati 3D (${effectivePose})`}
    >
      {/* Speech Bubble */}
      {showSpeech && (
        <div className="jati-speech-bubble">
          <span>{speechText}</span>
          <div className="jati-speech-arrow" />
        </div>
      )}

      {/* 3D Orbiting Ambient Particles */}
      {autoFloat && (
        <div className="jati-ambient-particles">
          <span className="particle p1" style={{ transform: `translate3d(${tilt.y * 0.4}px, ${-tilt.x * 0.4}px, 20px)` }}>✨</span>
          <span className="particle p2" style={{ transform: `translate3d(${-tilt.y * 0.3}px, ${tilt.x * 0.3}px, 15px)` }}>🌱</span>
        </div>
      )}

      {/* 3D Responsive Mascot Body with Interactive Tilt & Natural Breathing */}
      <div
        className={`jati-body-container ${autoFloat ? 'is-floating' : ''} ${isBouncing ? 'is-bouncing' : ''} ${isBlinking ? 'is-blinking' : ''}`}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.4, 1)',
        }}
      >
        {/* Layered High-Def Transparent Poses */}
        {(Object.keys(POSE_IMAGES) as JatiPose[]).map((p) => (
          <img
            key={p}
            src={POSE_IMAGES[p]}
            alt={`Jati 3D ${p}`}
            className={`jati-pose-img ${effectivePose === p ? 'active' : ''}`}
            loading="eager"
            draggable={false}
          />
        ))}

        {/* 3D Specular Sheen / Highlight Glow */}
        <div className="jati-specular-light" />
      </div>

      {/* Synchronized 3D Floor Shadow */}
      <div
        className={`jati-shadow ${autoFloat ? 'is-floating' : ''}`}
        style={{
          transform: `translateX(${tilt.y * 0.8}px) scale(${1 - Math.abs(tilt.x) * 0.015})`,
          transition: 'transform 0.15s ease-out',
        }}
      />
    </div>
  );
}
