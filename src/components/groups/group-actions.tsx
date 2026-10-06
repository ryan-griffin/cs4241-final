import { Button } from "@/components/ui/button";
import type { Group } from "@/lib/auth-actions";

type Props = {
    group: Group;
    user: string;
    calculating: boolean;
    onCompleteVoting: () => void;
    onLeaveMember: () => void;
    onMoveToVoting: () => void;
    onDelete: () => void;
};

export function GroupActions({
    group,
    user,
    calculating,
    onCompleteVoting,
    onLeaveMember,
    onMoveToVoting,
    onDelete,
}: Props) {
    const isOwner = user === group.ownerId;

    return (
        <>
            {!isOwner && (
                <Button variant="destructive" size="sm" onClick={onLeaveMember}>
                    Leave Group
                </Button>
            )}
            {isOwner && group.status === "VOTING" && (
                <Button disabled={calculating} onClick={onCompleteVoting}>
                    {calculating
                        ? "Calculating..."
                        : "End voting and show results"}
                </Button>
            )}
            {isOwner && group.status === "DRAFT" && (
                <Button onClick={onMoveToVoting}>Proceed to Voting</Button>
            )}
            {isOwner && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                    Delete Group
                </Button>
            )}
        </>
    );
}
