import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PromoBar from "@/components/PromoBar";
import FeaturedGear from "@/components/FeaturedGear";
import DealsBanner from "@/components/DealsBanner";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import SEO, {
  organizationJsonLd,
  localBusinessJsonLd,
  websiteJsonLd,
} from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Buy Two-Wheeler Spare Parts, Helmets & Riding Gear Online"
        description="India's #1 online store for genuine two-wheeler spare parts, motorcycle helmets, riding gear, engine oils & accessories. Free shipping over ₹2,999. Shop now!"
        canonical="/"
        keywords="buy bike spare parts online India, two wheeler accessories, motorcycle helmets online, riding gear India, engine oil for bikes, genuine bike parts, BikersBrain"
        jsonLd={[
          organizationJsonLd(),
          localBusinessJsonLd(),
          websiteJsonLd(),
        ]}
      />
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
