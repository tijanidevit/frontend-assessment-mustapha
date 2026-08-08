export type Status = 'NEW' | 'PICKING' | 'SHIPPED' | 'CANCELLED';

export type Order = {
    id: string;
    orderNumber: string;
    customer: string;
    status: Status;
    total: number;
    date: string;
};

const statuses: Status[] = ['NEW', 'PICKING', 'SHIPPED', 'CANCELLED'];

const customers = [
    'Mustapha Ltd',
    'Allen',
    'Nelli Arabi',
    'Tijani Co',
    'Happiness Industries',
    'NgN Enterprises',
];

const getRandomInt = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomDateIn2026 = () => 
    new Date(Date.UTC(2026, 0, getRandomInt(1, 180))).toISOString();

export const orders: Order[] = Array.from({ length: 5000 }, (_, index) => {
    const id = index + 1;
    return {
        id: String(id),
        orderNumber: `ORD-${String(id).padStart(5, '0')}`,
        customer: customers[index % customers.length],
        status: statuses[index % statuses.length],
        total: getRandomInt(25, 1000),
        date: getRandomDateIn2026(),
    };
});