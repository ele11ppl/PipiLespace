import { useEffect, useRef } from 'react';
import p5 from 'p5';
import trailSketch from '../sketches/trailSketch';

/**
 * ParticleTrail — mounts / unmounts the p5 instance.
 *
 * Uses a ref so StrictMode double-mounts in dev are cleaned up properly.
 */
export default function ParticleTrail() {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);

  useEffect(() => {
    // Instantiate p5 with our sketch; attach to the container div.
    p5Ref.current = new p5(trailSketch, containerRef.current);

    return () => {
      // Tear down to avoid duplicate canvases on hot-reload / StrictMode.
      p5Ref.current?.remove();
    };
  }, []);

  return <div ref={containerRef} className="particle-trail" />;
}
