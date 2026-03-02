import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/bikersbrain_logo_only_brain.png";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight, Heart, LogOut, LayoutDashboard, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { productsApi } from "@/lib/api";

interface NavChild {
  label: string;
  href: string;
}

interface NavParent {
  label: string;
  href: string;
  children?: NavChild[];
}

interface NavItem {
  label: string;
  href: string;
  children?: NavParent[];
}

const STATIC_NAV_FALLBACK: NavItem[] = [
  {
    label: "Helmets",
    href: "/products",
    children: [
      { label: "Full Face", href: "/products?category=FULL_FACE" },
      { label: "Modular", href: "/products?category=MODULAR" },
      { label: "Open Face", href: "/products?category=OPEN_FACE" },
      { label: "Half Helmets", href: "/products?category=HALF_FACE" },
      { label: "Off-Road", href: "/products?category=OFF_ROAD" },
    ],
  },
  {
    label: "Riding Gear",
    href: "/products",
    children: [
      { label: "Jackets", href: "/products?category=JACKETS" },
      { label: "Gloves", href: "/products?category=GLOVES" },
      { label: "Boots", href: "/products?category=BOOTS" },
      { label: "Riding Pants", href: "/products?category=RIDING_PANTS" },
    ],
  },
  {
    label: "Accessories",
    href: "/products",
    children: [
      { label: "Accessories", href: "/products?category=ACCESSORIES" },
      { label: "Parts", href: "/products?category=PARTS" },
      { label: "Luggage", href: "/products?category=LUGGAGE" },
      { label: "Electronics", href: "/products?category=ELECTRONICS" },
    ],
  },
  { label: "Brands", href: "/products" },
  { label: "Sale", href: "/products?sale=true" },
];

// Duration (ms) before submenu closes when mouse leaves
const SUBMENU_DELAY = 150;

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [mobileSubExpanded, setMobileSubExpanded] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(STATIC_NAV_FALLBACK);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const submenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories and build nav groups dynamically
  useEffect(() => {
    productsApi.getCategories().then((res) => {
      if (!res.success || !Array.isArray(res.data) || res.data.length === 0) return;
      const cats = res.data as { id: string; value: string; label: string; group: string; parentId: string | null; sortOrder: number; groupSortOrder: number }[];

      // Separate top-level and child categories
      const topLevel = cats.filter(c => !c.parentId);
      const children = cats.filter(c => c.parentId);

      // Build group map with top-level categories
      const groupMap = new Map<string, { id: string; value: string; label: string; sortOrder: number }[]>();
      const groupOrder = new Map<string, number>();
      for (const cat of topLevel) {
        if (!groupMap.has(cat.group)) {
          groupMap.set(cat.group, []);
          groupOrder.set(cat.group, cat.groupSortOrder);
        }
        groupMap.get(cat.group)!.push({ id: cat.id, value: cat.value, label: cat.label, sortOrder: cat.sortOrder });
      }

      // Build parent-to-children map
      const childMap = new Map<string, { value: string; label: string; sortOrder: number }[]>();
      for (const ch of children) {
        if (!childMap.has(ch.parentId!)) childMap.set(ch.parentId!, []);
        childMap.get(ch.parentId!)!.push({ value: ch.value, label: ch.label, sortOrder: ch.sortOrder });
      }

      // Ensure child-only groups also appear
      for (const ch of children) {
        if (!groupMap.has(ch.group)) {
          groupMap.set(ch.group, []);
          groupOrder.set(ch.group, ch.groupSortOrder);
        }
      }

      // Sort groups by groupSortOrder, then alphabetically
      const sortedGroupNames = [...groupMap.keys()].sort((a, b) => {
        const aO = groupOrder.get(a) ?? 0;
        const bO = groupOrder.get(b) ?? 0;
        return aO - bO || a.localeCompare(b);
      });

      const dynamic: NavItem[] = [];
      for (const group of sortedGroupNames) {
        const items = groupMap.get(group)!.sort((a, b) => a.sortOrder - b.sortOrder);
        const navParents: NavParent[] = [];

        for (const item of items) {
          const kids = childMap.get(item.id);
          const navChildren: NavChild[] | undefined = kids
            ? kids.sort((a, b) => a.sortOrder - b.sortOrder).map(k => ({ label: k.label, href: `/products?category=${k.value}` }))
            : undefined;
          navParents.push({ label: item.label, href: `/products?category=${item.value}`, children: navChildren });
        }

        // Include orphaned children as top-level in this group
        const groupChildOnly = children.filter(c => c.group === group && !items.some(i => i.id === c.parentId));
        for (const orphan of groupChildOnly.sort((a, b) => a.sortOrder - b.sortOrder)) {
          navParents.push({ label: orphan.label, href: `/products?category=${orphan.value}` });
        }

        if (navParents.length === 0) continue;

        dynamic.push({
          label: group,
          href: `/products?category=${navParents[0].href.split('=')[1]}`,
          children: navParents,
        });
      }

      // Add static items at the end
      dynamic.push({ label: "Brands", href: "/products" });
      dynamic.push({ label: "Sale", href: "/products?sale=true" });

      setNavItems(dynamic);
    }).catch(() => {});
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between text-primary-foreground text-xs font-barlow-condensed tracking-wide">
          {/* Contact info */}
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="tel:+919762163742"
              className="flex items-center gap-1 hover:opacity-80 transition whitespace-nowrap"
            >
              <Phone size={11} />
              <span>+91 97621 63742</span>
            </a>
            <a
              href="https://maps.app.goo.gl/BBhXSCq7Gr4uBQuFA"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 hover:opacity-80 transition whitespace-nowrap"
            >
              <MapPin size={11} />
              <span>Find Our Store</span>
            </a>
          </div>
          {/* Right links */}
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden lg:inline opacity-70">FREE SHIPPING OVER ₹2,999</span>
            <Link to="/track-order" className="hover:underline whitespace-nowrap">Track Order</Link>
            <Link to="/contact" className="hidden md:inline hover:underline">Help Center</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5">
            <img
              src={logo}
              alt="BikersBrain"
              className="hidden sm:block h-12 md:h-14 w-auto object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="flex items-baseline gap-0">
                <span className="text-white font-black text-xl md:text-2xl italic tracking-tight uppercase">BIKERS</span>
                <span className="text-primary font-black text-xl md:text-2xl italic tracking-tight uppercase">BRAIN</span>
              </span>
              <span className="text-muted-foreground font-semibold text-[10px] md:text-xs italic tracking-widest uppercase mt-0.5">
                Spare and Accessories
              </span>
            </span>
          </Link>

          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Input
                placeholder="Search parts, helmets, oils, accessories..."
                className="bg-secondary border-none pr-10 h-10 text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                setSearchOpen(!searchOpen);
                setTimeout(() => searchRef.current?.focus(), 100);
              }}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="hidden md:flex relative" asChild>
              <Link to="/wishlist">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* User / Account */}
            <div className="relative" ref={userMenuRef}>
              {isAuthenticated ? (
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                    {(user?.fullName || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium max-w-[90px] truncate">
                    {user?.fullName?.split(" ")[0]}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden md:block", userMenuOpen && "rotate-180")} />
                </button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
                  <User className="h-5 w-5" />
                </Button>
              )}

              <AnimatePresence>
                {userMenuOpen && isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-2xl w-56 overflow-hidden z-50"
                  >
                    {/* User info header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-secondary border-b border-border">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-base font-bold flex-shrink-0">
                        {(user?.fullName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user?.fullName || "User"}</p>
                        {user?.email && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1.5">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        to="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary hover:text-primary transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        My Account
                      </Link>
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary hover:text-primary transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        Wishlist
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border py-1.5">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container mx-auto px-4 py-3">
                <div className="relative">
                  <Input
                    ref={searchRef}
                    placeholder="Search parts, helmets, oils, accessories..."
                    className="bg-secondary border-none pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:block bg-secondary/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-0">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => { setActiveDropdown(item.label); setActiveSubmenu(null); if (submenuTimer.current) clearTimeout(submenuTimer.current); }}
                onMouseLeave={() => { setActiveDropdown(null); setActiveSubmenu(null); if (submenuTimer.current) clearTimeout(submenuTimer.current); }}
              >
                <Link
                  to={item.href}
                  className={`flex items-center gap-1 px-4 py-3 text-sm font-barlow-condensed font-semibold tracking-wider uppercase transition-colors hover:text-primary ${
                    item.label === "Sale" ? "text-primary" : "text-foreground"
                  }`}
                >
                  {item.label}
                  {item.children && <ChevronDown className="h-3 w-3" />}
                </Link>
                {item.children && activeDropdown === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 flex z-50"
                  >
                    {/* Left panel — parent categories */}
                    <div className="bg-card border border-border rounded-l-lg shadow-xl min-w-[240px] py-2">
                      {item.children.map((parent) => {
                        const hasKids = parent.children && parent.children.length > 0;
                        const isActive = activeSubmenu === parent.label;
                        return (
                          <div
                            key={parent.href}
                            className="relative"
                            onMouseEnter={() => {
                              if (submenuTimer.current) clearTimeout(submenuTimer.current);
                              setActiveSubmenu(parent.label);
                            }}
                            onMouseLeave={() => {
                              submenuTimer.current = setTimeout(() => setActiveSubmenu(null), SUBMENU_DELAY);
                            }}
                          >
                            <Link
                              to={parent.href}
                              className={cn(
                                "flex items-center justify-between px-5 py-2.5 text-sm transition-colors",
                                isActive ? "bg-secondary text-primary" : "text-foreground hover:bg-secondary/60 hover:text-primary"
                              )}
                              onClick={() => { setActiveDropdown(null); setActiveSubmenu(null); }}
                            >
                              <span className="font-medium">{parent.label}</span>
                              {hasKids && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            </Link>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right panel — child categories (shown when parent is hovered) */}
                    {item.children.some(p => p.label === activeSubmenu && p.children?.length) && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.12 }}
                        className="bg-card border border-l-0 border-border rounded-r-lg shadow-xl min-w-[220px] py-2"
                        onMouseEnter={() => { if (submenuTimer.current) clearTimeout(submenuTimer.current); }}
                        onMouseLeave={() => { submenuTimer.current = setTimeout(() => setActiveSubmenu(null), SUBMENU_DELAY); }}
                      >
                        {item.children
                          .find(p => p.label === activeSubmenu)
                          ?.children?.map((child) => (
                            <Link
                              key={child.href}
                              to={child.href}
                              className="block px-5 py-2.5 text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                              onClick={() => { setActiveDropdown(null); setActiveSubmenu(null); }}
                            >
                              {child.label}
                            </Link>
                          ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-barlow-condensed font-semibold tracking-wider uppercase transition-colors ${
                      item.label === "Sale" ? "text-primary" : "text-foreground"
                    }`}
                    onClick={() => {
                      if (!item.children) {
                        navigate(item.href);
                        setMobileOpen(false);
                        return;
                      }
                      setMobileExpanded(mobileExpanded === item.label ? null : item.label);
                      setMobileSubExpanded(null);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.children && (
                      <ChevronDown className={cn("h-4 w-4 transition-transform", mobileExpanded === item.label && "rotate-180")} />
                    )}
                  </button>
                  {/* Expanded parent list */}
                  <AnimatePresence>
                    {item.children && mobileExpanded === item.label && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 pb-2 space-y-0.5">
                          {item.children.map((parent) => (
                            <div key={parent.href}>
                              {parent.children && parent.children.length > 0 ? (
                                <>
                                  <button
                                    className={cn(
                                      "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors rounded-md",
                                      mobileSubExpanded === parent.label ? "text-primary bg-secondary" : "text-muted-foreground hover:bg-secondary/60 hover:text-primary"
                                    )}
                                    onClick={() => setMobileSubExpanded(mobileSubExpanded === parent.label ? null : parent.label)}
                                  >
                                    <span>{parent.label}</span>
                                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", mobileSubExpanded === parent.label && "rotate-90")} />
                                  </button>
                                  <AnimatePresence>
                                    {mobileSubExpanded === parent.label && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pl-5 pb-1 space-y-0.5">
                                          {parent.children.map((child) => (
                                            <Link
                                              key={child.href}
                                              to={child.href}
                                              className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                                              onClick={() => { setMobileOpen(false); setMobileExpanded(null); setMobileSubExpanded(null); }}
                                            >
                                              {child.label}
                                            </Link>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </>
                              ) : (
                                <Link
                                  to={parent.href}
                                  className="block px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-primary rounded-md transition-colors"
                                  onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                                >
                                  {parent.label}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              <div className="h-px bg-border my-2" />
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    className="block px-3 py-2.5 text-sm font-barlow-condensed font-semibold tracking-wider uppercase hover:text-primary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    to="/wishlist"
                    className="block px-3 py-2.5 text-sm font-barlow-condensed font-semibold tracking-wider uppercase hover:text-primary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <button
                    className="block w-full text-left px-3 py-2.5 text-sm font-barlow-condensed font-semibold tracking-wider uppercase text-destructive hover:text-destructive/80 transition-colors"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2.5 text-sm font-barlow-condensed font-semibold tracking-wider uppercase hover:text-primary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2.5 text-sm font-barlow-condensed font-semibold tracking-wider uppercase hover:text-primary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
