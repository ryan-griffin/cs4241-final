"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    addMember as addMemberBE,
    createGroup as createGroupBE,
    type Group,
    getCurrentUsername,
    getGroups,
    logout,
} from "@/lib/auth-actions";

export default function Home() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [memberUsername, setMemberUsername] = useState("");
    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [addGroupMembersOpen, setAddGroupMembersOpen] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        getCurrentUsername().then((username) => {
            setUser(username);
        });

        getGroups()
            .then((loadedGroups) => {
                if (isActive) {
                    setGroups(loadedGroups);
                }
            })
            .catch(() => {
                if (isActive) {
                    setError("unable to load  groups");
                }
            });

        return () => {
            isActive = false;
        };
    }, []);

    async function createGroup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = groupName.trim();
        if (!name) return;

        setError("");
        try {
            const result = await createGroupBE(name);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setGroups(await getGroups());
            setGroupName("");
            setIsCreateOpen(false);
        } catch {
            setError("unable to create the group");
        }
    }

    async function addMemberToGroup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const username = memberUsername.trim();
        if (!username || !openGroupId) return;

        setError("");
        try {
            const result = await addMemberBE(openGroupId, username);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setGroups(await getGroups());
            setMemberUsername("");
            setAddGroupMembersOpen(false);
        } catch {
            setError("unable to add the group member");
        }
    }

    return (
        <main>
            <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center flex-wrap gap-2">
                {isCreateOpen ? (
                    <form
                        onSubmit={createGroup}
                        className="flex items-center flex-wrap gap-2"
                    >
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
                            onClick={() => {
                                setIsCreateOpen(false);
                                setError("");
                            }}
                        >
                            Cancel
                        </Button>
                        {error && (
                            <p
                                className="mb-4 ml-2 text-sm text-red-600"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
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
                    <Button
                        type="submit"
                        variant="outline"
                        className="border rounded px-2 py-1 mt-2 ml-2 mr-2 border-gray-300"
                    >
                        Log Out
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
                                        <ul className="text-gray-700 list-disc pl-5 space-y-1">
                                            {group.members.map((member) => (
                                                <li key={member}>{member}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500">
                                            No members
                                        </p>
                                    )}
                                    {user === group.ownerId &&
                                        (addGroupMembersOpen ? (
                                            <form onSubmit={addMemberToGroup}>
                                                <input
                                                    maxLength={32}
                                                    required
                                                    value={memberUsername}
                                                    onChange={(event) =>
                                                        setMemberUsername(
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
                                                    onClick={() => {
                                                        setAddGroupMembersOpen(
                                                            false,
                                                        );
                                                        setMemberUsername("");
                                                        setError("");
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                {error && (
                                                    <p
                                                        className="mb-4 ml-2 text-sm text-red-600"
                                                        role="alert"
                                                    >
                                                        {error}
                                                    </p>
                                                )}
                                            </form>
                                        ) : (
                                            <Button
                                                className="mt-2 ml-2 mr-2"
                                                variant="outline"
                                                onClick={() => {
                                                    setAddGroupMembersOpen(
                                                        true,
                                                    );
                                                    setError("");
                                                }}
                                            >
                                                Add Member
                                            </Button>
                                        ))}
                                </div>
                            </section>
                        </div>
                    ),
            )}
        </main>
    );
}
