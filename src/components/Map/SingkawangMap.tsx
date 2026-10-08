import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Search,
  Navigation,
  MapPin,
  Store as StoreIcon,
  Phone,
  Clock,
  Compass,
  Layers,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Store, OsmPlace } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calculateDistanceKm,
  getGoogleMapsNavUrl,
  getWazeNavUrl,
  createWhatsAppUrl,
} from '../../utils/helpers';

interface SingkawangMapProps {
  onSelectStore?: (store: Store) => void;
  selectedStoreId?: string;
  adminMode?: boolean;
  onCoordinateChange?: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

// Preset verified places from OpenStreetMap in Singkawang for instant offline/online map exploration
const SINGKAWANG_OSM_POINTS: OsmPlace[] = [
  {
    id: 'osm-1',
    name: 'Vihara Tri Dharma Bumi Raya (Pusat Kota)',
    category: 'Tempat Ibadah & Wisata',
    address: 'Jl. Sejahtera No. 28, Melayu, Singkawang Barat',
    latitude: 0.9056,
    longitude: 108.9868,
    opening_hours: '06.00 - 21.00 WIB',
  },
  {
    id: 'osm-2',
    name: 'Pasar Hongkong Singkawang',
    category: 'Kuliner Malam & Pasar',
    address: 'Jl. Setia Budi, Singkawang Barat',
    latitude: 0.9071,
    longitude: 108.9842,
    opening_hours: '17.00 - 24.00 WIB',
  },
  {
    id: 'osm-3',
    name: 'Pasar Tradisional Beringin',
    category: 'Pasar & Sembako',
    address: 'Jl. Pemuda, Condong, Singkawang Tengah',
    latitude: 0.9118,
    longitude: 108.9915,
    opening_hours: '04.00 - 15.00 WIB',
  },
  {
    id: 'osm-4',
    name: 'Taman Burung Singkawang',
    category: 'Taman Kota',
    address: 'Jl. Merdeka, Singkawang Barat',
    latitude: 0.9078,
    longitude: 108.9861,
    opening_hours: '24 Jam',
  },
  {
    id: 'osm-5',
    name: 'Pantai Pasir Panjang Singkawang',
    category: 'Wisata Alam & Pesisir',
    address: 'Jl. Raya Pasir Panjang, Sedau, Singkawang Selatan',
    latitude: 0.8524,
    longitude: 108.9612,
    opening_hours: '07.00 - 18.00 WIB',
  },
  {
    id: 'osm-6',
    name: 'Taman Wisata Rindang Alam Pajintan',
    category: 'Wisata & Rekreasi',
    address: 'Pajintan, Singkawang Timur',
    latitude: 0.8932,
    longitude: 109.0345,
    opening_hours: '08.00 - 17.00 WIB',
  },
  {
    id: 'osm-7',
    name: 'RSUD Dr. Abdul Aziz Singkawang',
    category: 'Fasilitas Kesehatan',
    address: 'Jl. Dr. Soetomo No. 28, Singkawang Barat',
    latitude: 0.9038,
    longitude: 108.9822,
    opening_hours: '24 Jam (IGD)',
    phone: '0562-631748',
  },
  {
    id: 'osm-8',
    name: 'Terminal Pasiran Singkawang',
    category: 'Transportasi & Logistik',
    address: 'Jl. Stasiun Pasiran, Singkawang Barat',
    latitude: 0.9042,
    longitude: 108.9805,
    opening_hours: '05.00 - 18.00 WIB',
  },
  {
    id: 'osm-9',
    name: 'Pasar Sentral Bengkayang',
    category: 'Pasar & Antar Kota',
    address: 'Jl. Basuki Rahmat, Kota Bengkayang',
    latitude: 0.8242,
    longitude: 109.6578,
    opening_hours: '05.00 - 16.00 WIB',
  },
];

export const SingkawangMap: React.FC<SingkawangMapProps> = ({
  onSelectStore,
  selectedStoreId,
  adminMode = false,
  onCoordinateChange,
  initialLat = 0.9056,
  initialLng = 108.9868,
}) => {
  const { stores, userLocation, setUserLocation, categories, addStore, adminSettings } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const adminDraggableMarkerRef = useRef<L.Marker | null>(null);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedOsmPlace, setSelectedOsmPlace] = useState<OsmPlace | null>(null);
  const [showNavSheet, setShowNavSheet] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerFormName, setRegisterFormName] = useState('');
  const [registerFormAddress, setRegisterFormAddress] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isSearchingOsm, setIsSearchingOsm] = useState(false);
  const [osmSearchResults, setOsmSearchResults] = useState<OsmPlace[]>([]);
  const [showResultsList, setShowResultsList] = useState(false);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchCat =
        selectedCategory === 'Semua' ||
        store.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !searchQuery ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [stores, selectedCategory, searchQuery]);

  // Combined places for search
  const combinedPlaces = useMemo(() => {
    const list: Array<{ type: 'merchant' | 'osm'; data: Store | OsmPlace }> = [];
    filteredStores.forEach((st) => list.push({ type: 'merchant', data: st }));
    SINGKAWANG_OSM_POINTS.forEach((op) => {
      if (
        !searchQuery ||
        op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        list.push({ type: 'osm', data: op });
      }
    });
    return list;
  }, [filteredStores, searchQuery]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Leaflet Map centered in Singkawang
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      maxZoom: 19,
      minZoom: 9,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Invalidate size on resize or transition
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    if (userLocation.permissionGranted) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-md"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-pos-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup('<b>Lokasi Anda</b>');
    }
  }, [userLocation]);

  // Handle Admin Draggable Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !adminMode) return;

    if (adminDraggableMarkerRef.current) {
      adminDraggableMarkerRef.current.remove();
    }

    const adminHtml = `
      <div class="relative flex flex-col items-center cursor-move">
        <div class="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-amber-300 animate-bounce">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <span class="bg-amber-900 text-amber-100 text-[10px] px-1.5 py-0.5 rounded shadow mt-0.5 font-bold">Geser Titik</span>
      </div>
    `;

    const adminIcon = L.divIcon({
      html: adminHtml,
      className: 'admin-drag-marker',
      iconSize: [36, 48],
      iconAnchor: [18, 48],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: adminIcon,
      draggable: true,
      zIndexOffset: 2000,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      if (onCoordinateChange) {
        onCoordinateChange(pos.lat, pos.lng);
      }
    });

    adminDraggableMarkerRef.current = marker;
  }, [adminMode, initialLat, initialLng]);

  // Render Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Merchant Markers (PAYKAJASTIP)
    filteredStores.forEach((store) => {
      const isSelected = selectedStoreId === store.id || selectedStore?.id === store.id;
      const markerHtml = `
        <div class="group relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
          <div class="w-8 h-8 rounded-full ${
            isSelected
              ? 'bg-sky-600 ring-4 ring-sky-300 scale-125'
              : 'bg-sky-500 hover:bg-sky-600'
          } text-white flex items-center justify-center shadow-md border-2 border-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <span class="max-w-[100px] truncate bg-white/95 text-slate-800 text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-sm border border-slate-200 mt-0.5 group-hover:block hidden">
            ${store.name}
          </span>
        </div>
      `;

      const storeIcon = L.divIcon({
        html: markerHtml,
        className: 'store-custom-marker',
        iconSize: [32, 40],
        iconAnchor: [16, 20],
      });

      const marker = L.marker([store.latitude, store.longitude], {
        icon: storeIcon,
      }).addTo(layer);

      marker.on('click', () => {
        setSelectedStore(store);
        setSelectedOsmPlace(null);
        setShowNavSheet(true);
        if (onSelectStore) onSelectStore(store);
        map.panTo([store.latitude, store.longitude]);
      });
    });

    // 2. OpenStreetMap Points of Interest
    SINGKAWANG_OSM_POINTS.forEach((place) => {
      const isSelected = selectedOsmPlace?.id === place.id;
      const osmHtml = `
        <div class="group relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
          <div class="w-7 h-7 rounded-full ${
            isSelected ? 'bg-purple-600 ring-4 ring-purple-300' : 'bg-purple-500 hover:bg-purple-600'
          } text-white flex items-center justify-center shadow-md border-2 border-white">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <span class="max-w-[110px] truncate bg-white/95 text-purple-900 text-[9px] font-medium px-1.5 py-0.5 rounded shadow-sm border border-purple-100 mt-0.5 group-hover:block hidden">
            ${place.name}
          </span>
        </div>
      `;

      const osmIcon = L.divIcon({
        html: osmHtml,
        className: 'osm-custom-marker',
        iconSize: [28, 36],
        iconAnchor: [14, 18],
      });

      const marker = L.marker([place.latitude, place.longitude], {
        icon: osmIcon,
      }).addTo(layer);

      marker.on('click', () => {
        setSelectedOsmPlace(place);
        setSelectedStore(null);
        setShowNavSheet(true);
        map.panTo([place.latitude, place.longitude]);
      });
    });
  }, [filteredStores, selectedStore, selectedOsmPlace, selectedStoreId]);

  // Search OpenStreetMap via Nominatim for live Singkawang places
  const handleOsmSearch = async (query: string) => {
    if (!query || query.length < 3) return;
    setIsSearchingOsm(true);
    try {
      // Free Nominatim API query constrained to Singkawang & Bengkayang area
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ' Singkawang'
      )}&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'id,en' },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const parsed: OsmPlace[] = data.map((item, idx) => ({
          id: `osm-live-${idx}-${item.place_id}`,
          name: item.name || item.display_name.split(',')[0],
          category: item.type || 'Tempat Publik',
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
        setOsmSearchResults(parsed);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsSearchingOsm(false);
    }
  };

  // Center on User Location
  const handleGoToMyLocation = () => {
    if (!mapInstanceRef.current) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({
            lat,
            lng,
            address: 'Lokasi Anda (GPS Aktif)',
            permissionGranted: true,
          });
          mapInstanceRef.current?.flyTo([lat, lng], 16, { animate: true });
        },
        () => {
          alert(
            'Izin lokasi belum diberikan. Peta tetap dapat digunakan dan menampilkan area Singkawang Kota.'
          );
          mapInstanceRef.current?.flyTo([0.9056, 108.9868], 15);
        }
      );
    }
  };

  // Quick register place as merchant
  const handleOpenRegisterDialog = (place: OsmPlace) => {
    setRegisterFormName(place.name);
    setRegisterFormAddress(place.address);
    setShowRegisterDialog(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOsmPlace) return;

    addStore({
      merchant_id: 'merchant-registered',
      name: registerFormName,
      slug: registerFormName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      logo_url:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      banner_url:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      category: 'UMKM',
      description: 'Toko terdaftar dari database peta Singkawang.',
      address: registerFormAddress,
      latitude: selectedOsmPlace.latitude,
      longitude: selectedOsmPlace.longitude,
      district: 'Singkawang Barat',
      whatsapp: '081200000000',
      opening_hours: '08.00 - 20.00 WIB',
      is_open: true,
      rating: 5.0,
      review_count: 1,
      store_type: 'umkm',
      location_status: 'pending',
      is_active: true,
    });

    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setShowRegisterDialog(false);
      setShowNavSheet(false);
    }, 2000);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-slate-100 overflow-hidden">
      {/* Search Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2">
        <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-slate-200/80 p-1.5 backdrop-blur-md">
          <div className="pl-2.5 text-sky-600">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResultsList(true);
              if (e.target.value.length > 2) {
                handleOsmSearch(e.target.value);
              }
            }}
            placeholder="Cari toko, makanan, alamat, atau tempat..."
            className="w-full pl-3 pr-8 py-1.5 text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowResultsList(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('Semua')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-xs transition ${
              selectedCategory === 'Semua'
                ? 'bg-sky-600 text-white shadow-sky-600/30'
                : 'bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-xs transition ${
                selectedCategory === cat.name
                  ? 'bg-sky-600 text-white shadow-sky-600/30'
                  : 'bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Live Results Autocomplete Modal */}
      {showResultsList && searchQuery && (
        <div className="absolute top-24 left-3 right-3 z-30 max-h-64 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 divide-y divide-slate-100">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>Hasil Pencarian Singkawang</span>
            <button
              onClick={() => setShowResultsList(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              Tutup
            </button>
          </div>

          {combinedPlaces.length === 0 && osmSearchResults.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500">
              Tidak ditemukan tempat &quot;{searchQuery}&quot; di Singkawang.
            </div>
          )}

          {/* Merchants */}
          {combinedPlaces.map((item, idx) => {
            const isStore = item.type === 'merchant';
            const place = item.data;
            return (
              <div
                key={`res-${idx}`}
                onClick={() => {
                  if (isStore) {
                    const st = place as Store;
                    setSelectedStore(st);
                    setSelectedOsmPlace(null);
                    mapInstanceRef.current?.flyTo([st.latitude, st.longitude], 16);
                  } else {
                    const op = place as OsmPlace;
                    setSelectedOsmPlace(op);
                    setSelectedStore(null);
                    mapInstanceRef.current?.flyTo([op.latitude, op.longitude], 16);
                  }
                  setShowNavSheet(true);
                  setShowResultsList(false);
                }}
                className="flex items-center gap-3 p-2.5 hover:bg-sky-50 rounded-xl cursor-pointer transition"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isStore ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {isStore ? <StoreIcon className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{place.name}</h4>
                    {isStore && (
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">
                        Merchant
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{place.address}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Floating Action Controls */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col gap-2">
        {/* Lokasi Saya Button */}
        <button
          onClick={handleGoToMyLocation}
          title="Lokasi Saya"
          className="w-11 h-11 rounded-full bg-white text-slate-700 hover:text-sky-600 flex items-center justify-center shadow-lg border border-slate-200 active:scale-90 transition"
        >
          <Navigation className="w-5 h-5" />
        </button>

        {/* Singkawang Center Button */}
        <button
          onClick={() => {
            mapInstanceRef.current?.flyTo([0.9056, 108.9868], 14);
          }}
          title="Pusat Kota Singkawang"
          className="w-11 h-11 rounded-full bg-white text-slate-700 hover:text-sky-600 flex items-center justify-center shadow-lg border border-slate-200 active:scale-90 transition"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute left-3 bottom-24 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/60 text-[11px] font-medium flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sky-700">
          <span className="w-3 h-3 rounded-full bg-sky-500 inline-block border border-white"></span>
          <span>Merchant Payka</span>
        </div>
        <div className="flex items-center gap-1.5 text-purple-700">
          <span className="w-3 h-3 rounded-full bg-purple-500 inline-block border border-white"></span>
          <span>Tempat Umum</span>
        </div>
      </div>

      {/* Bottom Sheet Detail */}
      {showNavSheet && (selectedStore || selectedOsmPlace) && (
        <div className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-lg rounded-t-3xl shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[70vh] overflow-y-auto">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

          {/* Close button */}
          <button
            onClick={() => {
              setShowNavSheet(false);
              setSelectedStore(null);
              setSelectedOsmPlace(null);
            }}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 1. PAYKAJASTIP Merchant Detail */}
          {selectedStore && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={selectedStore.logo_url}
                  alt={selectedStore.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-sm"
                />
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                      Merchant Resmi
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {selectedStore.is_open ? 'Buka Sekarang' : 'Tutup'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {selectedStore.district}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                    {selectedStore.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{selectedStore.address}</span>
                  </p>
                </div>
              </div>

              {/* Info Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Rating</span>
                  <span className="font-bold text-amber-500">★ {selectedStore.rating}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Jam Buka</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {selectedStore.opening_hours.split(' ')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Jarak</span>
                  <span className="font-bold text-sky-600">
                    {calculateDistanceKm(
                      userLocation.lat,
                      userLocation.lng,
                      selectedStore.latitude,
                      selectedStore.longitude
                    )}{' '}
                    km
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{selectedStore.description}</p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {onSelectStore && (
                  <button
                    onClick={() => {
                      onSelectStore(selectedStore);
                      setShowNavSheet(false);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-98 transition"
                  >
                    <span>Lihat Produk & Pesan</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* WhatsApp Store */}
                <a
                  href={createWhatsAppUrl(
                    selectedStore.whatsapp,
                    `Halo ${selectedStore.name}, saya melihat toko Anda di PAYKAJASTIP Singkawang.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-98 transition"
                  title="Chat WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WA</span>
                </a>

                {/* Navigation Deep Link */}
                <a
                  href={getGoogleMapsNavUrl(
                    selectedStore.latitude,
                    selectedStore.longitude,
                    selectedStore.name
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-98 transition"
                  title="Navigasi Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigasi</span>
                </a>
              </div>
            </div>
          )}

          {/* 2. OpenStreetMap Place Detail (Not a merchant yet) */}
          {selectedOsmPlace && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {selectedOsmPlace.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                    {selectedOsmPlace.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {selectedOsmPlace.address}
                  </p>
                </div>
              </div>

              {/* Non-Merchant Notice Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold">Tempat ini belum terdaftar di PAYKAJASTIP</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Anda dapat mengajukan toko/tempat ini agar bergabung sebagai mitra resmi
                    PAYKAJASTIP atau menggunakan jasa Jastip untuk memesan dari sini.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <span>Jarak dari lokasi Anda:</span>
                <span className="font-bold text-sky-700">
                  {calculateDistanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    selectedOsmPlace.latitude,
                    selectedOsmPlace.longitude
                  )}{' '}
                  km
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  onClick={() => handleOpenRegisterDialog(selectedOsmPlace)}
                  className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-98 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>DAFTARKAN TOKO KE PAYKAJASTIP</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={getGoogleMapsNavUrl(
                      selectedOsmPlace.latitude,
                      selectedOsmPlace.longitude,
                      selectedOsmPlace.name
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Google Maps</span>
                  </a>

                  <a
                    href={getWazeNavUrl(selectedOsmPlace.latitude, selectedOsmPlace.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-300 active:scale-98 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Waze</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Register Store Dialog */}
      {showRegisterDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Daftarkan Toko ke PAYKAJASTIP
              </h3>
              <button
                onClick={() => setShowRegisterDialog(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-slate-800">Toko Berhasil Diajukan!</h4>
                <p className="text-xs text-slate-500">
                  Tim Admin PAYKAJASTIP akan memverifikasi titik lokasi dan menghubungi pemilik toko.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Toko / Tempat
                  </label>
                  <input
                    type="text"
                    required
                    value={registerFormName}
                    onChange={(e) => setRegisterFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={registerFormAddress}
                    onChange={(e) => setRegisterFormAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
                  />
                </div>

                <div className="p-3 bg-sky-50 rounded-xl text-[11px] text-sky-800">
                  <p>
                    Lokasi koordinat akan otomatis menggunakan titik peta yang dipilih. Status awal
                    toko akan diset sebagai <strong>PENDING</strong> untuk verifikasi Admin.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterDialog(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-md shadow-sky-600/20"
                  >
                    Kirim Pendaftaran
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
