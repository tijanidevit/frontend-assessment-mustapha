import { Order } from "@/lib/orders";

type Props = {
    orders: Order[];
};

export function PrintTable({ orders }: Props) {
    return (
        <table className="w-full border-collapse text-sm">
            <thead>
                <tr className="border-b text-left">
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Date</th>
                </tr>
            </thead>

            <tbody>
                {orders.map((order) => (
                    <tr key={order.id} className="border-b">
                        <td className="p-3">
                            {order.orderNumber}
                        </td>

                        <td className="p-3">
                            {order.customer}
                        </td>

                        <td className="p-3">
                            {order.status}
                        </td>

                        <td className="p-3">
                            ${order.total.toFixed(2)}
                        </td>

                        <td className="p-3">
                            {new Date(order.date).toLocaleDateString("en-GB")}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}