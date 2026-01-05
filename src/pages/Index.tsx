import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import NewArrivals from "@/components/NewArrivals";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeatureGrid />
        <NewArrivals />
      </main>
      <Footer />
    </div>
  );
};

export default Index;