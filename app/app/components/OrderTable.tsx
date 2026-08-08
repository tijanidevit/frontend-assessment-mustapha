"use client";

import { type Order } from '@/lib/orders';
import { OrderRow } from './OrderRow';
import { MutableRefObject } from 'react';

interface OrderTableProps {
  orders: Order[];
  activeIndex: number;
  activeRowRef: MutableRefObject<HTMLTableRowElement | null>;
  openedRowRef: MutableRefObject<number | null>;
  onRowClick: (order: Order, index: number) => void;
}

export function OrderTable({
  orders,
  activeIndex,
  activeRowRef,
  openedRowRef,
  onRowClick,
}: OrderTableProps) {
  return (
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

        <tbody
          onClick={(e) => {
            // Delegate row clicks from tbody to avoid creating handlers for every row.
            // closest() walks up from the clicked <td> to find the <tr>.
            const row = (e.target as HTMLElement).closest<HTMLTableRowElement>('tr[data-index]');
            if (!row) return;
            const index = Number(row.dataset.index);
            const order = orders[index];
            if (!order) return;
            openedRowRef.current = index; // snapshot for Escape
            onRowClick(order, index);
          }}
        >
          {orders.map((order: Order, index: number) => (
            <OrderRow
              key={order.id}
              order={order}
              active={index === activeIndex}
              index={index}
              ref={index === activeIndex ? activeRowRef : null}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
