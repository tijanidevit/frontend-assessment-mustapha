import { Order } from '@/lib/orders';

type Props = {
    order: Order;
};

export function OrderRow({ order }: Props) {
    console.log('render row:', order.id);

    return (
        <tr className="border-b">
            <td className="p-3">{order.orderNumber}</td>
            <td className="p-3">{order.customer}</td>
            <td className="p-3">{order.status}</td>
            <td className="p-3">${order.total.toFixed(2)}</td>
            <td className="p-3">
            {new Date(order.date).toLocaleDateString()}
            </td>
        </tr>
    );
}