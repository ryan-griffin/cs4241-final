import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedLayout({
    children,
}: {
    children: ReactNode;
}) {
    if (!(await getCurrentUser())) {
        redirect("/login");
    }

    return children;
}
