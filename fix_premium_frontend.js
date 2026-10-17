const fs = require('fs');

// --- A. Update My Listings UI ---
let p1 = 'apps/web/src/app/my-listings/page.js';
let c1 = fs.readFileSync(p1, 'utf8');

// Add state for Pro
c1 = c1.replace("const [deleteId, setDeleteId] = useState(null);", "const [deleteId, setDeleteId] = useState(null);\n  const [isPro, setIsPro] = useState(user?.subscription_tier === 'pro');");

// Add Boost and Pro functions
const premiumFunctions = `
  const handleBoost = async (id) => {
    try {
      await apiFetch(\`/api/items/\${id}/boost\`, { method: 'POST' });
      toast.success('Item boosted to the top of the homepage! ⭐');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleGoPro = async () => {
    try {
      await apiFetch('/api/users/subscribe-pro', { method: 'POST' });
      toast.success('You are now a PRO seller! 👑');
      setIsPro(true);
    } catch (e) { toast.error(e.message); }
  };
`;
c1 = c1.replace("const openEdit =", premiumFunctions + "\n  const openEdit =");

// Add UI buttons in the header area
c1 = c1.replace(
  '<Link href="/items/new" className="btn-primary">+ Post New Item</Link>',
  \`<div className="flex gap-2">
          {!isPro && <button onClick={handleGoPro} className="bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold px-4 py-2 rounded-xl shadow-md">👑 Go Pro</button>}
          <Link href="/items/new" className="btn-primary">+ Post New Item</Link>
        </div>\`
);

// Add Boost button to each item card
c1 = c1.replace(
  '<button onClick={() => updateStatus(item.id, \\\'removed\\\')} className="text-red-600 hover:underline">Remove</button>',
  \`<button onClick={() => handleBoost(item.id)} className="text-amber-500 hover:underline">Boost</button>
                  <button onClick={() => updateStatus(item.id, 'removed')} className="text-red-600 hover:underline">Remove</button>\`
);
fs.writeFileSync(p1, c1);

// --- B. Update Homepage Item Card Badge ---
// We add a star badge if item.is_featured is true
let p2 = 'apps/web/src/components/ItemCard.js';
let c2 = fs.readFileSync(p2, 'utf8');
const badge = \`
        {item.is_featured && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
            ⭐ Featured
          </div>
        )}\`;
// Find the image container and insert the badge
c2 = c2.replace(/(<div className="relative[^"]*">)/, '$1' + badge);
fs.writeFileSync(p2, c2);

console.log('✅ Frontend updated: Pro buttons, Boost buttons, and Star Badges added!');
