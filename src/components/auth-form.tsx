"use client";

import { useActionState, useId } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthResult } from "@/lib/auth-actions";

type Props = {
    action: (prev: AuthResult, formData: FormData) => Promise<AuthResult>;
    submitLabel: string;
};

export function AuthForm({ action, submitLabel }: Props) {
    const [state, formAction, pending] = useActionState(action, undefined);
    const usernameId = useId();
    const passwordId = useId();

    return (
        <form
            action={formAction}
            className="flex w-full max-w-sm flex-col gap-4"
        >
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={usernameId}>Username</Label>
                <Input
                    id={usernameId}
                    name="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={32}
                    autoComplete="username"
                    pattern="[a-zA-Z0-9_]+"
                    title="Letters, numbers, and underscores only"
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={passwordId}>Password</Label>
                <Input
                    id={passwordId}
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete={
                        submitLabel === "Sign up"
                            ? "new-password"
                            : "current-password"
                    }
                />
            </div>
            {state?.error ? (
                <Alert variant="destructive">
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            ) : null}
            <Button type="submit" disabled={pending}>
                {pending ? "Please wait…" : submitLabel}
            </Button>
        </form>
    );
}
