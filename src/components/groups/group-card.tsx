import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { GroupSummary } from "@/lib/auth-actions";

type Props = {
    group: GroupSummary;
};

export function GroupCard({ group }: Props) {
    return (
        <Link
            href={`/groups/${group.id}`}
            className="block h-full rounded-4xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
            <Card className="h-full min-h-35 hover:bg-muted/50">
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle>{group.name}</CardTitle>
                        <Badge
                            variant={
                                group.status === "VOTING"
                                    ? "default"
                                    : "secondary"
                            }
                        >
                            {group.status}
                        </Badge>
                    </div>
                    <CardDescription>
                        {group.members.length} members
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-1">
                        {group.members.map((member) => (
                            <Badge key={member} variant="secondary">
                                {member}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
