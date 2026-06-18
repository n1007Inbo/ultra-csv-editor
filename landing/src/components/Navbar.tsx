import { useState, useEffect } from 'react';
import { Github, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <a href="#" className="navbar-logo">
          <span className="logo-icon">U</span>
          UltraCSV
        </a>

        <ul className={`navbar-links${mobileOpen ? ' open' : ''}`}>
          <li><a href="#features" onClick={() => setMobileOpen(false)}>Features</a></li>
          <li><a href="#download" onClick={() => setMobileOpen(false)}>Download</a></li>
          <li><a href="#compare" onClick={() => setMobileOpen(false)}>Compare</a></li>
        </ul>

        <a
          href="https://github.com/n1007Inbo/ultra-csv-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="navbar-github"
        >
          <Github size={16} />
          GitHub
        </a>

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}
