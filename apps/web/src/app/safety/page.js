export default function Safety() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 prose dark:prose-invert">
      <h1 className="text-3xl font-extrabold mb-6">Safety Guidelines</h1>
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl mb-8">
        <p className="font-bold text-amber-800 dark:text-amber-200 m-0">Your safety is our priority. Please follow these rules when trading.</p>
      </div>
      
      <h2 className="text-xl font-bold mt-6 mb-2">📍 Meet in Public</h2>
      <p>Always meet at public landmarks like the Main Gate, Library entrance, or the Cafeteria. <strong>Never invite a stranger to your hostel room.</strong></p>
      
      <h2 className="text-xl font-bold mt-6 mb-2">🔍 Inspect Before You Pay</h2>
      <p>Always inspect the item thoroughly before handing over your cash. Once you enter the 6-digit delivery code, the transaction is final.</p>
      
      <h2 className="text-xl font-bold mt-6 mb-2">🔒 Protect Your Code</h2>
      <p>Sellers: <strong>Never</strong> share the buyer's 6-digit code until they have physically handed you the money. Buyers: Only give your code when you have the item in your hands.</p>
    </div>
  );
}
