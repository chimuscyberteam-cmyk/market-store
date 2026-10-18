const fs = require('fs');
let p = 'apps/web/src/app/my-listings/page.js';
let c = fs.readFileSync(p, 'utf8');

const oldCode = "toast.success('You are now a PRO seller! 👑');";

const newCode = `toast.custom((t) => (
        <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 border border-amber-300">
          <div className="text-4xl bg-white/20 w-14 h-14 flex items-center justify-center rounded-full shrink-0">👑</div>
          <div>
            <h3 className="font-extrabold text-lg text-white">Welcome to Pro!</h3>
            <p className="text-sm font-medium text-amber-50 mt-1">Your account is upgraded. You now have unlimited listings and priority visibility.</p>
          </div>
        </div>
      ), { duration: 6000 });`;

c = c.replace(oldCode, newCode);

fs.writeFileSync(p, c);
console.log('✅ Custom Pro upgrade notification added!');
