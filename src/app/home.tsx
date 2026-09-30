"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

type Group = {
    id: string;
    name: string;
    status: string;
};

export default function HomePage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [groupName, setGroupName] = useState("");

    function createGroup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = groupName.trim();
        if (!name) return;

        setGroups((currentGroups) => [
            { id: crypto.randomUUID(), name, status: "draft" },
            ...currentGroups,
        ]);
        setGroupName("");
        setIsCreateOpen(false);
    }

    return (
        <main>
            {isCreateOpen ? (
                <form onSubmit={createGroup}>
                    <input
                        aria-label="Group name"
                        maxLength={60}
                        required
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                    />
                    <Button type="submit">Create Group</Button>
                </form>
            ) : (
                <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                    Create Group
                </Button>
            )}
            <ul>
                {groups.map((group) => (
                    <li key={group.id}>{group.name}</li>
                ))}
            </ul>
        </main>
    );
}
