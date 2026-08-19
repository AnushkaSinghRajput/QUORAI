import Image from "next/image";
import { cn } from "@/lib/utils";

export function SignupHeroArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full", className)}>
      <Image
        src="/brand/reasoning-paths-clean.png"
        alt="Research paths branching from a single query"
        width={1024}
        height={360}
        priority
        className="h-auto w-full object-contain object-left"
      />
    </div>
  );
}
