import MobileGooeyNav from "../components/layout/mobile-gooey-nav";

// Minimal stand-in matching the shape the component reads (user.profile?.role).
const fakeUser = {
  id: "test",
  email: "test@library.test",
  profile: { role: "admin", full_name: "Test User" },
} as any;

export default function GooeyCheck() {
  const light = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("theme") === "light";
  return (
    <div className={`min-h-screen p-6 ${light ? "bg-[#e9e6df] text-black" : "bg-[#0b0b0f] text-white"}`}>
      <h1 className="text-xl font-semibold">Dashboard preview</h1>
      <p className="opacity-60 mt-2">
        Backdrop content so the mobile nav has something behind it.
      </p>
      <MobileGooeyNav user={fakeUser} />
    </div>
  );
}
