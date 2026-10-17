import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PromoBar from "@/components/PromoBar";
import FeaturedGear from "@/components/FeaturedGear";
import DealsBanner from "@/components/DealsBanner";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import CategoryDirectory from "@/components/CategoryDirectory";
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
        description="Shop two-wheeler spare parts, ignition coils, clutch plates, engine oils, helmets and accessories at BikersBrain. Visit our Pune store or shop online."
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
        <CategoryDirectory />
        <DealsBanner />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
