import React, { useRef, useEffect } from 'react';

const Canvas = ({ draw, ...props }) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    let frameCount = 0;

    const render = () => {
      frameCount++;
      if (draw(context, frameCount)) {
        animationFrameId.current = requestAnimationFrame(render);
      } else {
        animationFrameId.current = null;
      }
    };
    render();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [draw]);

  return <canvas ref={canvasRef} {...props} />;
};

export default Canvas;
