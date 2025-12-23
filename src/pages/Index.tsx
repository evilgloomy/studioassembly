import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ManifestoSection from "@/components/ManifestoSection";
import CitySection from "@/components/CitySection";
import StoreAccessSection from "@/components/StoreAccessSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ManifestoSection />
        <CitySection />
        <StoreAccessSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;