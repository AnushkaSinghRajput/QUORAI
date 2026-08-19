import Image from "next/image";

const STARS = [
  { top: "8%", left: "12%", size: 2, delay: "0s" },
  { top: "15%", left: "78%", size: 1.5, delay: "1.2s" },
  { top: "32%", left: "45%", size: 2, delay: "0.6s" },
  { top: "55%", left: "88%", size: 1, delay: "2s" },
  { top: "68%", left: "22%", size: 1.5, delay: "0.3s" },
  { top: "82%", left: "62%", size: 2, delay: "1.5s" },
  { top: "42%", left: "8%", size: 1, delay: "0.9s" },
  { top: "25%", left: "92%", size: 1.5, delay: "2.4s" },
];

export function CosmicBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <Image
        src="/cosmos.png"
        alt=""
        fill
        priority
        quality={65}
        sizes="100vw"
        className="object-cover object-center scale-105"
      />

      {/* Aurora overlays */}
      <div className="absolute -left-[20%] top-[10%] h-[50vh] w-[60vw] rounded-full bg-violet/20 blur-[100px] animate-[aurora-drift_14s_ease-in-out_infinite_alternate]" />
      <div className="absolute -right-[15%] top-[30%] h-[40vh] w-[50vw] rounded-full bg-cyan/10 blur-[90px] animate-[aurora-drift_18s_ease-in-out_infinite_alternate-reverse]" />
      <div className="absolute bottom-[5%] left-[30%] h-[30vh] w-[40vw] rounded-full bg-rose/8 blur-[80px] animate-[aurora-drift_20s_ease-in-out_infinite_alternate]" />

      {/* Star field */}
      {STARS.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/70 dark:bg-white/50"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animation: `twinkle 3s ease-in-out ${star.delay} infinite`,
          }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 dark:from-black/30 dark:to-black/60" />
      <div className="absolute inset-0 bg-black/30 dark:bg-black/40" />
    </div>
  );
}
