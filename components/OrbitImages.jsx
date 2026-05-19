// Component created by Dominik Koch ? https://x.com/dominikkoch
// Chat ellipse orbit (simplified for life-fragments)

const { useMemo, useEffect, useRef, useState } = React;
const { motion, useMotionValue, useTransform, animate } = Motion;

function generateEllipsePath(cx, cy, rx, ry) {
  return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy - ry} Z`;
}

function OrbitItem({
  item,
  index,
  totalItems,
  itemSize,
  rotation,
  progress,
  centerX,
  centerY,
  radiusX,
  radiusY,
}) {
  const itemOffset = (index / totalItems) * 100;
  const pathProgress = useTransform(progress, (p) => (((p + itemOffset) % 100) + 100) % 100);
  const left = useTransform(pathProgress, (t) => {
    const rad = -Math.PI / 2 + (t / 100) * Math.PI * 2;
    return centerX + radiusX * Math.cos(rad) - itemSize / 2;
  });
  const top = useTransform(pathProgress, (t) => {
    const rad = -Math.PI / 2 + (t / 100) * Math.PI * 2;
    return centerY + radiusY * Math.sin(rad) - itemSize / 2;
  });

  return (
    <motion.div
      className="orbit-item"
      style={{
        position: "absolute",
        width: itemSize,
        height: itemSize,
        left,
        top,
      }}
    >
      <motion.div style={{ transform: `rotate(${-rotation}deg)` }}>{item}</motion.div>
    </motion.div>
  );
}

function OrbitImages({
  images = [],
  altPrefix = "Orbiting image",
  baseWidth = 1400,
  radiusX = 700,
  radiusY = 170,
  rotation = -8,
  duration = 40,
  itemSize = 64,
  direction = "normal",
  className = "chat-orbit",
  showPath = false,
  pathColor = "rgba(255, 255, 255, 0.4)",
  pathWidth = 1.15,
  easing = "linear",
  paused = false,
  trackVisible = true,
  centerContent,
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const centerX = baseWidth / 2;
  const centerY = baseWidth / 2;

  const path = useMemo(
    () => generateEllipsePath(centerX, centerY, radiusX, radiusY),
    [centerX, centerY, radiusX, radiusY]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const w = el.clientWidth;
      const h = el.clientHeight || w;
      const fitW = w / baseWidth;
      const rotRad = (Math.abs(rotation) * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rotRad));
      const sin = Math.abs(Math.sin(rotRad));
      const extX = radiusX * cos + radiusY * sin;
      const extY = radiusX * sin + radiusY * cos;
      const scaleByW = (w * 0.6) / extX;
      const scaleByH = (h * 0.6) / extY;
      const fitScale = Math.min(scaleByW, scaleByH);
      setScale(Math.min(fitScale, fitW * 1.05));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [baseWidth, rotation, radiusX, radiusY]);

  const progress = useMotionValue(0);

  const trackPaused = paused || !trackVisible;

  useEffect(() => {
    if (trackPaused) return;
    const controls = animate(progress, direction === "reverse" ? -100 : 100, {
      duration,
      ease: easing,
      repeat: Infinity,
      repeatType: "loop",
    });
    return () => controls.stop();
  }, [progress, duration, easing, direction, trackPaused]);

  const pathSvg = showPath ? (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${baseWidth} ${baseWidth}`}
      className="orbit-path-svg"
    >
      <path
        d={path}
        fill="none"
        stroke={pathColor}
        strokeWidth={pathWidth / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : null;

  const items = images.map((src, index) => (
    <img
      key={`${src}-${index}`}
      src={src}
      alt={`${altPrefix} ${index + 1}`}
      draggable={false}
      className="orbit-image"
    />
  ));

  const pathOverlayStyle = {
    width: baseWidth,
    height: baseWidth,
    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
  };

  const scalingStyle = {
    width: baseWidth,
    height: baseWidth,
    transform: `translate(-50%, -50%) scale(${scale})`,
  };

  const trackMotion = {
    opacity: trackVisible ? 1 : 0,
    scale: trackVisible ? 1 : 0.88,
    filter: trackVisible ? "blur(0px)" : "blur(10px)",
  };
  const trackTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };

  return (
    <motion.div
      ref={containerRef}
      className={`orbit-container ${className} orbit-container--responsive${
        trackVisible ? "" : " orbit-container--track-hidden"
      }`}
      aria-hidden={centerContent ? undefined : true}
    >
      <motion.div
        className="orbit-track-layer"
        initial={false}
        animate={trackMotion}
        transition={trackTransition}
        style={{ pointerEvents: "none" }}
        aria-hidden={!trackVisible}
      >
        <div className="orbit-scaling-container orbit-scaling-container--responsive" style={scalingStyle}>
          <div className="orbit-rotation-wrapper" style={{ transform: `rotate(${rotation}deg)` }}>
            {items.map((item, index) => (
              <OrbitItem
                key={index}
                item={item}
                index={index}
                totalItems={items.length}
                itemSize={itemSize}
                rotation={rotation}
                progress={progress}
                centerX={centerX}
                centerY={centerY}
                radiusX={radiusX}
                radiusY={radiusY}
              />
            ))}
          </div>
        </div>

        {showPath && (
          <motion.div className="orbit-path-overlay" style={pathOverlayStyle}>
            {pathSvg}
          </motion.div>
        )}
      </motion.div>

      {centerContent && <motion.div className="orbit-center-content">{centerContent}</motion.div>}
    </motion.div>
  );
}

window.OrbitImages = OrbitImages;
