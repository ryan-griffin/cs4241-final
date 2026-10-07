import { redirect } from "next/navigation";
import { DashboardSection } from "@/components/Home/Dashboard-section";
import { HomeSection } from "@/components/Home/home-section";
import { getCurrentUser } from "@/lib/auth";
import { getGroups } from "@/lib/auth-actions";

export default async function Home() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const groups = await getGroups();

    return (
        <main className="min-h-screen bg-[#DDE4D5]">
            <HomeSection username={user.username} />

            <DashboardSection groups={groups} />
        </main>
    );
}
