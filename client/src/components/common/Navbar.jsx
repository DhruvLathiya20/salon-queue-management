import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Scissors, Tv, UserCheck, ShieldCheck, UserPlus, Home, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home },
    { to: '/join', label: t('nav.join', 'Join Queue'), icon: UserPlus },
    { to: '/reception', label: t('nav.reception', 'Reception'), icon: UserCheck },
    { to: '/display', label: t('nav.display', 'TV Display'), icon: Tv },
    { to: '/admin', label: t('nav.admin', 'Admin'), icon: ShieldCheck },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-salon-darker/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-salon-gold to-salon-goldHover flex items-center justify-center text-black shadow-gold-glow group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-salon-gold transition-colors">
              {t('brand.name', 'Elite Salon')}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-salon-gold font-medium">
              Queue System
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-salon-gold bg-salon-gold/10 border border-salon-gold/30'
                    : 'text-salon-textSecondary hover:text-white hover:bg-salon-surface/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Language Switcher + Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-salon-surface/60 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-salon-gold" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-salon-darker/98 px-4 pt-3 pb-4 space-y-1 animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? 'text-salon-gold bg-salon-gold/10 border border-salon-gold/30'
                    : 'text-salon-textSecondary hover:text-white hover:bg-salon-surface/50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
