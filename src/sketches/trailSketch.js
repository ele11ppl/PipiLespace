/**
 * trailSketch — p5.js sketch: white particle trails on black.
 *
 * Uses a ring buffer of mouse positions to draw fading poly-lines
 * and a handful of "lag" followers for organic secondary motion.
 */

const TRAIL_LENGTH  = 120;   // max trail points kept
const MAX_AGE       = 1.8;   // seconds before a point expires
const NUM_FOLLOWERS = 4;     // delayed followers trailing the mouse

// ---- helpers ------------------------------------------------------------

/** Smooth a value toward a target (lerp each frame). */
function lerpTo(current, target, amt) {
  return current + (target - current) * amt;
}

// ---- sketch definition --------------------------------------------------

export default function trailSketch(p) {
  // trail ring buffer
  const trail = [];           // { x, y, t (seconds) }

  // followers — each chases the mouse at a different speed
  let followers = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noFill();
    p.stroke(255);

    // seed followers at center
    followers = Array.from({ length: NUM_FOLLOWERS }, (_, i) => ({
      x: p.width  / 2,
      y: p.height / 2,
      // stagger easing: early followers are snappier, later are lazier
      ease: 0.02 + (i / (NUM_FOLLOWERS - 1)) * 0.06,
    }));
  };

  p.draw = () => {
    // ---- 1. Fade the canvas for persistence --------------------------------
    // Instead of clearing every frame, draw a semi-transparent black
    // rectangle so old strokes linger and fade smoothly.
    p.background(0, 18);  // low alpha → long tails

    // ---- 2. Update mouse trail ring buffer --------------------------------
    const now = p.millis() / 1000;

    trail.push({ x: p.mouseX, y: p.mouseY, t: now });

    // discard expired points
    while (trail.length && now - trail[0].t > MAX_AGE) {
      trail.shift();
    }
    // hard-cap length
    while (trail.length > TRAIL_LENGTH) {
      trail.shift();
    }

    // ---- 3. Draw the main trail (direct mouse history) --------------------
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        const age = now - trail[i].t;
        const alpha = p.map(age, 0, MAX_AGE, 200, 0);
        const weight = p.map(age, 0, MAX_AGE, 2.0, 0.2);

        p.stroke(255, alpha);
        p.strokeWeight(weight);
        p.line(trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y);
      }
    }

    // ---- 4. Update and draw lagging followers (organic secondary lines) ---
    for (let i = 0; i < followers.length; i++) {
      const f = followers[i];

      // chase the current mouse position
      f.x = lerpTo(f.x, p.mouseX, f.ease);
      f.y = lerpTo(f.y, p.mouseY, f.ease);

      // add subtle Perlin-noise wobble
      const wobbleX = p.noise(p.frameCount * 0.02 + i * 10) * 8 - 4;
      const wobbleY = p.noise(p.frameCount * 0.02 + i * 10 + 100) * 8 - 4;

      // draw a short segment from follower toward mouse
      const alpha = p.map(i, 0, NUM_FOLLOWERS - 1, 120, 30);
      const weight = p.map(i, 0, NUM_FOLLOWERS - 1, 0.6, 0.2);

      p.stroke(255, alpha);
      p.strokeWeight(weight);
      p.line(
        f.x + wobbleX,
        f.y + wobbleY,
        p.mouseX,
        p.mouseY,
      );
    }
  };

  // ---- 5. Handle window resize -------------------------------------------
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}
