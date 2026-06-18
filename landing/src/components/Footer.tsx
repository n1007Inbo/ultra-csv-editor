import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-left">
          &copy; {new Date().getFullYear()} Ultra CSV Editor. All rights reserved.
        </div>
        <div className="footer-right">
          <a
            href="https://github.com/n1007Inbo/ultra-csv-editor"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={16} />
            GitHub
          </a>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Built with <span className="footer-heart">❤️</span> for data people
          </span>
        </div>
      </div>
    </footer>
  );
}
