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
  
  // Calculate proportional fee
  const rawFee = (distanceM / BLOCK_METERS) * FEE_PER_BLOCK_ZMW;
  
  // Round to nearest whole number (no decimals)
  let fee = Math.round(rawFee);
  
  // Optional: Set a minimum fee for any delivery (e.g., K2)
  // If you want 0m to be K0 and 10m to be K1, change this to 0.
  if (fee < 2) fee = 2; 
  
  return fee;
}
