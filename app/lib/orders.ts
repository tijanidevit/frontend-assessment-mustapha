import { statuses } from "./status";

export type Status = 'NEW' | 'PICKING' | 'SHIPPED' | 'CANCELLED';

export type Order = {
    id: string;
    orderNumber: string;
    customer: string;
    status: Status;
    total: number;
    date: string;
};

const customers = [
    'Mustapha Ltd',
    'Allen',
    'Nelli Arabi',
    'Tijani Co',
    'Happiness Industries',
    'NgN Enterprises',
];

// Deterministic helpers — no Math.random() so SSR and client produce identical output
const getDeterministicInt = (index: number, min: number, max: number) =>
    min + (index * 37 + 13) % (max - min + 1);

const getDeterministicDateIn2026 = (index: number) =>
    new Date(Date.UTC(2026, 0, 1 + (index * 37) % 180)).toISOString();

export const orders: Order[] = Array.from({ length: 5000 }, (_, index) => {
    const id = index + 1;
    return {
        id: String(id),
        orderNumber: `ORD-${String(id).padStart(5, '0')}`,
        customer: customers[index % customers.length],
        status: statuses[index % statuses.length],
        total: getDeterministicInt(index, 25, 1000),
        date: getDeterministicDateIn2026(index),
    };
});