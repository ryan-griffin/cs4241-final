import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";
import { RestaurantMapCard } from "./restaurant-map-card";

type DashboardSectionProps = {
    groups: Awaited<ReturnType<typeof import("@/lib/auth-actions").getGroups>>;
};

export async function DashboardSection({ groups }: DashboardSectionProps) {
    return (
        <section
            id="dashboard"
            className="mx-auto max-w-7xl scroll-mt-6 px-4 py-20 sm:px-6 lg:px-8"
        >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#69765F]">
                        Dashboard
                    </p>

                    <h2 className="text-3xl font-bold tracking-tight text-[#26352A] sm:text-4xl">
                        Your Groups
                    </h2>

                    <p className="mt-2 text-[#596256]">
                        Continue deciding where to eat with your friends.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <CreateGroupDialog />

                    <form action={logout}>
                        <Button
                            type="submit"
                            variant="outline"
                            className="rounded-full border-[#AEB8A5] bg-transparent text-[#52604E] hover:bg-[#EEF1E9]"
                        >
                            Log out
                        </Button>
                    </form>
                </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
                <div>
                    {groups.length === 0 ? (
                        <div className="rounded-[2rem] border border-[#E4E6DC] bg-white p-8 shadow-sm">
                            <h3 className="text-lg font-semibold text-[#26352A]">
                                No groups yet
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#697268]">
                                Create your first group to start choosing
                                restaurants with your friends.
                            </p>

                            <div className="mt-6">
                                <CreateGroupDialog />
                            </div>
                        </div>
                    ) : (
                        <ul className="grid gap-4 sm:grid-cols-2">
                            {groups.map((group) => (
                                <li key={group.id} className="min-w-0">
                                    <GroupCard group={group} />
                                </li>
                            ))}

                            <li className="min-w-0">
                                <CreateGroupDialog trigger="card" />
                            </li>
                        </ul>
                    )}
                </div>

                <RestaurantMapCard />
            </div>
        </section>
    );
}
