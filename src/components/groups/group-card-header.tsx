import type { ReactNode } from "react";

export function GroupCardHeader({
    children,
    action,
    id,
}: {
    children: ReactNode;
    action?: ReactNode;
    id?: string;
}) {
    return (
        <div className="mb-2 flex min-h-8 shrink-0 items-center justify-between gap-2">
            <h2 id={id} className="text-lg font-semibold">
                {children}
            </h2>
            {action}
        </div>
    );
}
