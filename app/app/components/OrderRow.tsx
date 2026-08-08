import { Order } from '@/lib/orders';
import { forwardRef, memo } from 'react';

type Props = {
    order: Order;
    onClick: (order: Order) => void;
    active: boolean;
};

export const OrderRow = memo(
    forwardRef<HTMLTableRowElement, Props>(function OrderRow(
        { order, onClick, active },
        ref
    ) {
        console.count('OrderRow rendered');

        return (
            <tr
                ref={ref}
                tabIndex={-1}
                className={`border-b cursor-pointer hover:bg-gray-500 ${active ? "bg-blue-400" : ""}`}
                onClick={() => onClick(order)}
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