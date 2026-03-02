import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PromoBar from "@/components/PromoBar";
import FeaturedGear from "@/components/FeaturedGear";
import DealsBanner from "@/components/DealsBanner";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PromoBar />
        <FeaturedGear />
        <DealsBanner />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
