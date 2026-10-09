import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Store as StoreIcon,
  Navigation,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { calculateDistanceKm, formatRupiah } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number;
  initialLng: number;
  initialAddress?: string;
  storeLat?: number;
  storeLng?: number;
  storeName?: string;
  onSelectLocation: (lat: number, lng: number, address: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialAddress = '',
  storeLat,
  storeLng,
  storeName,
  onSelectLocation,
}) => {
  const { adminSettings, rates } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const storeMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);

  const [currentLat, setCurrentLat] = useState(initialLat || 0.9056);
  const [currentLng, setCurrentLng] = useState(initialLng || 108.9868);
  const [addressInput, setAddressInput] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const activeRate = rates[0] || {
    base_rate: adminSettings.base_delivery_fee || 10000,
    per_km_rate: adminSettings.per_km_fee || 3000,
    minimum_rate: 15000,
    service_fee: adminSettings.service_fee || 2000,
  };

  const distanceKm = storeLat && storeLng
    ? calculateDistanceKm(storeLat, storeLng, currentLat, currentLng)
    : 0;

  const estimatedDeliveryFee = storeLat && storeLng
    ? Math.max(activeRate.minimum_rate, activeRate.base_rate + Math.ceil(distanceKm) * activeRate.per_km_rate)
    : activeRate.base_rate;

  // Initialize Map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        return;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Store Marker (if store coords provided)
      if (storeLat && storeLng) {
        const storeIcon = L.divIcon({
          html: `
            <div class="flex flex-col items-center">
              <div class="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-bold shadow-md whitespace-nowrap mb-1">
                ${storeName || 'Toko'}
              </div>
              <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">
                🏪
              </div>
            </div>
          `,
          className: 'store-custom-marker',
          iconSize: [60, 48],
          iconAnchor: [30, 48],
        });

        storeMarkerRef.current = L.marker([storeLat, storeLng], {
          icon: storeIcon,
        }).addTo(map);
      }

      // Customer Destination Marker (Draggable)
      const destIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-md whitespace-nowrap mb-1">
              Titik Antar
            </div>
            <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs animate-bounce">
              📍
            </div>
          </div>
        `,
        className: 'dest-custom-marker',
        iconSize: [60, 48],
        iconAnchor: [30, 48],
      });

      const destMarker = L.marker([currentLat, currentLng], {
        icon: destIcon,
        draggable: true,
      }).addTo(map);

      destMarker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        handleUpdateCoords(newPos.lat, newPos.lng);
      });

      map.on('click', (e) => {
        destMarker.setLatLng(e.latlng);
        handleUpdateCoords(e.latlng.lat, e.latlng.lng);
      });

      destMarkerRef.current = destMarker;

      // Draw polyline connecting store to destination
      if (storeLat && storeLng) {
        lineRef.current = L.polyline(
          [
            [storeLat, storeLng],
            [currentLat, currentLng],
          ],
          { color: '#0284c7', weight: 3, dashArray: '6, 8' }
        ).addTo(map);
      }

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  const handleUpdateCoords = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);

    // Update polyline
    if (lineRef.current && storeLat && storeLng) {
      lineRef.current.setLatLngs([
        [storeLat, storeLng],
        [lat, lng],
      ]);
    }

    // Attempt reverse geocoding via Nominatim
    setIsGeocoding(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'id' } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.display_name) {
          const shortAddr = data.name || data.address?.road || data.display_name.split(',')[0];
          const district = data.address?.suburb || data.address?.city_district || 'Singkawang';
          setAddressInput(`${shortAddr}, ${district}, Singkawang`);
        }
      })
      .catch(() => {
        // Fallback: keep manual address
      })
      .finally(() => {
        setIsGeocoding(false);
      });
  };

  // Search Address via Nominatim
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery}, Singkawang, Kalimantan Barat`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&limit=1`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        setAddressInput(item.display_name);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16);
          if (destMarkerRef.current) {
            destMarkerRef.current.setLatLng([newLat, newLng]);
          }
          if (lineRef.current && storeLat && storeLng) {
            lineRef.current.setLatLngs([
              [storeLat, storeLng],
              [newLat, newLng],
            ]);
          }
        }
      } else {
        alert('Lokasi tidak ditemukan di Singkawang. Anda dapat menggeser pin di peta secara manual.');
      }
    } catch {
      alert('Gagal melakukan pencarian alamat. Silakan geser pin di peta.');
    } finally {
      setIsSearching(false);
    }
  };

  // Use GPS location
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung GPS.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLng(lng);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          if (destMarkerRef.current) {
            destMarkerRef.current.setLatLng([lat, lng]);
          }
          if (lineRef.current && storeLat && storeLng) {
            lineRef.current.setLatLngs([
              [storeLat, storeLng],
              [lat, lng],
            ]);
          }
        }
        handleUpdateCoords(lat, lng);
      },
      (err) => {
        setGpsLoading(false);
        alert('Tidak dapat mendeteksi lokasi GPS: ' + err.message);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    const finalAddress = addressInput.trim() || `Titik Koordinat [${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}] Singkawang`;
    onSelectLocation(currentLat, currentLng, finalAddress);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Pilih Titik Pengantaran Kurir
              </h3>
              <p className="text-[10px] text-slate-500">
                Geser pin 📍 atau ketuk peta Singkawang untuk menentukan lokasi rumah Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & GPS Quick Buttons */}
        <div className="p-3 bg-white border-b border-slate-100 space-y-2 shrink-0">
          <form onSubmit={handleSearchAddress} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari jalan / kelurahan di Singkawang..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
            </button>
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={gpsLoading}
              className="px-2.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition"
              title="Gunakan Lokasi GPS Saat Ini"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS</span>
            </button>
          </form>
        </div>

        {/* Leaflet Map Body */}
        <div className="relative flex-1 min-h-[280px] sm:min-h-[340px] bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

          {/* Floating Distance Badge */}
          {storeLat && storeLng && (
            <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-xs border border-slate-200 text-slate-800 text-[11px] font-bold shadow-md flex items-center gap-2">
              <span className="text-sky-600">Jarak: {distanceKm} km</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700">Estimasi Ongkir: {formatRupiah(estimatedDeliveryFee)}</span>
            </div>
          )}

          {isGeocoding && (
            <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-semibold flex items-center gap-1.5 shadow-md">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Mencari alamat titik...</span>
            </div>
          )}
        </div>

        {/* Footer Selected Address & Confirm Button */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 space-y-2.5 shrink-0">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Alamat Pengantaran Terpilih:
            </label>
            <textarea
              rows={2}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Detail alamat (nama jalan, patokan rumah, warna pagar)..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:border-sky-500"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>Koordinat: [{currentLat.toFixed(5)}, {currentLng.toFixed(5)}]</span>
              <span>OpenStreetMap Singkawang</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Pilih Titik Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
