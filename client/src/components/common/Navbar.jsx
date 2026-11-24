import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Scissors, Tv, UserCheck, ShieldCheck, UserPlus, Home } from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home },
    { to: '/join', label: t('nav.join', 'Join Queue'), icon: UserPlus },
    { to: '/reception', label: t('nav.reception', 'Reception'), icon: UserCheck },
    { to: '/display', label: t('nav.display', 'TV Display'), icon: Tv },
    { to: '/admin', label: t('nav.admin', 'Admin'), icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-salon-darker/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
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

        {/* Right Action: Language Switcher */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};
