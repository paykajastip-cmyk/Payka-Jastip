/**
 * Helper utilities for PAYKAJASTIP
 */

/**
 * Format Indonesian Rupiah currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate WhatsApp phone number (Indonesia & international)
 * Valid Indonesian numbers: 08..., 628..., +628... typically between 9 and 15 digits
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return false;

  if (clean.startsWith('62')) {
    return clean.length >= 10 && clean.length <= 15;
  }
  if (clean.startsWith('0')) {
    return clean.length >= 10 && clean.length <= 14;
  }
  if (clean.startsWith('8')) {
    return clean.length >= 9 && clean.length <= 13;
  }
  return clean.length >= 8 && clean.length <= 15;
}

/**
 * Convert phone number to standard international WhatsApp format (e.g. 628...)
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return '';
  if (clean.startsWith('0')) {
    return '62' + clean.slice(1);
  }
  if (clean.startsWith('62')) {
    return clean;
  }
  if (clean.startsWith('8')) {
    return '62' + clean;
  }
  return clean;
}

/**
 * Format phone number for clean visual display (e.g. +62 812-5432-1098)
 */
export function formatDisplayPhone(phone: string): string {
  const intl = formatWhatsAppNumber(phone);
  if (!intl) return phone || '-';
  if (intl.startsWith('62')) {
    const rest = intl.slice(2);
    if (rest.length <= 3) return `+62 ${rest}`;
    if (rest.length <= 7) return `+62 ${rest.slice(0, 3)}-${rest.slice(3)}`;
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return phone;
}

/**
 * Build deep link to WhatsApp with verified phone number and encoded message
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  if (!formattedPhone) return '#';
  const encodedMessage = encodeURIComponent(message || '');
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Calculate distance between two lat/lng points using Haversine formula (km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate delivery fee based on distance and rates
 */
export function calculateDeliveryFee(
  distanceKm: number,
  baseRate = 10000,
  perKmRate = 3000,
  minimumRate = 15000
): number {
  if (distanceKm <= 0) return baseRate;
  const rawFee = baseRate + Math.max(0, distanceKm - 1) * perKmRate;
  return Math.max(minimumRate, Math.round(rawFee / 1000) * 1000);
}

/**
 * Generate Google Maps navigation deep link
 */
export function getGoogleMapsNavUrl(lat: number, lng: number, label?: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${
    label ? `&destination_place_id=${encodeURIComponent(label)}` : ''
  }`;
}

/**
 * Generate Waze navigation deep link
 */
export function getWazeNavUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

/**
 * Format ISO date string into Indonesian readable date
 */
export function formatIndoDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Extract latitude and longitude from various Google Maps links without using an API key
 */
export function extractGoogleMapsCoordinates(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') return null;
  const decoded = decodeURIComponent(url.trim());

  // Pattern 1: /@lat,lng,
  const atMatch = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Pattern 2: ?q=lat,lng or &q=lat,lng
  const qMatch = decoded.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Pattern 3: ?ll=lat,lng or &ll=lat,lng
  const llMatch = decoded.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Pattern 4: !3d<lat>!4d<lng> (Google protobuf map coordinates)
  const protoMatch = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (protoMatch) {
    const lat = parseFloat(protoMatch[1]);
    const lng = parseFloat(protoMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Pattern 5: Generic lat, lng in string (e.g. "0.9056, 108.9868")
  const genericMatch = decoded.match(/(-?\d{1,2}\.\d{3,8})[,\s]+(-?\d{1,3}\.\d{3,8})/);
  if (genericMatch) {
    const lat = parseFloat(genericMatch[1]);
    const lng = parseFloat(genericMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

