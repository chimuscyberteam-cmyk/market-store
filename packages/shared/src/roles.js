export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin'
};

export const ROLE_LABELS = {
  buyer: 'Buyer',
  seller: 'Seller',
  admin: 'Admin'
};

export const ROLE_DESCRIPTIONS = {
  buyer: 'Browse and buy items from sellers',
  seller: 'Post items and sell to buyers',
  admin: 'Manage users, listings and orders'
};

export function canPostItems(role) {
  return role === 'seller' || role === 'admin';
}

export function isAdmin(role) {
  return role === 'admin';
}

export function canBecomeSeller(role) {
  return role === 'buyer';
}
