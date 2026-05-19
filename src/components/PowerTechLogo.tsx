export function PowerTechLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-white ${className}`}>
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
  );
}
