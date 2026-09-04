import React, { useEffect, useRef } from 'react';
import { WeatherCategory } from '../types';

interface WeatherBackgroundProps {
  category: WeatherCategory;
  forecastText?: string;
  onSelectCategoryOverride?: (cat: WeatherCategory | null) => void;
  isOverrideActive?: boolean;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  category,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle state for different weather modes
    // 1. Rain drops
    interface RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      width: number;
    }
    const rainDrops: RainDrop[] = [];
    const maxRainDrops = category === 'thunder' ? 220 : 120;
    for (let i = 0; i < maxRainDrops; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 12 + Math.random() * 18,
        speed: 12 + Math.random() * 15,
        opacity: 0.2 + Math.random() * 0.4,
        width: 1 + Math.random() * 1.5,
      });
    }

    // 2. Rain splashes
    interface Splash {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
    }
    const splashes: Splash[] = [];

    // 3. Sun dust motes / sparkles
    interface SunSparkle {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
      pulseRate: number;
      phase: number;
    }
    const sparkles: SunSparkle[] = [];
    for (let i = 0; i < 45; i++) {
      sparkles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.5 + Math.random() * 2.5,
        speedY: -0.2 - Math.random() * 0.4,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: 0.2 + Math.random() * 0.6,
        pulseRate: 0.02 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 4. Clouds
    interface Cloud {
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
    }
    const clouds: Cloud[] = [];
    for (let i = 0; i < 18; i++) {
      clouds.push({
        x: Math.random() * (width + 300) - 150,
        y: 30 + Math.random() * (height * 0.45),
        radius: 70 + Math.random() * 110,
        speed: 0.15 + Math.random() * 0.35,
        opacity: 0.08 + Math.random() * 0.12,
      });
    }

    // 5. Stars for night
    interface Star {
      x: number;
      y: number;
      radius: number;
      baseOpacity: number;
      twinkleSpeed: number;
      phase: number;
    }
    const stars: Star[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.75,
        radius: 0.8 + Math.random() * 1.5,
        baseOpacity: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Lightning control for thunder
    let lightningTimer = 0;
    let lightningAlpha = 0;

    let time = 0;

    const render = () => {
      time += 0.016;

      // Clear canvas with base background gradient based on category
      ctx.clearRect(0, 0, width, height);

      if (category === 'sunny') {
        // Deep warm radiant sky gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.4, '#1e293b');
        bgGrad.addColorStop(0.8, '#1e1b4b');
        bgGrad.addColorStop(1, '#291e38');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Sun glow in upper right corner
        const sunX = width * 0.85;
        const sunY = 90;
        const sunPulse = Math.sin(time * 1.5) * 15;

        // Big outer corona
        const outerCorona = ctx.createRadialGradient(
          sunX,
          sunY,
          20,
          sunX,
          sunY,
          260 + sunPulse
        );
        outerCorona.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
        outerCorona.addColorStop(0.35, 'rgba(245, 158, 11, 0.2)');
        outerCorona.addColorStop(0.7, 'rgba(217, 119, 6, 0.06)');
        outerCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = outerCorona;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 300 + sunPulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing core
        const innerSun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 65);
        innerSun.addColorStop(0, '#fffbeb');
        innerSun.addColorStop(0.3, '#fef08a');
        innerSun.addColorStop(0.7, '#f59e0b');
        innerSun.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = innerSun;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
        ctx.fill();

        // Sun rays
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(time * 0.04);
        for (let r = 0; r < 8; r++) {
          ctx.rotate((Math.PI * 2) / 8);
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(0, 220 + Math.sin(time * 2 + r) * 20);
          ctx.lineTo(10, 0);
          ctx.fillStyle = 'rgba(253, 224, 71, 0.04)';
          ctx.fill();
        }
        ctx.restore();

        // Floating sun dust particles
        sparkles.forEach((s) => {
          s.y += s.speedY;
          s.x += s.speedX;
          s.phase += s.pulseRate;

          if (s.y < -10) s.y = height + 10;
          if (s.x < 0) s.x = width;
          if (s.x > width) s.x = 0;

          const currentAlpha = s.opacity * (0.6 + 0.4 * Math.sin(s.phase));
          ctx.fillStyle = `rgba(253, 230, 138, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (category === 'rain' || category === 'thunder') {
        // Deep storm indigo gradient
        const rainGrad = ctx.createLinearGradient(0, 0, 0, height);
        rainGrad.addColorStop(0, '#090d16');
        rainGrad.addColorStop(0.6, '#0f172a');
        rainGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = rainGrad;
        ctx.fillRect(0, 0, width, height);

        // Thunder flash handling
        if (category === 'thunder') {
          lightningTimer += 0.016;
          if (lightningTimer > 5 + Math.random() * 4) {
            lightningAlpha = 0.55;
            lightningTimer = 0;
          }
          if (lightningAlpha > 0) {
            ctx.fillStyle = `rgba(216, 231, 255, ${lightningAlpha})`;
            ctx.fillRect(0, 0, width, height);
            lightningAlpha *= 0.88;
            if (lightningAlpha < 0.01) lightningAlpha = 0;
          }
        }

        // Draw and update raindrops
        ctx.strokeStyle = category === 'thunder' ? 'rgba(186, 230, 253, 0.65)' : 'rgba(125, 211, 252, 0.5)';
        rainDrops.forEach((d) => {
          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          // Angle with wind
          ctx.lineTo(d.x - 3, d.y + d.length);
          ctx.stroke();

          d.y += d.speed;
          d.x -= 1.2; // slight diagonal wind

          // Hit ground / bottom, create splash
          if (d.y > height - 10) {
            if (Math.random() < 0.25) {
              splashes.push({
                x: d.x,
                y: height - Math.random() * 20,
                radius: 1,
                maxRadius: 4 + Math.random() * 5,
                opacity: 0.5,
              });
            }
            d.y = -20;
            d.x = Math.random() * (width + 100);
          }
        });

        // Draw and expand splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.radius += 0.6;
          sp.opacity -= 0.035;

          ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, sp.opacity)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius * 1.6, sp.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (sp.opacity <= 0 || sp.radius >= sp.maxRadius) {
            splashes.splice(i, 1);
          }
        }
      } else if (category === 'cloudy') {
        // Soft overcast twilight gradient
        const cloudGrad = ctx.createLinearGradient(0, 0, 0, height);
        cloudGrad.addColorStop(0, '#0f172a');
        cloudGrad.addColorStop(0.5, '#1e293b');
        cloudGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = cloudGrad;
        ctx.fillRect(0, 0, width, height);

        // Smooth drifting clouds
        clouds.forEach((c) => {
          c.x += c.speed;
          if (c.x - c.radius > width) {
            c.x = -c.radius - 50;
            c.y = 20 + Math.random() * (height * 0.45);
          }

          const grad = ctx.createRadialGradient(
            c.x,
            c.y,
            c.radius * 0.2,
            c.x,
            c.y,
            c.radius
          );
          grad.addColorStop(0, `rgba(148, 163, 184, ${c.opacity})`);
          grad.addColorStop(0.6, `rgba(100, 116, 139, ${c.opacity * 0.6})`);
          grad.addColorStop(1, 'rgba(71, 85, 105, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // 'night'
        const nightGrad = ctx.createLinearGradient(0, 0, 0, height);
        nightGrad.addColorStop(0, '#05070e');
        nightGrad.addColorStop(0.6, '#090d16');
        nightGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(0, 0, width, height);

        // Crescent moon glow
        const moonX = width * 0.85;
        const moonY = 85;
        const moonGlow = ctx.createRadialGradient(
          moonX,
          moonY,
          10,
          moonX,
          moonY,
          140
        );
        moonGlow.addColorStop(0, 'rgba(224, 231, 255, 0.25)');
        moonGlow.addColorStop(0.6, 'rgba(199, 210, 254, 0.06)');
        moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
        ctx.fill();

        // Moon disc
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
        ctx.fill();

        // Moon shadow to create crescent
        ctx.fillStyle = '#05070e';
        ctx.beginPath();
        ctx.arc(moonX - 8, moonY - 6, 24, 0, Math.PI * 2);
        ctx.fill();

        // Twinkling stars
        stars.forEach((st) => {
          st.phase += st.twinkleSpeed;
          const alpha = st.baseOpacity + 0.3 * Math.sin(st.phase);
          ctx.fillStyle = `rgba(241, 245, 249, ${Math.max(0.1, alpha)})`;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [category]);

  return (
    <div
      id="weather-background-container"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle overlay grid/vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />
    </div>
  );
};
