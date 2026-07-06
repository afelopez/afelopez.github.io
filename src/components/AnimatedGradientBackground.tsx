'use client';

const AnimatedGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden bg-white dark:bg-gray-950">
      <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] animate-gradient-move">
        <div
          className="absolute inset-0 -z-10 opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle 500px at 50% 30%, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%)',
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedGradientBackground;
