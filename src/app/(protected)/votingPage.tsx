"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    type Group,
    getCurrentUsername,
    getGroups,
    logout,
} from "@/lib/auth-actions";

export default function VotingPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [user, setUser] = useState<string | null>(null);
    const [openGroupId, setOpenGroupId] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        getCurrentUsername().then((username) => {
            setUser(username);
        });

        getGroups().then((loadedGroups) => {
            if (isActive) {
                setGroups(loadedGroups);
            }
        });

        return () => {
            isActive = false;
        };
    }, []);

    return (
        <main>
            <div className="border-b border-gray-200 mb-4 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Button
                            className="mt-2 mr-2 mb-2 ml-2"
                            variant="outline"
                        >
                            Home
                        </Button>
                    </Link>
                </div>
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
            <div className="grid gap-6 p-4 lg:grid-cols-2">
                <ul className="flex flex-row flex-wrap content-start gap-2 mt-2 ml-2">
                    {groups
                        .filter((group) => group.status === "VOTING")
                        .map((group) => (
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
                                            {group.members?.length} members
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">
                                            {group.members?.join(", ")}
                                        </p>
                                    </div>
                                </Button>
                            </li>
                        ))}
                </ul>
            </div>
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

                                    <ul className="text-gray-700 list-disc pl-5 space-y-1">
                                        {group.members.map((member) => (
                                            <li key={member}>{member}</li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        </div>
                    ),
            )}
        </main>
    );
}
