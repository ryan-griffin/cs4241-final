"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";

type Group = {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    ownerId: string;
    members: string[];
};

export default function Home() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [addGroupMembersOpen, setAddGroupMembersOpen] = useState(false);
    function createGroup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = groupName.trim();
        if (!name) return;

        setGroups((currentGroups) => [
            {
                id: crypto.randomUUID(),
                name,
                status: "draft",
                createdAt: new Date(),
                ownerId: "user",
                members: ["user"],
            },
            ...currentGroups,
        ]);
        setGroupName("");
        setIsCreateOpen(false);
    }

    function addMemberToGroup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = groupName.trim();
        if (!name || !openGroupId) return;

        setGroups((currentGroups) =>
            currentGroups.map((group) =>
                group.id === openGroupId
                    ? {
                          ...group,
                          members: [...group.members, name],
                      }
                    : group,
            ),
        );
        setGroupName("");
        setAddGroupMembersOpen(false);
    }

    return (
        <main>
            <div className="border-b border-gray-200 pb-4 mb-4">
                {isCreateOpen ? (
                    <form onSubmit={createGroup}>
                        <input
                            maxLength={60}
                            required
                            value={groupName}
                            onChange={(event) =>
                                setGroupName(event.target.value)
                            }
                            className="border rounded px-2 py-1 mt-2 ml-2 mr-2 border-gray-300"
                        />
                        <Button type="submit">Create Group</Button>
                        <Button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                        >
                            Cancel
                        </Button>
                    </form>
                ) : (
                    <Button
                        className="mt-2 ml-2 mr-2"
                        variant="outline"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        Create Group
                    </Button>
                )}
                <form action={logout}>
                    <Button type="submit" variant="outline">
                        Log out
                    </Button>
                </form>
            </div>
            <ul className="flex flex-row flex-wrap gap-2 mt-2 space-y-2 ml-2">
                {groups.map((group) => (
                    <li key={group.id}>
                        <Button
                            variant="outline"
                            className="flex flex-col items-start justify-between w-full h-auto min-h-[140px] rounded-xl bg-white p-5 text-black shadow-sm text-left align-top"
                            onClick={() => setOpenGroupId(group.id)}
                        >
                            <div className="w-full">
                                <h3 className="font-semibold text-lg">
                                    {group.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {group.members?.length || 0} members
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">
                                    {group.members && group.members.length > 0
                                        ? group.members.join(", ")
                                        : "No members yet."}
                                </p>
                            </div>
                        </Button>
                    </li>
                ))}
            </ul>
            {groups.map(
                (group) =>
                    openGroupId === group.id && (
                        <div
                            key={group.id}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        >
                            <section
                                className="relative w-full max-w-2xl rounded-lg bg-white p-6 text-black shadow-xl"
                                role="dialog"
                            >
                                <div className="flex items-center justify-between border-b pb-4 mb-4">
                                    <h2 className="text-xl font-bold">
                                        {group.name}
                                    </h2>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setOpenGroupId(null)}
                                    >
                                        Close
                                    </Button>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        Group Members
                                    </h3>
                                    {group.members.length > 0 ? (
                                        <ul className="text-gray-700list-disc pl-5 space-y-1">
                                            {group.members.map((member) => (
                                                <li key={member}>{member}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500">
                                            No members
                                        </p>
                                    )}
                                    {addGroupMembersOpen ? (
                                        <form onSubmit={addMemberToGroup}>
                                            <input
                                                maxLength={60}
                                                required
                                                value={groupName}
                                                onChange={(event) =>
                                                    setGroupName(
                                                        event.target.value,
                                                    )
                                                }
                                                className="border rounded px-2 py-1 mt-2 ml-2 mr-2 border-gray-300"
                                            />
                                            <Button type="submit">
                                                Add Member
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setAddGroupMembersOpen(
                                                        false,
                                                    )
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </form>
                                    ) : (
                                        <Button
                                            className="mt-2 ml-2 mr-2"
                                            variant="outline"
                                            onClick={() =>
                                                setAddGroupMembersOpen(true)
                                            }
                                        >
                                            Add Member
                                        </Button>
                                    )}
                                </div>
                            </section>
                        </div>
                    ),
            )}
        </main>
    );
}
