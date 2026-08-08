import { Order } from '@/lib/orders';
import { forwardRef, memo } from 'react';

type Props = {
    order: Order;
    active: boolean;
    index: number;
};

export const OrderRow = memo(
    forwardRef<HTMLTableRowElement, Props>(function OrderRow(
        { order, active, index },
        ref
    ) {
        return (
            <tr
                ref={ref}
                tabIndex={-1}
                data-index={index}
                className={`border-b cursor-pointer hover:bg-gray-500 ${active ? "bg-blue-400" : ""}`}
            >
                <td className="p-3">{order.orderNumber}</td>
                <td className="p-3">{order.customer}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3">${order.total.toFixed(2)}</td>
                <td className="p-3">
                    {new Date(order.date).toLocaleDateString('en-GB')}
                </td>
            </tr>
        );
    })
);