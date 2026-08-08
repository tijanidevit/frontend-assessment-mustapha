import { Order } from '@/lib/orders';
import { memo } from 'react';

type Props = {
    order: Order;
};

export const OrderRow = memo(function OrderRow({ order }: Props) {
    console.count('OrderRow rendered');

    return (
        <tr className="border-b">
            <td className="p-3">{order.orderNumber}</td>
            <td className="p-3">{order.customer}</td>
            <td className="p-3">{order.status}</td>
            <td className="p-3">${order.total.toFixed(2)}</td>
            <td className="p-3">
                {new Date(order.date).toLocaleDateString('en-GB')}
            </td>
        </tr>
    );
});