import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createWhatsAppUrl } from '../../utils/helpers';

export const FloatingWhatsApp: React.FC = () => {
  const { adminSettings } = useApp();

  const message = `Halo Admin PAYKAJASTIP, saya butuh informasi / bantuan layanan di Singkawang.`;
  const waUrl = createWhatsAppUrl(adminSettings.whatsapp_admin, message);

  return (
    <aside aria-label="Bantuan WhatsApp" className="fixed bottom-20 right-4 z-40">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat WhatsApp Admin PAYKAJASTIP"
        className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 sm:px-4 sm:py-2.5 rounded-full shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
      >
        <MessageCircle className="w-6 h-6 shrink-0 fill-current" />
        <span className="hidden sm:inline text-xs font-bold tracking-tight">
          WhatsApp Admin
        </span>
      </a>
    </aside>
  );
};
