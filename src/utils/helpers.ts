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
 * Convert Indonesian phone number 08... to international 628...
 */
export function formatWhatsAppNumber(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    return '62' + clean.slice(1);
  }
  if (clean.startsWith('62')) {
    return clean;
  }
  return '62' + clean;
}

/**
 * Build deep link to WhatsApp
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);
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
