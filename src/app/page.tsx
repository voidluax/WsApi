import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import DeploySection from "@/components/DeploySection";
import ApiSection from "@/components/ApiSection";
import WsSection from "@/components/WsSection";
import RulesSection from "@/components/RulesSection";
import FlowSection from "@/components/FlowSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <Hero />
      <DeploySection />
      <ApiSection />
      <WsSection />
      <RulesSection />
      <FlowSection />
      <Footer />
    </main>
  );
}
