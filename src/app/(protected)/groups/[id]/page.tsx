import { notFound, redirect } from "next/navigation";
import { GroupWorkspace } from "@/components/groups/group-workspace";
import { getCurrentUser } from "@/lib/auth";
import { calculateResults, getGroup } from "@/lib/auth-actions";

export default async function GroupPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const { id } = await params;
    const group = await getGroup(id);
    if (!group) notFound();
    const outcome =
        group.status === "COMPLETE" ? await calculateResults(id) : null;

    return (
        <GroupWorkspace
            key={group.id}
            initialGroup={group}
            initialResults={
                outcome && "results" in outcome ? outcome.results : null
            }
            initialError={outcome && "error" in outcome ? outcome.error : ""}
            user={user.username}
        />
    );
}
