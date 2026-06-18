import { Check, HelpCircle, Shield, Zap } from 'lucide-react';

export default function Pricing() {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Pricing</span>
          <h2 className="section-title">
            Simple, <span className="gradient-text">transparent</span> plans
          </h2>
          <p className="section-sub">
            Choose the plan that fits your dataset. Start free and upgrade to unlock extreme performance.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="pricing-card glass">
            <div className="pricing-header">
              <h3>Free Plan</h3>
              <p>For casual CSV view and simple data edits.</p>
              <div className="pricing-price">
                <span className="price-symbol">$</span>
                <span className="price-amount">0</span>
                <span className="price-period">/ forever</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>
                <Check size={16} className="check-icon" />
                <span>Up to 100,000 rows</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span>Zebra row striping</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span>Basic column filtering</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span>Keyboard navigation</span>
              </li>
            </ul>
            <a href="#download" className="btn btn-secondary pricing-btn">
              Get Started
            </a>
          </div>

          {/* Pro Plan */}
          <div className="pricing-card glass popular">
            <div className="popular-badge">Most Popular</div>
            <div className="pricing-header">
              <h3>Pro Plan</h3>
              <p>For data professionals and heavy CSV wrangling.</p>
              <div className="pricing-price">
                <span className="price-symbol">$</span>
                <span className="price-amount">9</span>
                <span className="price-period">/ month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>
                <Check size={16} className="check-icon cyan" />
                <strong>10GB+ CSV files streaming parser</strong>
              </li>
              <li>
                <Check size={16} className="check-icon cyan" />
                <strong>Interactive SVG Charts & Trend lines</strong>
              </li>
              <li>
                <Check size={16} className="check-icon cyan" />
                <strong>Command Palette fuzzy shortcuts</strong>
              </li>
              <li>
                <Check size={16} className="check-icon cyan" />
                <strong>Native desktop app installer</strong>
              </li>
              <li>
                <Check size={16} className="check-icon cyan" />
                <strong>Recent files workspace tracking</strong>
              </li>
            </ul>
            <a href="#download" className="btn btn-primary pricing-btn">
              <Zap size={16} />
              Upgrade to Pro
            </a>
          </div>

          {/* Enterprise Plan */}
          <div className="pricing-card glass">
            <div className="pricing-header">
              <h3>Enterprise</h3>
              <p>For teams needing centralized control and custom features.</p>
              <div className="pricing-price">
                <span className="price-amount">Custom</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>
                <Check size={16} className="check-icon" />
                <span>All Pro features included</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span>Volume licensing keys</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span>Dedicated support SLA</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span>Custom integrations & custom formats</span>
              </li>
            </ul>
            <a href="mailto:support@ultracsv.com" className="btn btn-secondary pricing-btn">
              <Shield size={16} />
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
