"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroup } from "@/lib/auth-actions";

export function CreateGroupDialog({
    trigger = "button",
}: {
    trigger?: "button" | "card";
}) {
    const router = useRouter();
    const nameId = useId();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function changeOpen(next: boolean) {
        if (saving) return;
        setOpen(next);
        setName("");
        setError("");
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!name.trim() || saving) return;
        setSaving(true);
        setError("");
        try {
            const result = await createGroup(name);
            if ("error" in result) {
                setError(result.error);
                return;
            }
            setOpen(false);
            setName("");
            router.push(`/groups/${result.id}`);
            router.refresh();
        } catch {
            setError("Unable to create the group.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger
                aria-label="Create group"
                render={
                    trigger === "card" ? (
                        <button
                            type="button"
                            className="flex h-full min-h-35 w-full items-center justify-center rounded-2xl bg-card text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                        />
                    ) : (
                        <Button />
                    )
                }
            >
                {trigger === "card" ? (
                    <HugeiconsIcon
                        icon={Add01Icon}
                        className="size-8"
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                ) : (
                    "Create group"
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create group</DialogTitle>
                    <DialogDescription>
                        Name your group. You can add members and restaurants on
                        the next page.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit}>
                    <fieldset disabled={saving} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={nameId}>Group name</Label>
                            <Input
                                id={nameId}
                                maxLength={60}
                                required
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => changeOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!name.trim()}>
                                {saving ? "Creating..." : "Create group"}
                            </Button>
                        </DialogFooter>
                    </fieldset>
                </form>
            </DialogContent>
        </Dialog>
    );
}
