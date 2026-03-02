import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ExternalLink,
} from "lucide-react";
import logo from "@/assets/bikersbrain_logo_only_brain.png";
import { newsletterApi } from "@/lib/api";

const CONTACT = {
  email: "bikersbrain.official@gmail.com",
  phone: "+91 97621 63742",
  address: "Shop No. 7, Highway Chowk, NDA Rd, Warje, Pune, Maharashtra 411058",
  mapLink: "https://maps.app.goo.gl/BBhXSCq7Gr4uBQuFA",
};

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/shree_om_automobiles",
    Icon: Instagram,
    color: "hover:text-pink-500",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCsXWMuXV_458D_J3I_UUOJw",
    Icon: Youtube,
    color: "hover:text-red-500",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/shreeomauto",
    Icon: Facebook,
    color: "hover:text-blue-500",
  },
];

const USEFUL_LINKS = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Return & Refund Policy", href: "/return-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "FAQ", href: "/contact" },
];

const CUSTOMER_CARE = [
  { label: "Track Your Order", href: "/track-order" },
  { label: "Contact Us", href: "/contact" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "All Products", href: "/products" },
];

const SHOP_HOURS = {
  days: "All Days Open",
  hours: "09:00 AM – 09:00 PM",
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribeMsg, setSubscribeMsg] = useState("");

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await newsletterApi.subscribe(email.trim());
      setSubscribeMsg("Thank you for subscribing!");
      setEmail("");
    } catch {
      setSubscribeMsg("Could not subscribe. Try again later.");
    }
    setTimeout(() => setSubscribeMsg(""), 5000);
  };

  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Orange top accent */}
      <div className="h-1 w-full bg-primary" />

      {/* Main footer */}
      <div className="container mx-auto px-4 py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Column 1: Brand + Address + Contact ── */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <img src={logo} alt="BikersBrain" className="h-10 w-auto" />
              <span className="text-lg font-bold tracking-tight font-oswald">
                <span className="text-primary">BIKERS</span>{" "}
                <span className="text-white">BRAIN</span>
              </span>
            </Link>

            <p className="text-[13px] text-white/40 leading-relaxed mb-5">
              A venture by{" "}
              <span className="text-primary font-semibold">Shree Om Automobiles</span>
              &nbsp;— your one-stop shop for two-wheeler spare parts, riding gear &amp; accessories.
            </p>

            {/* Contact details */}
            <div className="space-y-3 text-sm text-white/50">
              <a
                href={CONTACT.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 group"
              >
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="leading-snug group-hover:text-primary transition-colors">
                  {CONTACT.address}
                  <ExternalLink className="inline h-3 w-3 ml-1 opacity-40 group-hover:opacity-100" />
                </span>
              </a>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href={`tel:${CONTACT.phone}`} className="hover:text-primary transition-colors">
                  {CONTACT.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href={`mailto:${CONTACT.email}`} className="hover:text-primary transition-colors">
                  {CONTACT.email}
                </a>
              </div>
            </div>

            {/* Social icons */}
            <div className="mt-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-white/60 mb-3">
                Follow Us On
              </p>
              <div className="flex items-center gap-2">
                {SOCIALS.map(({ label, href, Icon, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 ${color} hover:border-primary/40 hover:bg-primary/10 transition-all`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Column 2: Useful Links ── */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-white mb-5 font-oswald">
              Useful Links
            </h4>
            <ul className="space-y-3">
              {USEFUL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/45 hover:text-primary hover:translate-x-1 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Customer Care ── */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-white mb-5 font-oswald">
              Customer Care
            </h4>
            <ul className="space-y-3">
              {CUSTOMER_CARE.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/45 hover:text-primary hover:translate-x-1 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Shop hours */}
            <div className="mt-8">
              <h4 className="text-sm font-bold tracking-wider uppercase text-white mb-3 font-oswald">
                Working Hours
              </h4>
              <div className="flex items-start gap-2.5 text-sm text-white/45">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white/60 font-medium">{SHOP_HOURS.days}</p>
                  <p>{SHOP_HOURS.hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 4: Newsletter ── */}
          <div>
            <h4 className="text-sm font-bold tracking-wider uppercase text-white mb-3 font-oswald">
              Newsletter
            </h4>
            <p className="text-sm text-white/40 mb-4 leading-relaxed">
              Subscribe for the latest deals, new arrivals &amp; exclusive offers.
            </p>
            <form onSubmit={handleNewsletter} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-l-lg text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-black rounded-r-lg transition-colors"
                aria-label="Subscribe"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {subscribeMsg && (
              <p className={`text-xs mt-2 ${subscribeMsg.includes("Thank") ? "text-green-400" : "text-red-400"}`}>
                {subscribeMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 bg-[#060606]">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25 text-center md:text-left">
            &copy; {currentYear} BikersBrain by Shree Om Automobiles — All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link to="/terms" className="text-xs text-white/25 hover:text-primary transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/contact" className="text-xs text-white/25 hover:text-primary transition-colors">
              Store Location
            </Link>
            <Link to="/privacy-policy" className="text-xs text-white/25 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
