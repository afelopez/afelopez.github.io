'use client';

const AnimatedGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] animate-gradient-move">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_500px_at_50%_30%,#f97316_0%,#ec4899_50%,#8b5cf6_100%)] opacity-40 blur-3xl"></div>
      </div>
    </div>
  );
};

export default AnimatedGradientBackground;
