import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PromoBar from "@/components/PromoBar";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedProducts from "@/components/FeaturedProducts";
import DealsBanner from "@/components/DealsBanner";
import BrandSlider from "@/components/BrandSlider";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PromoBar />
        <CategoryGrid />
        <FeaturedProducts />
        <DealsBanner />
        <BrandSlider />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
