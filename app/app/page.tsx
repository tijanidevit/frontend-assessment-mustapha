"use client";

import { orders, type Order } from '@/lib/orders';
import { OrderRow } from './components/OrderRow';
import { useSearchParams, useRouter } from "next/navigation";
import { StatusFilter } from './components/StatusFilter';
import { useState, useEffect, useRef, useCallback } from 'react';
import { OrderDetailsPanel } from './components/OrderDetailsPanel';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const search = searchParams.get("search") ?? "";
  const selectedStatuses = searchParams.get("status")?.split(",") ?? [];

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const activeRowRef = useRef<HTMLTableRowElement | null>(null);

  const openedRowRef = useRef<number | null>(null);

  const updateSearch = (value: string) => {
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

  // Keep a ref to filteredOrders so the window listener always sees the
  // latest list without needing to re-register on every render.
  const filteredOrdersRef = useRef(filteredOrders);
  filteredOrdersRef.current = filteredOrders;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const currentIndex = activeIndexRef.current;

      if (event.key === "ArrowDown") {
        event.preventDefault();

        setActiveIndex((current) =>
          Math.min(
            current + 1,
            filteredOrdersRef.current.length - 1
          )
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setActiveIndex((current) =>
          Math.max(current - 1, 0)
        );
      }

      if (event.key === "Enter") {
        const order = filteredOrdersRef.current[currentIndex];

        if (order) {
          openedRowRef.current = currentIndex;
          setSelectedOrder(order);
        }
      }

      if (event.key === "Escape") {
        setSelectedOrder(null);
        // Snap cursor back to the row that was opened, not wherever arrows drifted
        if (openedRowRef.current !== null) {
          setActiveIndex(openedRowRef.current);
          openedRowRef.current = null; // consume it
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Move browser focus to the newly highlighted row after each Arrow key press.
  useEffect(() => {
    if (activeIndex >= 0) {
      activeRowRef.current?.focus();
    }
  }, [activeIndex]);

  // Stable close handler — used by both the X button and Escape.
  // useCallback with [] is safe: setSelectedOrder/setActiveIndex are stable
  // setters, and openedRowRef is a ref (stable object, not a value).
  const handleClose = useCallback(() => {
    setSelectedOrder(null);
    if (openedRowRef.current !== null) {
      setActiveIndex(openedRowRef.current);
      openedRowRef.current = null;
    }
  }, []);

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

          <tbody
            onClick={(e) => {
              // Delegate row clicks from tbody to avoid creating handlers for every row.
              // closest() walks up from the clicked <td> to find the <tr>.
              const row = (e.target as HTMLElement).closest<HTMLTableRowElement>('tr[data-index]');
              if (!row) return;
              const index = Number(row.dataset.index);
              const order = filteredOrders[index];
              if (!order) return;
              openedRowRef.current = index; // snapshot for Escape
              setActiveIndex(index);
              setSelectedOrder(order);
            }}
          >
            {filteredOrders.map((order: Order, index: number) => (
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

      <OrderDetailsPanel
        order={selectedOrder}
        onClose={handleClose}
      />
    </main>
  );
}