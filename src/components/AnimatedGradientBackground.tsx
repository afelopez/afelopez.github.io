'use client';

const AnimatedGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-gray-950">
      {/* Subtle grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      {/* Centered bloom — min 80% of the viewport, pulsing behind the content */}
      <div
        className="animate-gradient-fade absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'max(80vw, 80vh)',
          height: 'max(80vw, 80vh)',
          background:
            'radial-gradient(circle at center, var(--gradient-start) 0%, var(--gradient-mid) 40%, var(--gradient-end) 68%, transparent 100%)',
          filter: 'blur(72px)',
          opacity: 0.38,
        }}
      />
    </div>
  );
};

export default AnimatedGradientBackground;
