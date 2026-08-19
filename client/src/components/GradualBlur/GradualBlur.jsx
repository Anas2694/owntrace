import './GradualBlur.css';

const GradualBlur = ({
  src = '',
  position = 'bottom',
  strength = 2,
  height = '6rem',
  width,
  divCount = 5,
  exponential = false,
  curve = 'linear',
  opacity = 1,
  animated = false,
  duration = '0.3s',
  easing = 'ease-out',
  target = 'parent',
  zIndex = 1000,
  style,
  className = '',
}) => {
  const layers = Array.from({ length: divCount }, (_, i) => {
    const rawProgress = divCount === 1 ? 1 : i / (divCount - 1);
    const progress = exponential ? rawProgress ** 2 : rawProgress;
    const blur = strength * (i + 1);

    const maskPercent = (i / divCount) * 100;
    const maskNextPercent = ((i + 1) / divCount) * 100;

    const maskDirectionMap = {
      bottom: `linear-gradient(to bottom, transparent ${100 - maskNextPercent}%, black ${100 - maskPercent}%)`,
      top: `linear-gradient(to top, transparent ${100 - maskNextPercent}%, black ${100 - maskPercent}%)`,
      left: `linear-gradient(to left, transparent ${100 - maskNextPercent}%, black ${100 - maskPercent}%)`,
      right: `linear-gradient(to right, transparent ${100 - maskNextPercent}%, black ${100 - maskPercent}%)`,
    };

    return (
      <div
        key={i}
        className="gradual-blur__layer"
        style={{
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          maskImage: maskDirectionMap[position],
          WebkitMaskImage: maskDirectionMap[position],
          opacity: opacity * (curve === 'ease-in' ? progress : 1),
          transition: animated ? `opacity ${duration} ${easing}` : undefined,
        }}
      />
    );
  });

  return (
    <div
      className={`gradual-blur gradual-blur--${position} gradual-blur--${target}${animated ? ' gradual-blur--animated' : ''} ${className}`.trim()}
      style={{ height, width, zIndex, ...style }}
    >
      {src && (
        <img
          className="gradual-blur__media"
          src={src}
          alt=""
          draggable={false}
        />
      )}
      <div className="gradual-blur__layers">{layers}</div>
    </div>
  );
};

export default GradualBlur;
