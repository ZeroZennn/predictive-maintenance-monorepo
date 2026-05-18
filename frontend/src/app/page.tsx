import {
  Navbar,
  HeroSection,
  ProblemSection,
  TheaterSection,
  TechStackSection,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#081819] text-white selection:bg-[#5FDA0A] selection:text-black font-sans">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <TheaterSection />
      <TechStackSection />
      <Footer />
    </div>
  );
}
