"use client";

import { type FormEvent, useEffect, useState } from "react";
import { type Restaurant, RestaurantMap } from "@/components/restaurantMap";
import { Button } from "@/components/ui/button";

import {
    addMember as addMemberBE,
    addRestaurantTOGroup,
    calculateResults,
    createGroup as createGroupBE,
    deleteGroup as deleteGroupBE,
    type Group,
    getCurrentUsername,
    getGroups,
    groupToComplete,
    groupToVoting,
    logout,
    type Result,
    rateRestaurant,
    removeMember,
    removeRestaurantFromGroup,
} from "@/lib/auth-actions";

const ratingLabels: Record<number, string> = {
    1: "Won't go",
    2: "Don't want but would go",
    3: "Neutral",
    4: "Want",
    5: "Top choice",
};

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
    const [results, setResults] = useState<{
        groupName: string;
        restaurants: Result[];
    } | null>(null);
    const [calculatingResultsGroupId, setCalculatingResultsGroupId] = useState<
        string | null
    >(null);
    const [savingRating, setSavingRating] = useState<string | null>(null);

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
            if (result && "error" in result) {
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

    async function moveGroupToVoting(groupId: string) {
        setError("");
        try {
            const result = await groupToVoting(groupId);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setGroups(await getGroups());
            setOpenGroupId(null);
        } catch {
            setError("unable to move the group to voting");
        }
    }
    async function moveGroupToComplete(groupId: string) {
        setError("");
        try {
            const result = await groupToComplete(groupId);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setGroups(await getGroups());
            setOpenGroupId(null);
        } catch {
            setError("unable to move the group to complete");
        }
    }

    async function calculateGroupResults(groupId: string) {
        setError("");
        setCalculatingResultsGroupId(groupId);
        try {
            const result = await calculateResults(groupId);
            if ("error" in result) {
                setError(result.error);
                return;
            }
            const group = groups.find(({ id }) => id === groupId);
            if (!group) {
                setError("unable to find the group results");
                return;
            }
            setResults({ groupName: group.name, restaurants: result.results });
        } catch {
            setError("unable to calculate the group results");
        } finally {
            setCalculatingResultsGroupId(null);
        }
    }

    async function saveRating(
        groupId: string,
        restaurantId: string,
        score: number,
    ) {
        const key = `${groupId}:${restaurantId}`;
        setSavingRating(key);
        setError("");
        try {
            const result = await rateRestaurant(groupId, restaurantId, score);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setGroups((currentGroups) =>
                currentGroups.map((group) =>
                    group.id === groupId
                        ? {
                              ...group,
                              restaurants: group.restaurants.map(
                                  (restaurant) =>
                                      restaurant.id === restaurantId
                                          ? { ...restaurant, userRating: score }
                                          : restaurant,
                              ),
                          }
                        : group,
                ),
            );
        } catch {
            setError("unable to save your rating");
        } finally {
            setSavingRating(null);
        }
    }

    function openVotingGroup() {
        const votingGroup = groups.find((group) => group.status === "VOTING");
        if (votingGroup) {
            setError("");
            setOpenGroupId(votingGroup.id);
        } else {
            setError("No groups are currently voting");
        }
    }

    const selectedRestaurants =
        groups.find((group) => group.id === restaurantSelectionGroupId)
            ?.restaurants ?? [];
    const selectedRestaurantIds = new Set(
        selectedRestaurants.map((restaurant) => restaurant.yelpID),
    );
    const sortedNearbyRestaurants = [...nearbyRestaurants].sort((a, b) => {
        const selectedOrder =
            Number(selectedRestaurantIds.has(b.id)) -
            Number(selectedRestaurantIds.has(a.id));
        if (selectedOrder !== 0) {
            return selectedOrder;
        }

        const aDistance = Number.isFinite(a.distance) ? a.distance : undefined;
        const bDistance = Number.isFinite(b.distance) ? b.distance : undefined;
        if (aDistance === undefined) {
            return bDistance === undefined ? 0 : 1;
        }
        if (bDistance === undefined) {
            return -1;
        }
        return aDistance - bDistance;
    });

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
                    <div className="flex items-center gap-2">
                        <Button
                            className="mt-2 ml-2 mr-2 mb-2"
                            variant="outline"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            Create Group
                        </Button>
                    </div>
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

            {error && !openGroupId && !isCreateOpen && (
                <p className="mx-4 text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}

            <div className="grid gap-6 p-4 lg:grid-cols-2">
                <ul className="flex flex-row flex-wrap content-start gap-2 mt-2 ml-2">
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
                <section className="relative z-0 isolate flex min-h-[520px] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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
                                className="relative w-full max-w-3xl rounded-lg bg-white p-6 text-black shadow-xl"
                                role="dialog"
                            >
                                <div className="flex items-center justify-between border-b pb-4 mb-4">
                                    <h2 className="text-xl font-bold">
                                        {group.name}
                                    </h2>

                                    <div className="flex items-center gap-2">
                                        {user &&
                                            user !== group.ownerId &&
                                            group.status !== "VOTING" &&
                                            group.status !== "COMPLETE" && (
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
                                        {group.status === "VOTING" && (
                                            <>
                                                <Button
                                                    disabled={
                                                        calculatingResultsGroupId ===
                                                        group.id
                                                    }
                                                    onClick={() =>
                                                        calculateGroupResults(
                                                            group.id,
                                                        )
                                                    }
                                                >
                                                    {calculatingResultsGroupId ===
                                                    group.id
                                                        ? "Calculating..."
                                                        : "Calculate Results"}
                                                </Button>
                                                {user === group.ownerId && (
                                                    <Button
                                                        onClick={() =>
                                                            moveGroupToComplete(
                                                                group.id,
                                                            )
                                                        }
                                                    >
                                                        Move to Complete
                                                    </Button>
                                                )}
                                                {user &&
                                                    user !== group.ownerId && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                deleteMember(
                                                                    user,
                                                                )
                                                            }
                                                        >
                                                            Leave Group
                                                        </Button>
                                                    )}
                                            </>
                                        )}
                                        {group.status === "COMPLETE" && (
                                            <>
                                                <Button
                                                    disabled={
                                                        calculatingResultsGroupId ===
                                                        group.id
                                                    }
                                                    onClick={() =>
                                                        calculateGroupResults(
                                                            group.id,
                                                        )
                                                    }
                                                >
                                                    {calculatingResultsGroupId ===
                                                    group.id
                                                        ? "Calculating..."
                                                        : "Calculate Results"}
                                                </Button>
                                                {user === group.ownerId ? (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            deleteGroup(
                                                                group.id,
                                                            );
                                                            setOpenGroupId(
                                                                null,
                                                            );
                                                        }}
                                                    >
                                                        Delete Group
                                                    </Button>
                                                ) : (
                                                    user && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                deleteMember(
                                                                    user,
                                                                )
                                                            }
                                                        >
                                                            Leave Group
                                                        </Button>
                                                    )
                                                )}
                                            </>
                                        )}
                                        {group.status === "DRAFT" &&
                                            user === group.ownerId && (
                                                <>
                                                    <Button
                                                        onClick={() =>
                                                            moveGroupToVoting(
                                                                group.id,
                                                            )
                                                        }
                                                    >
                                                        Move to Voting
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            deleteGroup(
                                                                group.id,
                                                            );
                                                        }}
                                                    >
                                                        Delete Group
                                                    </Button>
                                                </>
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
                                {group.status === "VOTING" && (
                                    <section className="mt-6">
                                        <h3 className="mb-3 text-lg font-semibold">
                                            Rate the selected restaurants
                                        </h3>
                                        <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                                            {[1, 2, 3, 4, 5].map((score) => (
                                                <span
                                                    key={score}
                                                    className="whitespace-nowrap"
                                                >
                                                    {score} ={" "}
                                                    {ratingLabels[score]}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
                                            {group.restaurants.length > 0 ? (
                                                group.restaurants.map(
                                                    (restaurant) => {
                                                        const ratingKey = `${group.id}:${restaurant.id}`;
                                                        return (
                                                            <article
                                                                key={
                                                                    restaurant.id
                                                                }
                                                                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3"
                                                            >
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    {restaurant.imageUrl && (
                                                                        <img
                                                                            src={
                                                                                restaurant.imageUrl
                                                                            }
                                                                            alt=""
                                                                            className="h-16 w-16 rounded-lg object-cover"
                                                                        />
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-medium">
                                                                            {
                                                                                restaurant.name
                                                                            }
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600">
                                                                            {restaurant.YelpRating >
                                                                                0 &&
                                                                                `⭐ ${restaurant.YelpRating}`}
                                                                            {restaurant.price &&
                                                                                ` · ${restaurant.price}`}
                                                                        </p>
                                                                        {restaurant.address && (
                                                                            <p className="text-sm text-gray-500">
                                                                                {
                                                                                    restaurant.address
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <fieldset
                                                                    disabled={
                                                                        savingRating ===
                                                                        ratingKey
                                                                    }
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <legend className="sr-only">
                                                                        Rate{" "}
                                                                        {
                                                                            restaurant.name
                                                                        }
                                                                    </legend>
                                                                    {[
                                                                        1, 2, 3,
                                                                        4, 5,
                                                                    ].map(
                                                                        (
                                                                            score,
                                                                        ) => (
                                                                            <label
                                                                                key={
                                                                                    score
                                                                                }
                                                                                className="flex cursor-pointer items-center gap-1 text-sm"
                                                                                title={
                                                                                    ratingLabels[
                                                                                        score
                                                                                    ]
                                                                                }
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`rating-${group.id}-${restaurant.id}`}
                                                                                    value={
                                                                                        score
                                                                                    }
                                                                                    checked={
                                                                                        restaurant.userRating ===
                                                                                        score
                                                                                    }
                                                                                    aria-label={`${score} - ${ratingLabels[score]}`}
                                                                                    onChange={() =>
                                                                                        saveRating(
                                                                                            group.id,
                                                                                            restaurant.id,
                                                                                            score,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <span>
                                                                                    {
                                                                                        score
                                                                                    }
                                                                                </span>
                                                                            </label>
                                                                        ),
                                                                    )}
                                                                </fieldset>
                                                            </article>
                                                        );
                                                    },
                                                )
                                            ) : (
                                                <p className="text-sm text-gray-600">
                                                    No restaurants have been
                                                    selected for this group.
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </section>
                            {SelectRestaurantsOPen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                    <div className="w-full max-w-[37rem] rounded-lg bg-white p-6 shadow-lg">
                                        <div className="flex items-center justify-between gap-3">
                                            <h2 className="text-xl font-semibold">
                                                Select Restaurants
                                            </h2>
                                            <Button
                                                size="sm"
                                                className="ml-auto"
                                                onClick={() =>
                                                    setSelectedRestaurantsOpen(
                                                        false,
                                                    )
                                                }
                                            >
                                                Close
                                            </Button>
                                        </div>
                                        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                                            {sortedNearbyRestaurants.length >
                                            0 ? (
                                                sortedNearbyRestaurants.map(
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
                                                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                                                        <p className="font-medium">
                                                                            {
                                                                                restaurant.name
                                                                            }
                                                                        </p>
                                                                        <span className="text-sm text-gray-500">
                                                                            -
                                                                        </span>
                                                                        <a
                                                                            href={
                                                                                restaurant.url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-sm text-blue-600 hover:underline"
                                                                        >
                                                                            View
                                                                            on
                                                                            Yelp
                                                                        </a>
                                                                    </div>
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
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={async () => {
                                                                        if (
                                                                            !restaurantSelectionGroupId
                                                                        ) {
                                                                            return;
                                                                        }
                                                                        setError(
                                                                            "",
                                                                        );
                                                                        const selectedRestaurant =
                                                                            selectedRestaurants.find(
                                                                                (
                                                                                    selected,
                                                                                ) =>
                                                                                    selected.yelpID ===
                                                                                    restaurant.id,
                                                                            );
                                                                        const result =
                                                                            selectedRestaurant
                                                                                ? await removeRestaurantFromGroup(
                                                                                      restaurantSelectionGroupId,
                                                                                      selectedRestaurant.id,
                                                                                  )
                                                                                : await addRestaurantTOGroup(
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
                                                                        setGroups(
                                                                            await getGroups(),
                                                                        );
                                                                    }}
                                                                >
                                                                    {selectedRestaurantIds.has(
                                                                        restaurant.id,
                                                                    )
                                                                        ? "Remove"
                                                                        : "Select"}
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
                                    </div>
                                </div>
                            )}
                        </div>
                    ),
            )}
            {results && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4">
                    <section
                        className="w-full max-w-2xl rounded-lg bg-white p-6 text-black shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="results-title"
                    >
                        <div className="mb-4 flex items-center justify-between border-b pb-4">
                            <div>
                                <h2
                                    id="results-title"
                                    className="text-xl font-bold"
                                >
                                    Top Restaurants
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Results for {results.groupName}
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => setResults(null)}
                            >
                                Close
                            </Button>
                        </div>
                        {results.restaurants.length > 0 ? (
                            <ol className="max-h-[70vh] space-y-3 overflow-y-auto">
                                {results.restaurants.map((restaurant) => (
                                    <li
                                        key={restaurant.restaurantId}
                                        className="flex gap-4 rounded-lg border p-4"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <h3 className="font-semibold">
                                                    {restaurant.place}.{" "}
                                                    {restaurant.name}
                                                </h3>
                                                <p className="font-semibold">
                                                    Score: {restaurant.points}{" "}
                                                    points
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {restaurant.YelpRating > 0 &&
                                                    `⭐ ${restaurant.YelpRating}`}
                                                {restaurant.price &&
                                                    ` · ${restaurant.price}`}
                                            </p>
                                            {restaurant.address && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {restaurant.address}
                                                </p>
                                            )}
                                            {restaurant.yelpURL && (
                                                <a
                                                    href={restaurant.yelpURL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                                                >
                                                    View on Yelp
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-gray-600">
                                No restaurants have eligible votes yet.
                            </p>
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}
