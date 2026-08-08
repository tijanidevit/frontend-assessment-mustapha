export const statuses = [
    "NEW",
    "PICKING",
    "SHIPPED",
    "CANCELLED",
] as const;

export type Status = typeof statuses[number];