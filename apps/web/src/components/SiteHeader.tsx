import { useState } from "react";
import { NavLink, useLocation } from "react-router";

import appIcon from "../assets/app-icon.png";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteHeader() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const location = useLocation();
  const activeNavigationIndex = Math.max(
    navItems.findIndex((item) =>
      item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href)
    ),
    0
  );

  return (
    <header className="site-header">
      <NavLink className="brand" to="/" aria-label="PROGRAMMERS-BADGE home">
        <img className="brand-mark" src={appIcon} alt="" aria-hidden="true" />
        <span>
          <strong>PROGRAMMERS-BADGE</strong>
        </span>
      </NavLink>
      <button
        className="menu-toggle"
        type="button"
        aria-controls="site-navigation"
        aria-expanded={isNavigationOpen}
        aria-label="Toggle navigation"
        onClick={() => {
          setIsNavigationOpen((currentValue) => !currentValue);
        }}
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        className={`site-nav active-index-${activeNavigationIndex}${
          isNavigationOpen ? " is-open" : ""
        }`}
        id="site-navigation"
        aria-label="primary navigation"
      >
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            onClick={() => {
              setIsNavigationOpen(false);
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
