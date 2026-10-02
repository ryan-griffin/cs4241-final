import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({
    children,
}: {
    children: ReactNode;
}) {
    if (await getCurrentUser()) {
        redirect("/");
    }

    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
            <Card>{children}</Card>
        </main>
    );
}
