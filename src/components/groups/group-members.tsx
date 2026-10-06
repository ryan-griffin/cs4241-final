import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { MemberCombobox } from "@/components/member-combobox";
import { Badge } from "@/components/ui/badge";
import { searchUsers } from "@/lib/auth-actions";

type Props = {
    groupId: string;
    members: string[];
    ownerId: string;
    user: string;
    onRemoveMember: (username: string) => void;
    onPickMember: (username: string) => void;
};

export function GroupMembers({
    groupId,
    members,
    ownerId,
    user,
    onRemoveMember,
    onPickMember,
}: Props) {
    const searchMembers = useCallback(
        (query: string) => searchUsers(query, groupId),
        [groupId],
    );

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm leading-none font-medium">Members</h3>
            {user === ownerId && (
                <MemberCombobox
                    onSearch={searchMembers}
                    onPick={onPickMember}
                />
            )}
            <div className="flex flex-wrap gap-2 lg:max-h-48 lg:overflow-y-auto">
                {members.map((member) => (
                    <Badge key={member} variant="secondary">
                        {member}
                        {user === ownerId && member !== ownerId && (
                            <button
                                type="button"
                                onClick={() => onRemoveMember(member)}
                                aria-label={`Remove ${member}`}
                                className="flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                            >
                                <HugeiconsIcon
                                    icon={Cancel01Icon}
                                    size={12}
                                    strokeWidth={2}
                                />
                            </button>
                        )}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
