"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  HeartPulse,
  House,
  Info,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Newspaper,
  X
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const exploreItems = [
  { href: "/map", label: "Map", icon: Map },
  { href: "/trends", label: "Trends", icon: BarChart3 },
  { href: "/cities", label: "Cities", icon: Building2 },
  { href: "/health", label: "Health", icon: HeartPulse }
];

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/insights", label: "Insights", icon: Newspaper },
  { href: "/about", label: "About", icon: Info }
];

export function BrandedNavbar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const exploreActive = pathname === "/map" || pathname === "/trends" || pathname === "/cities" || pathname === "/health";
  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    if (!exploreOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!exploreRef.current?.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExploreOpen(false);
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [exploreOpen]);

  useEffect(() => {
    setExploreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    const focusTimer = window.setTimeout(() => mobileCloseRef.current?.focus(), 0);
    document.body.classList.add("mobile-nav-open");
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove("mobile-nav-open");
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 961px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setMobileOpen(false);
    };

    closeOnDesktop();
    desktopQuery.addEventListener("change", closeOnDesktop);

    return () => {
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  return (
    <div className={`home-sticky-nav ${className}`.trim()}>
      <div className="home-beta">
        <div className="home-beta-inner">
          <span className="home-beta-pill">Beta 1.0</span>
          <p>
            <span>CLeNE is currently in beta. Your feedback helps us improve city-level NO{"\u2082"} exposure intelligence.</span>
          </p>
          <Link className="home-feedback" href="/#feedback">
            <MessageCircle size={18} aria-hidden />
            <span>Submit Feedback</span>
          </Link>
        </div>
      </div>

      <header className="home-header">
        <div className="home-header-inner">
          <Link className="home-logo" href="/" aria-label="CLeNE home">
            <Image
              src="/clene-logo.jpeg"
              alt="CLeNE City-Level NO2 Exposure Intelligence"
              width={324}
              height={103}
              priority
            />
          </Link>

          <nav className="home-nav" aria-label="CLeNE navigation">
            {navItems.slice(0, 2).map((item) => (
              <Link className={pathname === item.href ? "home-nav-link active" : "home-nav-link"} href={item.href} key={item.href}>
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="home-nav-item" ref={exploreRef}>
              <button
                aria-controls="home-explore-menu"
                aria-expanded={exploreOpen}
                className={exploreActive ? "home-nav-link home-nav-button active" : "home-nav-link home-nav-button"}
                type="button"
                onClick={() => setExploreOpen((open) => !open)}
              >
                <span>Explore</span>
                <ChevronDown className={exploreOpen ? "open" : ""} size={16} aria-hidden />
              </button>

              {exploreOpen ? (
                <div className="home-explore-menu" id="home-explore-menu" role="menu">
                  {exploreItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        className={pathname === item.href ? "home-explore-menu-link active" : "home-explore-menu-link"}
                        href={item.href}
                        key={item.href}
                        role="menuitem"
                        onClick={() => setExploreOpen(false)}
                      >
                        <Icon size={17} aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {navItems.slice(2).map((item) => (
              <Link className={pathname === item.href ? "home-nav-link active" : "home-nav-link"} href={item.href} key={item.href}>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="home-header-actions">
            <Link className={pathname === "/contact" ? "home-contact active" : "home-contact"} href="/contact">
              <Mail size={21} aria-hidden />
              <span>Contact</span>
            </Link>
            <ThemeToggle className="home-theme-toggle" />
          </div>

          <button
            aria-controls="mobile-nav-drawer"
            aria-expanded={mobileOpen}
            aria-label="Open navigation menu"
            className="home-mobile-menu-button"
            type="button"
            onClick={() => {
              setExploreOpen(false);
              setMobileOpen(true);
            }}
          >
            <Menu size={24} aria-hidden />
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="mobile-nav-layer open">
          <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation menu" onClick={closeMobileMenu} />
          <aside
            aria-label="Mobile navigation"
            aria-modal="true"
            className="mobile-nav-drawer"
            id="mobile-nav-drawer"
            role="dialog"
          >
            <header className="mobile-nav-header">
              <Link className="mobile-nav-logo" href="/" aria-label="CLeNE home" onClick={closeMobileMenu}>
                <Image
                  src="/clene-logo.jpeg"
                  alt="CLeNE City-Level NO2 Exposure Intelligence"
                  width={210}
                  height={67}
                />
              </Link>
              <button
                className="mobile-nav-close"
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMobileMenu}
                ref={mobileCloseRef}
              >
                <X size={22} aria-hidden />
              </button>
            </header>

            <nav className="mobile-nav-list" aria-label="Primary mobile navigation">
              <span className="mobile-nav-label">Platform</span>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    className={pathname === item.href ? "mobile-nav-link active" : "mobile-nav-link"}
                    href={item.href}
                    key={item.href}
                    onClick={closeMobileMenu}
                  >
                    <Icon size={20} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <span className="mobile-nav-label">Explore</span>
              {exploreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    className={pathname === item.href ? "mobile-nav-link active" : "mobile-nav-link"}
                    href={item.href}
                    key={item.href}
                    onClick={closeMobileMenu}
                  >
                    <Icon size={20} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mobile-nav-actions">
              <Link className="mobile-nav-action primary" href="/contact" onClick={closeMobileMenu}>
                <Mail size={18} aria-hidden />
                <span>Contact</span>
              </Link>
              <ThemeToggle className="mobile-nav-theme-toggle" />
              <Link className="mobile-nav-action" href="/#feedback" onClick={closeMobileMenu}>
                <MessageCircle size={18} aria-hidden />
                <span>Submit Feedback</span>
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
