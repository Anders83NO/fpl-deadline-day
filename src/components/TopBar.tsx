import Logo from "@/components/Logo";
import DeadlineCountdown from "@/components/DeadlineCountdown";

export default function TopBar() {
  return (
    <div className="sticky top-0 z-40 px-4 h-14 flex items-center justify-between"
      style={{ background: "#0f1520", borderBottom: "1px solid #1e3050" }}>
      <Logo size={36} showText={true} />
      <DeadlineCountdown />
    </div>
  );
}
