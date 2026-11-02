export default function Background() {
  return (
    <div aria-hidden>
      <div className="bg-aurora" />
      <div className="orb h-72 w-72 bg-violet-400" style={{ top: "-4rem", left: "-5rem" }} />
      <div className="orb h-80 w-80 bg-sky-400" style={{ top: "30%", right: "-6rem", animationDelay: "-6s" }} />
      <div className="orb h-64 w-64 bg-pink-400" style={{ bottom: "-3rem", left: "20%", animationDelay: "-11s" }} />
      <div className="orb h-52 w-52 bg-orange-300" style={{ bottom: "25%", left: "-4rem", animationDelay: "-3s" }} />
    </div>
  );
}
