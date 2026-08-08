"use client";

import { statuses, type Status } from "@/lib/status";
import { useSearchParams, useRouter } from "next/navigation";

export function StatusFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const selectedStatuses = searchParams.get("status")?.split(",") ?? [];

    function toggleStatusSelection(status: Status) {
        const params = new URLSearchParams(searchParams);

        let updatedStatuses = [...selectedStatuses];

        if (updatedStatuses.includes(status)) {
            updatedStatuses = updatedStatuses.filter((item) => item !== status);
        } else {
            updatedStatuses.push(status);
        }

        if (updatedStatuses.length > 0) {
            params.set("status", updatedStatuses.join(","));
        } else {
            params.delete("status");
        }

        router.replace(`?${params.toString()}`);
    }

    return (
        <div className="flex gap-4 mt-4">
            {statuses.map((status) => (
                <label key={status} className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => toggleStatusSelection(status)}
                    />
                    {status}
                </label>
            ))}
        </div>
    );
}