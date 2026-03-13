import React, { useState, useRef } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useClerk, SignedOut, SignedIn, UserButton } from "@clerk/clerk-react";
import logo from "../assets/logo.png";
import { useEffect } from "react";
import { User, Key, Menu, X } from "lucide-react";
const STORAGE_KEY = "doctorToken_v1";

const Navbar = () => {
  const [_isOpen, _setIsOpen] = useState(false);
  const [_showNavbar, _setShowNavbar] = useState(true);
  const [_lastScrollY, _setLastScrollY] = useState(0);
  const [_isDoctorLoggedIn, _setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });
  const _location = useLocation();
  const _navRef = useRef(null);
  const _clerk = useClerk();
  const _navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > _lastScrollY && currentScrollY > 80) {
        _setShowNavbar(false);
      } else {
        _setShowNavbar(true);
      }
      _setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [_lastScrollY]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        _setIsDoctorLoggedIn(Boolean(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        _isOpen &&
        _navRef.current &&
        !_navRef.current.contains(event.target)
      ) {
        _setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [_isOpen]);

  const _navItems = [
    { label: "Home", href: "/" },
    { label: "Doctors", href: "/doctors" },
    { label: "Services", href: "/services" },
    { label: "Appointments", href: "/appointments" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <div className={navbarStyles.navbarBorder}></div>

      <nav ref={_navRef}
        className={`${navbarStyles.navbarContainer} ${
          _showNavbar ? navbarStyles.navbarVisible : navbarStyles.navbarHidden
        }`}
      >
        <div className={navbarStyles.contentWrapper}>
          <div className={navbarStyles.flexContainer}>
            {/* Logo*/}
            <Link to="/" className={navbarStyles.logoLink}>
              <div className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoImageWrapper}>
                  <img
                    src={logo}
                    alt="logo"
                    className={navbarStyles.logoImage}
                  />
                </div>
              </div>

              <div className={navbarStyles.logoTextContainer}>
                <h1 className={navbarStyles.logoTitle}>MediCare</h1>
                <p className={navbarStyles.logoSubtitle}>
                  Your Health is Our Priority
                </p>
              </div>
            </Link>

            <div className={navbarStyles.desktopNav}>
              <div className={navbarStyles.navItemsContainer}>
                {_navItems.map((item) => {
                  const _isActive = _location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`${navbarStyles.navItem} ${
                        _isActive
                          ? navbarStyles.navItemActive
                          : navbarStyles.navItemInactive
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* right side */}

            <div className={navbarStyles.rightContainer}>
              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  className={navbarStyles.doctorAdminButton}
                >
                  <User className={navbarStyles.doctorAdminIcon} />
                  <span className={navbarStyles.doctorAdminText}>
                    Doctor Admin
                  </span>
                </Link>

                {/* Patient login */}

                <button
                  onClick={() => _clerk.openSignIn()}
                  className={navbarStyles.loginButton}
                >
                  <Key className={navbarStyles.loginIcon} />
                  Login
                </button>
              </SignedOut>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>

              {/* Mobile menu toggle */}
              <button
                onClick={() => _setIsOpen(!_isOpen)}
                className={navbarStyles.mobileToggle}
              >
                {_isOpen ? (
                  <X className={navbarStyles.toggleIcon} />
                ) : (
                  <Menu className={navbarStyles.toggleIcon} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {_isOpen && (
            <div className={navbarStyles.mobileMenu}>
              <div className={navbarStyles.navItemsContainer}>
                {_navItems.map((item) => {
                  const _isActive = _location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => _setIsOpen(false)}
                      className={`${navbarStyles.mobileMenuItem} ${
                        _isActive
                          ? navbarStyles.mobileMenuItemActive
                          : navbarStyles.mobileMenuItemInactive
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile buttons */}
              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  className={navbarStyles.mobileDoctorAdminButton}
                  onClick={() => _setIsOpen(false)}
                >
                  <User className={navbarStyles.doctorAdminIcon} />
                  <span>Doctor Admin</span>
                </Link>

                <div className={navbarStyles.mobileLoginContainer}>
                  <button
                    onClick={() => _clerk.openSignIn()}
                    className={navbarStyles.mobileLoginButton}
                  >
                    <Key className={navbarStyles.loginIcon} />
                    <span>Login</span>
                  </button>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="flex justify-center p-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          )}
        </div>

        <style>{navbarStyles.animationStyles}</style>
      </nav>
    </>
  );
};

export default Navbar;
