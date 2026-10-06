import { redirect } from "next/navigation";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { RestaurantMap } from "@/components/restaurantMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getGroups, logout } from "@/lib/auth-actions";

export default async function Home() {
    if (!(await getCurrentUser())) redirect("/login");
    const groups = await getGroups();

    return (
        <main>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
                <h1 className="text-2xl font-semibold">Your groups</h1>
                <div className="flex items-center gap-2">
                    <CreateGroupDialog />
                    <form action={logout}>
                        <Button type="submit" variant="outline">
                            Log out
                        </Button>
                    </form>
                </div>
            </header>
            <div className="grid gap-6 p-6 lg:grid-cols-2">
                <div className="space-y-3">
                    {groups.length === 0 && (
                        <p className="text-muted-foreground">
                            Create a group to choose restaurants with friends.
                        </p>
                    )}
                    <ul className="grid content-start gap-3 sm:grid-cols-2">
                        {groups.map((group) => (
                            <li key={group.id} className="min-w-0">
                                <GroupCard group={group} />
                            </li>
                        ))}
                        <li className="min-w-0">
                            <CreateGroupDialog trigger="card" />
                        </li>
                    </ul>
                </div>
                <Card className="relative z-0 isolate min-h-130">
                    <CardHeader>
                        <CardTitle>Nearby restaurants</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                        <RestaurantMap />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
