import { Badge } from "@/components/ui/badge";
import type { Group } from "@/lib/auth-actions";

export function GroupStatusBadge({ status }: { status: Group["status"] }) {
    return (
        <Badge variant={status === "VOTING" ? "default" : "secondary"}>
            {status}
        </Badge>
    );
}
