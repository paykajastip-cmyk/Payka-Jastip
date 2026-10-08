import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={install}
          title="Install Aplikasi PAYKAJASTIP"
          className="flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-700 hover:to-sky-800 transition active:scale-98"
      >
        <Download className="w-4 h-4" />
        <span>Pasang Aplikasi PAYKAJASTIP (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 font-semibold transition active:scale-95 ${
            compact
              ? 'rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 text-xs border border-slate-300'
              : 'rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 text-sm shadow-md'
          }`}
        >
          <Smartphone className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          <span>Install di iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
                    PK
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Install di iOS / iPhone</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Buka halaman ini di browser <strong>Safari</strong> lalu ketuk tombol <strong>Share (Bagikan)</strong> di bawah.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Gulir ke bawah dan pilih opsi <strong>Add to Home Screen (Tambah ke Layar Utama)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Kini PAYKAJASTIP terpasang seperti aplikasi native di ponsel Anda!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
