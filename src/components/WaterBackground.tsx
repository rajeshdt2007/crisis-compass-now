export function WaterBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] blob bg-gradient-to-br from-cyan-300/40 to-blue-400/30 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-[36rem] h-[36rem] blob bg-gradient-to-br from-pink-300/30 to-orange-300/30 blur-3xl" style={{ animationDelay: "2s" }} />
      <div className="absolute -bottom-40 left-1/4 w-[44rem] h-[44rem] blob bg-gradient-to-br from-teal-300/30 to-indigo-300/30 blur-3xl" style={{ animationDelay: "4s" }} />
      <svg className="absolute bottom-0 left-0 w-[200%] h-32 opacity-30" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ animation: "wave 12s ease-in-out infinite" }}>
        <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="url(#wg)" />
        <defs>
          <linearGradient id="wg" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.75 0.15 200)" />
            <stop offset="1" stopColor="oklch(0.55 0.18 230)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
