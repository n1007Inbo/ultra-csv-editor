import React, { useState } from 'react';
import { X, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLicense: string | null;
  onActivate: (key: string) => boolean;
  onDeactivate: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  currentLicense,
  onActivate,
  onDeactivate,
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!licenseKey.trim()) {
      setError('Please enter a license key.');
      return;
    }

    const cleanedKey = licenseKey.trim().toUpperCase();
    if (!cleanedKey.startsWith('ULTRACSV-PRO-')) {
      setError('Invalid format. License keys start with "ULTRACSV-PRO-".');
      return;
    }

    const activated = onActivate(cleanedKey);
    if (activated) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError('Failed to activate. Please verify the license key.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '440px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} style={{ color: 'var(--accent)' }} />
            Subscription & License
          </h3>
          <button className="btn btn-icon-only" onClick={onClose} style={{ border: 'none', background: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1.25rem', padding: '1.5rem' }}>
          {currentLicense ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                UltraCSV Pro Activated
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Your copy of UltraCSV Editor is fully licensed under the Pro Subscription.
              </p>
              
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.85rem',
                  padding: '0.6rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-primary)',
                  marginBottom: '2rem',
                }}
              >
                Key: {currentLicense}
              </div>

              <button
                className="btn"
                onClick={() => {
                  onDeactivate();
                  onClose();
                }}
                style={{ width: '100%', border: '1px solid var(--danger)', color: 'var(--danger)' }}
              >
                Deactivate License
              </button>
            </div>
          ) : (
            <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Activate your Pro Subscription plan to unlock extreme streaming performance for 10GB+ files, interactive charts, and advanced filters.
              </p>

              {success ? (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid var(--success)',
                    color: 'var(--success)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={16} />
                  License activated successfully! Unlocking Pro features...
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      LICENSE KEY
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ULTRACSV-PRO-XXXXXX"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  {error && (
                    <div
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger)',
                        color: 'var(--danger)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <ShieldAlert size={16} />
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      Activate Key
                    </button>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                    Don't have a license key?{' '}
                    <a
                      href="https://landing-three-sigma-39.vercel.app#pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                    >
                      Choose a subscription plan
                    </a>
                  </p>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
