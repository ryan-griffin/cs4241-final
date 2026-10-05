"use client";

import { type FormEvent, useEffect, useState } from "react";
import { type Restaurant, RestaurantMap } from "@/components/restaurantMap";
import { Button } from "@/components/ui/button";
import {
    addMember as addMemberBE,
    addRestaurantTOGroup,
    createGroup as createGroupBE,
    deleteGroup as deleteGroupBE,
    type Group,
    getCurrentUsername,
    getGroups,
    logout,
    removeMember,
} from "@/lib/auth-actions";

export default function Home() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [memberUsername, setMemberUsername] = useState("");
    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [SelectRestaurantsOPen, setSelectedRestaurantsOpen] = useState(false);
    const [addGroupMembersOpen, setAddGroupMembersOpen] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState<string | null>(null);
    const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>(
        [],
    );
    const [restaurantSelectionGroupId, setRestaurantSelectionGroupId] =
        useState<string | null>(null);

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
                    setError("unable to load groups");
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
    async function deleteMember(username: string) {
        if (!openGroupId) return;

        setError("");
        try {
            const result = await removeMember(openGroupId, username);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setGroups(await getGroups());
            if (username === user) {
                setOpenGroupId(null);
            }
        } catch {
            setError("unable to remove the group member");
        }
    }

    async function deleteGroup(groupId: string) {
        setError("");
        try {
            const result = await deleteGroupBE(groupId);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setGroups(await getGroups());
            setOpenGroupId(null);
        } catch {
            setError("unable to delete the group");
        }
    }
    return (
        <main>
            <div className="border-b border-gray-200 mb-4 flex justify-between items-center flex-wrap gap-2">
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
                            className="border rounded px-2 py-1 ml-2 mr-2 border-gray-300"
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
                                className="ml-2 text-sm text-red-600"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
                    </form>
                ) : (
                    <Button
                        className="mt-2 ml-2 mr-2 mb-2"
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

            <div className="grid gap-6 p-4 lg:grid-cols-2">
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

                <section className="flex min-h-[520px] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-lg font-semibold">
                        Nearby Restaurants
                    </h2>
                    <RestaurantMap
                        onRestaurantsLoaded={(restaurants) => {
                            setNearbyRestaurants(restaurants);
                        }}
                    />
                </section>
            </div>

            {groups.map(
                (group) =>
                    openGroupId === group.id && (
                        <div
                            key={group.id}
                            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
                        >
                            <section
                                className="relative w-full max-w-2xl rounded-lg bg-white p-6 text-black shadow-xl"
                                role="dialog"
                            >
                                <div className="flex items-center justify-between border-b pb-4 mb-4">
                                    <h2 className="text-xl font-bold">
                                        {group.name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        {user !== group.ownerId && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    deleteMember(user || "")
                                                }
                                            >
                                                Leave Group
                                            </Button>
                                        )}

                                        {user === group.ownerId &&
                                            group.status === "DRAFT" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setRestaurantSelectionGroupId(
                                                            group.id,
                                                        );
                                                        setSelectedRestaurantsOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Select Restaurants
                                                </Button>
                                            )}
                                        {user === group.ownerId && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    deleteGroup(group.id);
                                                    setOpenGroupId(null);
                                                }}
                                            >
                                                Delete Group
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            onClick={() => setOpenGroupId(null)}
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>

                                {error && (
                                    <p
                                        className="mb-4 text-sm text-red-600"
                                        role="alert"
                                    >
                                        {error}
                                    </p>
                                )}

                                <div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        Group Members
                                    </h3>
                                    {group.members.length > 0 ? (
                                        <ul className="text-gray-700 list-disc pl-5 space-y-1">
                                            {group.members.map((member) => (
                                                <li key={member}>
                                                    {member}
                                                    {user === group.ownerId &&
                                                        member !==
                                                            group.ownerId && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="ml-2"
                                                                onClick={() =>
                                                                    deleteMember(
                                                                        member,
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        )}
                                                </li>
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
                            {SelectRestaurantsOPen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
                                        <h2 className="text-xl font-semibold">
                                            Select Restaurants
                                        </h2>

                                        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                                            {nearbyRestaurants.length > 0 ? (
                                                nearbyRestaurants.map(
                                                    (restaurant) => (
                                                        <div
                                                            key={restaurant.id}
                                                            className="flex items-center justify-between rounded-lg border p-3"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {restaurant.image_url && (
                                                                    <img
                                                                        src={
                                                                            restaurant.image_url
                                                                        }
                                                                        alt={
                                                                            restaurant.name
                                                                        }
                                                                        className="h-16 w-16 rounded-lg object-cover"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {
                                                                            restaurant.name
                                                                        }
                                                                    </p>
                                                                    {restaurant.categories &&
                                                                        restaurant
                                                                            .categories
                                                                            .length >
                                                                            0 && (
                                                                            <p className="text-sm text-gray-600">
                                                                                {restaurant.categories
                                                                                    .map(
                                                                                        (
                                                                                            category,
                                                                                        ) =>
                                                                                            category.title,
                                                                                    )
                                                                                    .join(
                                                                                        ", ",
                                                                                    )}
                                                                            </p>
                                                                        )}
                                                                    <div className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-600">
                                                                        {restaurant.rating !==
                                                                            undefined && (
                                                                            <span>
                                                                                ⭐️{" "}
                                                                                {
                                                                                    restaurant.rating
                                                                                }
                                                                            </span>
                                                                        )}
                                                                        {restaurant.price && (
                                                                            <span>
                                                                                {
                                                                                    restaurant.price
                                                                                }{" "}
                                                                            </span>
                                                                        )}
                                                                        {restaurant.review_count !==
                                                                            undefined && (
                                                                            <span>
                                                                                {
                                                                                    restaurant.review_count
                                                                                }{" "}
                                                                                reviews{" "}
                                                                            </span>
                                                                        )}
                                                                        {restaurant
                                                                            .business_hours?.[0] && (
                                                                            <p className="text-sm">
                                                                                {restaurant
                                                                                    .business_hours[0]
                                                                                    .is_open_now ? (
                                                                                    <span className="font-medium text-green-600">
                                                                                        Open
                                                                                        Now
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-medium text-red-600">
                                                                                        Closed
                                                                                        Now
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-500">
                                                                        {restaurant.location.display_address.join(
                                                                            ", ",
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <a
                                                                    href={
                                                                        restaurant.url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-blue-600 hover:underline"
                                                                >
                                                                    View on Yelp
                                                                </a>

                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={async () => {
                                                                        console.log(
                                                                            "Selecting restaurant:",
                                                                            restaurant.name,
                                                                            "Group ID:",
                                                                            restaurantSelectionGroupId,
                                                                        );
                                                                        if (
                                                                            !restaurantSelectionGroupId
                                                                        ) {
                                                                            return;
                                                                        }
                                                                        const result =
                                                                            await addRestaurantTOGroup(
                                                                                restaurantSelectionGroupId,
                                                                                {
                                                                                    yelpID: restaurant.id,
                                                                                    name: restaurant.name,
                                                                                    imageUrl:
                                                                                        restaurant.image_url ??
                                                                                        null,
                                                                                    address:
                                                                                        restaurant.location.display_address.join(
                                                                                            ", ",
                                                                                        ),
                                                                                    latitude:
                                                                                        restaurant
                                                                                            .coordinates
                                                                                            .latitude,
                                                                                    longitude:
                                                                                        restaurant
                                                                                            .coordinates
                                                                                            .longitude,
                                                                                    price:
                                                                                        restaurant.price ??
                                                                                        null,
                                                                                    YelpRating:
                                                                                        restaurant.rating ??
                                                                                        0,
                                                                                    yelpURL:
                                                                                        restaurant.url,
                                                                                },
                                                                            );
                                                                        if (
                                                                            result?.error
                                                                        ) {
                                                                            setError(
                                                                                result.error,
                                                                            );
                                                                            return;
                                                                        }
                                                                    }}
                                                                >
                                                                    select
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <p className="text-sm text-gray-500">
                                                    No Nearby restaurants found
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            className="mt-4"
                                            onClick={() =>
                                                setSelectedRestaurantsOpen(
                                                    false,
                                                )
                                            }
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ),
            )}
        </main>
    );
}
