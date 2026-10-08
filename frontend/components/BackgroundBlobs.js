export default function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", filter: "blur(40px)", opacity: 0.42 }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, #c9cdd1 0%, transparent 70%)", filter: "blur(50px)", opacity: 0.3 }}
      />
      <div
        className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", filter: "blur(50px)", opacity: 0.28 }}
      />
    </div>
  );
}
