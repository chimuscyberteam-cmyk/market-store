import { pool } from '../db/pool.js';

export function startExpiryJob() {
  console.log('⏱️  Starting 1-hour order expiry background job...');
  
  // Run every 60 seconds
  setInterval(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Find all orders that are pending/confirmed and past their hold time
      const { rows: expiredOrders } = await client.query(`
        SELECT id, item_id, quantity 
        FROM orders 
        WHERE status IN ('pending', 'confirmed') 
        AND hold_expires_at < NOW()
        FOR UPDATE
      `);

      if (expiredOrders.length > 0) {
        for (const order of expiredOrders) {
          // 2. Put the stock back on the item
          await client.query(`
            UPDATE items 
            SET quantity = quantity + $1,
                status = CASE WHEN status = 'sold' THEN 'active' ELSE status END
            WHERE id = $2
          `, [order.quantity, order.item_id]);

          // 3. Cancel the order
          await client.query(`
            UPDATE orders 
            SET status = 'cancelled' 
            WHERE id = $1
          `, [order.id]);
        }
        console.log(`⏱️  Auto-cancelled ${expiredOrders.length} expired order(s) and restored stock.`);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Error in expiry job:', err);
    } finally {
      client.release();
    }
  }, 60 * 1000); // 60 seconds
}
