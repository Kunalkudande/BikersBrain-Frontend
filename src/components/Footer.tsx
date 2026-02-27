import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import logo from "@/assets/bikersbrain_logo_only_brain.png";

const CONTACT_INFO = {
  email: "support@bikersbrain.com",
  phone: "+91 98765 43210",
  address: "Pune, Maharashtra, India",
  workingHours: "Mon-Sat: 9AM – 8PM",
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sections: Record<string, { label: string; href: string }[]> = {
    "ABOUT BIKERS BRAIN": [
      { label: "Why Shop With Us?", href: "/about" },
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "New Arrivals", href: "/products?sort=newest" },
      { label: "Best Sellers", href: "/products?sort=popular" },
    ],
    "CUSTOMER SERVICE": [
      { label: "Contact Us", href: "/contact" },
      { label: "Return Policy", href: "/return-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Track Order", href: "/track-order" },
      { label: "FAQ", href: "/contact" },
    ],
    "SHOP": [
      { label: "All Helmets", href: "/products" },
      { label: "Jackets", href: "/products?category=JACKETS" },
      { label: "Gloves", href: "/products?category=GLOVES" },
      { label: "Boots", href: "/products?category=BOOTS" },
      { label: "Accessories", href: "/products?category=ACCESSORIES" },
      { label: "On Sale", href: "/products?sale=true" },
    ],
    "POLICIES": [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Return Policy", href: "/return-policy" },
    ],
  };

  const socials = [
    {
      label: "Instagram",
      href: "https://instagram.com/bikersbrain",
      Icon: Instagram,
    },
    {
      label: "Facebook",
      href: "https://facebook.com/bikersbrain",
      Icon: Facebook,
    },
    {
      label: "Twitter / X",
      href: "https://twitter.com/bikersbrain",
      Icon: Twitter,
    },
    {
      label: "YouTube",
      href: "https://youtube.com/bikersbrain",
      Icon: Youtube,
    },
  ];

  const trustBadges = [
    { Icon: ShieldCheck, title: "ISI & DOT Certified", desc: "Genuine Products Only" },
    { Icon: Truck, title: "Free Shipping", desc: "Orders Above ₹999" },
    { Icon: RotateCcw, title: "7-Day Returns", desc: "Hassle-Free Process" },
    { Icon: CreditCard, title: "Secure Payment", desc: "UPI, Cards, COD" },
  ];

  return (
    <footer className="bg-[hsl(0,0%,5%)] text-white border-t border-white/5">
      {/* Orange top accent */}
      <div className="h-1 w-full bg-primary" />

     

      {/* Main */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <img src={logo} alt="BikersBrain" className="h-10 w-auto" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-primary">BIKERS</span>{" "}
                <span className="text-white">BRAIN</span>
              </span>
            </Link>
            <p className="text-sm text-white/35 mb-5 max-w-xs leading-relaxed">
              India's trusted destination for premium motorcycle helmets & riding gear.
              ISI &amp; DOT certified. Riders serving riders.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2.5 mb-5">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Contact */}
            <div className="space-y-1.5 text-xs text-white/35">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-primary transition-colors">
                  {CONTACT_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                <a href={`tel:${CONTACT_INFO.phone}`} className="hover:text-primary transition-colors">
                  {CONTACT_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                <span>{CONTACT_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                <span>{CONTACT_INFO.workingHours}</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(sections).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold tracking-wider uppercase text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/35 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 bg-[hsl(0,0%,3%)]">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/20">
            &copy; {currentYear} BikersBrain. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy-policy" className="text-[11px] text-white/20 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-[11px] text-white/20 hover:text-primary transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/shipping-policy" className="text-[11px] text-white/20 hover:text-primary transition-colors">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
