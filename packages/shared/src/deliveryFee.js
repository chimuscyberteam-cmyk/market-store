export const FEE_PER_BLOCK_ZMW = 5;
export const BLOCK_METERS = 800;

export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function deliveryFee(distanceM) {
  if (!Number.isFinite(distanceM) || distanceM <= 0) return 0;
  return Math.ceil(distanceM / BLOCK_METERS) * FEE_PER_BLOCK_ZMW;
}
