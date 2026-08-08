"use client";

import { orders, type Order } from '@/lib/orders';
import { OrderRow } from './components/OrderRow';
import { useSearchParams, useRouter } from "next/navigation";
import { StatusFilter } from './components/StatusFilter';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("search") ?? "";
  const selectedStatuses = searchParams.get("status")?.split(",") ?? [];


  function updateSearch(value: string) {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    router.replace(`?${params.toString()}`);
  }

  const filteredOrders = orders.filter((order) => {
    const searchResult =
      order.orderNumber
        .toLowerCase()
        .includes(search.toLowerCase());

    const statusResult =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes(order.status);

    return searchResult && statusResult;
  });

  return (
    <main className="p-6">

      <div className="mb-6">
        <h1 className="mb-6 text-2xl text-center font-bold">Recent Orders</h1>

        <input
          type="search"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Search by order number..."
          className="w-full max-w-sm rounded border px-3 py-2"
        />

        <StatusFilter />
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