export default function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-40 -left-28 w-[520px] h-[520px] rounded-full opacity-55 bg-[radial-gradient(circle,_#9FDCF9_0%,_transparent_68%)] blur-[45px] float" />
      <div className="absolute top-[24%] -right-40 w-[560px] h-[560px] rounded-full opacity-45 bg-[radial-gradient(circle,_#6FC3F0_0%,_transparent_68%)] blur-[55px]" />
      <div className="absolute -bottom-52 left-[22%] w-[600px] h-[600px] rounded-full opacity-45 bg-[radial-gradient(circle,_#BFE8FB_0%,_transparent_68%)] blur-[60px]" />
      <div className="absolute top-[62%] right-[22%] w-[280px] h-[280px] rounded-full opacity-20 bg-[radial-gradient(circle,_#14B8A6_0%,_transparent_70%)] blur-[50px]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(rgba(15,42,67,.9)_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
    </div>
  );
}
