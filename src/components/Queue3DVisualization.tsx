import React, { useEffect, useRef } from 'react';
import { DepartmentStats } from '../types';

interface Queue3DVisualizationProps {
  departmentStats: DepartmentStats[];
  className?: string;
}

export const Queue3DVisualization: React.FC<Queue3DVisualizationProps> = ({ 
  departmentStats, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw 3D queue visualization
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.3;

      departmentStats.forEach((dept, index) => {
        const angle = (index / departmentStats.length) * Math.PI * 2 + time * 0.001;
        const radius = maxRadius * 0.7;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Draw department circle with 3D effect
        const size = Math.max(20, dept.total_waiting * 3);
        
        // Shadow
        ctx.beginPath();
        ctx.arc(x + 3, y + 3, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        // Main circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        
        // Gradient for 3D effect
        const circleGradient = ctx.createRadialGradient(
          x - size * 0.3, y - size * 0.3, 0,
          x, y, size
        );
        circleGradient.addColorStop(0, dept.color_code + 'CC');
        circleGradient.addColorStop(1, dept.color_code + '66');
        
        ctx.fillStyle = circleGradient;
        ctx.fill();

        // Border
        ctx.strokeStyle = dept.color_code;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Department name
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dept.display_name, x, y - size - 10);

        // Queue info
        ctx.font = '10px sans-serif';
        ctx.fillText(`Serving: ${dept.now_serving}`, x, y - 5);
        ctx.fillText(`Waiting: ${dept.total_waiting}`, x, y + 8);

        // Animated pulse for active departments
        if (dept.total_waiting > 0) {
          const pulseSize = size + Math.sin(time * 0.005 + index) * 5;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = dept.color_code + '40';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Center info
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Live Queue', centerX, centerY - 20);
      
      const totalWaiting = departmentStats.reduce((sum, dept) => sum + dept.total_waiting, 0);
      ctx.font = '14px sans-serif';
      ctx.fillText(`${totalWaiting} Total Waiting`, centerX, centerY + 5);

      time += 16;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [departmentStats]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '300px' }}
      />
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-xs">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Circle size = Queue length</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span>Pulse = Active queue</span>
          </div>
        </div>
      </div>
    </div>
  );
};