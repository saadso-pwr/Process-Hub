"use client";

export function ProcessHeader() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-black">
      {/* Logo */}
      <div className="relative h-[50px] w-[156px] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/power-tech-logo.png"
          alt="Power Technology"
          className="absolute max-w-none"
          style={{
            width: "254%",
            height: "560%",
            top: "-230%",
            left: "-77%",
          }}
        />
      </div>

      {/* Divider */}
      <div className="h-12 w-px bg-[#B7B7B7] shrink-0" />

      {/* Title */}
      <h1
        className="text-black whitespace-nowrap text-[28px] font-bold leading-tight"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Offerings Process Maps
      </h1>
    </div>
  );
}
