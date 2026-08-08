"use client";

import type { Order } from "@/lib/orders";

type Props = {
    order: Order | null;
    onClose: () => void;
};

export function OrderDetailsPanel({ order, onClose }: Props) {
    if (!order) return null;

    return (
        <aside className="fixed right-0 text-black top-0 h-full w-96 border-l bg-white p-6 shadow-lg">
            <div className='flex justify-end'>
                <button
                    onClick={onClose}
                    className="rounded border px-3 py-1"
                >
                    X
                </button>
            </div>

            <h2 className="mb-4 mt-8 text-xl font-bold">
                Order Details
            </h2>

            <div className="space-y-2">
                <p>
                    <strong>Order:</strong> {order.orderNumber}
                </p>

                <p>
                    <strong>Customer:</strong> {order.customer}
                </p>

                <p>
                    <strong>Status:</strong> {order.status}
                </p>

                <p>
                    <strong>Total:</strong> ${order.total.toFixed(2)}
                </p>

                <p>
                    <strong>Date:</strong>{" "}
                    {new Date(order.date).toLocaleDateString('en-GB')}
                </p>
            </div>
        </aside>
    );
}