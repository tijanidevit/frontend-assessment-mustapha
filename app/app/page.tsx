"use client";

import { orders, type Order } from '@/lib/orders';
import { useState } from 'react';
import { OrderRow } from './components/OrderRow';

export default function Home() {
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-6">

      <div className="mb-6">
        <h1 className="mb-6 text-2xl text-center font-bold">Recent Orders</h1>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order number..."
          className="w-full max-w-sm rounded border px-3 py-2"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className='bg-blue-500'>
            <tr className="border-b text-left">
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order: Order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}