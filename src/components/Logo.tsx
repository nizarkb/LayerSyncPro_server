import React, { useState } from "react";
import logoIcon from "../assets/images/logo_icon_1783647133905.jpg";
import logoStacked from "../assets/images/logo_stacked_1783647162900.jpg";
import logoHorizontal from "../assets/images/logo_horizontal_1783647176226.jpg";

interface LogoProps {
  className?: string;
  variant?: "icon" | "horizontal" | "stacked";
  size?: "sm" | "md" | "lg" | "xl";
}

export function LogoIcon({ size = "md", className = "" }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const [useFallback, setUseFallback] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-28 h-28",
  };

  if (!useFallback) {
    return (
      <img
        src={logoIcon}
        alt="Layer SyncPro Icon"
        className={`${sizeClasses[size]} ${className} rounded-full object-contain`}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${sizeClasses[size]} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients for rich visual quality */}
        <radialGradient id="eggGrad" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#F9C38B" />
          <stop offset="45%" stopColor="#D28833" />
          <stop offset="100%" stopColor="#8C4F12" />
        </radialGradient>
        <linearGradient id="henGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5EFE6" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B935F" />
          <stop offset="100%" stopColor="#2D5B32" />
        </linearGradient>
        <linearGradient id="nestGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E29E4D" />
          <stop offset="100%" stopColor="#A05F19" />
        </linearGradient>
      </defs>

      {/* Main Circular Ring Frame */}
      <circle cx="50" cy="50" r="38" fill="#FAF8F5" stroke="#2D5B32" strokeWidth="2" strokeDasharray="none" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#D28833" strokeOpacity="0.15" strokeWidth="1" />

      {/* Elegant Leafy Branch on Left side of the circle */}
      {/* Branch Line */}
      <path
        d="M 18,68 C 10,48 16,28 32,18"
        fill="none"
        stroke="#2D5B32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Leaf 1 */}
      <path d="M 14,54 Q 5,53 8,46 Q 16,48 14,54 Z" fill="url(#leafGrad)" />
      {/* Leaf 2 */}
      <path d="M 17,40 Q 8,36 14,30 Q 21,34 17,40 Z" fill="url(#leafGrad)" />
      {/* Leaf 3 */}
      <path d="M 25,27 Q 18,19 25,16 Q 30,22 25,27 Z" fill="url(#leafGrad)" />
      {/* Leaf 4 (Bottom edge) */}
      <path d="M 17,62 Q 9,66 11,59 Q 18,58 17,62 Z" fill="url(#leafGrad)" />

      {/* Nest (Straw at bottom) */}
      <path
        d="M 26,68 C 30,78 70,78 74,68"
        fill="none"
        stroke="url(#nestGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Nest Secondary Layers */}
      <path
        d="M 22,66 C 30,75 70,75 78,66"
        fill="none"
        stroke="#8C4F12"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 28,71 C 38,80 62,80 72,71"
        fill="none"
        stroke="#F4C080"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Hen Body */}
      {/* Tail feathers */}
      <path
        d="M 28,66 Q 22,50 32,46 C 35,52 35,62 28,66 Z"
        fill="url(#henGrad)"
        stroke="#E6DEC9"
        strokeWidth="0.5"
      />
      {/* Main Body */}
      <path
        d="M 32,66 C 30,55 36,46 44,46 C 50,46 51,38 51,33 C 51,29 55,27 58,27 C 61,29 62,35 58,46 C 65,47 73,53 73,66 C 73,69 68,69 52,69 C 36,69 32,66 32,66 Z"
        fill="url(#henGrad)"
        stroke="#E6DEC9"
        strokeWidth="0.5"
      />

      {/* Wing detail */}
      <path
        d="M 40,56 C 44,51 52,51 55,57 C 52,62 43,62 40,56 Z"
        fill="#FDFDFB"
        stroke="#E6DEC9"
        strokeWidth="0.5"
      />

      {/* Eye */}
      <circle cx="56" cy="33" r="1.5" fill="#1A1A1A" />

      {/* Beak */}
      <path d="M 58,32 L 64,34.5 L 58,37 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />

      {/* Red Chicken Comb */}
      <path
        d="M 51,28 C 49,21 53,18 55,20 C 57,17 59,19 59,21 C 61,18 63,20 62,26 L 56,26 Z"
        fill="#C22F22"
      />

      {/* Red Chicken Wattle */}
      <path d="M 58,37 C 60,37 60,41 58,41 C 56,41 56,37 58,37 Z" fill="#C22F22" />

      {/* Golden Egg (Lying in nest in front of chicken) */}
      <ellipse
        cx="64"
        cy="63"
        rx="7"
        ry="10"
        fill="url(#eggGrad)"
        transform="rotate(15, 64, 63)"
        stroke="#8C4F12"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export default function Logo({ variant = "horizontal", size = "md", className = "" }: LogoProps) {
  const [useFallbackHorizontal, setUseFallbackHorizontal] = useState(false);
  const [useFallbackStacked, setUseFallbackStacked] = useState(false);

  if (variant === "icon") {
    return <LogoIcon size={size} className={className} />;
  }

  if (variant === "stacked") {
    const sizeClasses = {
      sm: "h-20",
      md: "h-32",
      lg: "h-40",
      xl: "h-56",
    };

    if (!useFallbackStacked) {
      return (
        <img
          src={logoStacked}
          alt="Layer SyncPro"
          className={`${sizeClasses[size || "xl"]} ${className} object-contain mx-auto`}
          onError={() => setUseFallbackStacked(true)}
        />
      );
    }

    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <LogoIcon size={size === "xl" ? "xl" : "lg"} />
        <div className="mt-3">
          <h1 className="text-xl font-black tracking-tight font-sans text-slate-900 leading-none">
            <span className="text-[#2D5B32]">Layer</span>
            <span className="text-[#D28833]">Sync</span>
            <span className="text-[#2D5B32] relative">
              Pro
              <span className="absolute -top-1.5 -right-3 flex space-x-0.5 opacity-90 scale-75 transform origin-left">
                <span className="w-1 h-1 bg-[#2D5B32] rounded-full animate-pulse"></span>
                <span className="w-1 h-1 bg-[#2D5B32] rounded-full animate-pulse delay-75"></span>
                <span className="w-1 h-1 bg-[#2D5B32] rounded-full animate-pulse delay-150"></span>
              </span>
            </span>
          </h1>
          <p className="mt-1.5 text-[10px] font-bold text-[#2D5B32] tracking-wide uppercase">
            — Management System —
          </p>
          <p className="text-[9px] font-semibold text-slate-500 leading-normal">
            Peternak Telur Ayam
          </p>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  const heightClasses = {
    sm: "h-8",
    md: "h-11",
    lg: "h-14",
    xl: "h-18",
  };

  if (!useFallbackHorizontal) {
    return (
      <img
        src={logoHorizontal}
        alt="Layer SyncPro"
        className={`${heightClasses[size || "md"]} ${className} object-contain`}
        onError={() => setUseFallbackHorizontal(true)}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={size === "sm" ? "sm" : "md"} className="shrink-0" />
      <div className="flex flex-col">
        <h1 className="text-base font-black tracking-tight font-sans text-slate-900 leading-none flex items-center">
          <span className="text-[#2D5B32]">Layer</span>
          <span className="text-[#D28833]">Sync</span>
          <span className="text-[#2D5B32] relative">
            Pro
            {/* Elegant tiny wireless/sync waves on the letter o */}
            <span className="absolute -top-1 -right-3 flex items-center gap-0.5 scale-75">
              <span className="inline-flex flex-col gap-[1px]">
                <span className="w-[3px] h-[3px] bg-[#2D5B32] rounded-full"></span>
              </span>
              <svg className="w-3 h-3 text-[#2D5B32]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M 5,12 C 7,8 10,8 12,12" />
                <path d="M 2,9 C 6,4 11,4 15,9" />
              </svg>
            </span>
          </span>
        </h1>
        <span className="text-[8.5px] font-bold text-slate-500 mt-1 uppercase tracking-wide leading-none">
          Management System Peternak Ayam
        </span>
      </div>
    </div>
  );
}
