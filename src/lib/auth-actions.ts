"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { GroupStatus, Restaurant } from "@/generated/prisma/client";
import { createSession, deleteSession, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type AuthResult = { error: string } | undefined;

type RestaurantDetails = Pick<
    Restaurant,
    "name" | "imageUrl" | "address" | "price" | "YelpRating" | "yelpURL"
>;

export type Result = RestaurantDetails & {
    place: number;
    restaurantId: string;
    points: number;
};

export type CalculateResultsResult = { error: string } | { results: Result[] };

export type Group = {
    id: string;
    name: string;
    status: GroupStatus;
    ownerId: string;
    members: string[];
    restaurants: (RestaurantDetails &
        Pick<Restaurant, "id" | "yelpID" | "latitude" | "longitude"> & {
            userRating: number | null;
        })[];
};

export type GroupSummary = Pick<Group, "id" | "name" | "status" | "members">;

const groupSummarySelect = {
    id: true,
    name: true,
    status: true,
    members: { select: { userId: true } },
} as const;

const restaurantDetailsSelect = {
    name: true,
    imageUrl: true,
    address: true,
    price: true,
    YelpRating: true,
    yelpURL: true,
} as const;

export type RestaurantInput = {
    yelpID: string;
    name: string;
    imageUrl?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    ZipCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    price?: string | null;
    YelpRating: number;
    yelpURL?: string | null;
};

function restaurantLink(restaurant: RestaurantInput) {
    return {
        restaurant: {
            connectOrCreate: {
                where: { yelpID: restaurant.yelpID },
                create: {
                    yelpID: restaurant.yelpID,
                    name: restaurant.name,
                    imageUrl: restaurant.imageUrl,
                    address: restaurant.address,
                    city: restaurant.city,
                    state: restaurant.state,
                    ZipCode: restaurant.ZipCode,
                    latitude: restaurant.latitude,
                    longitude: restaurant.longitude,
                    price: restaurant.price,
                    YelpRating: restaurant.YelpRating,
                    yelpURL: restaurant.yelpURL,
                },
            },
        },
    };
}

function revalidateGroup(groupId: string) {
    revalidatePath("/");
    revalidatePath(`/groups/${groupId}`);
}

export async function getGroups(): Promise<GroupSummary[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("no user, log in");

    const groups = await db.group.findMany({
        where: { members: { some: { userId: currentUser.username } } },
        select: groupSummarySelect,
        orderBy: { createdAt: "desc" },
    });

    return groups.map((group) => ({
        ...group,
        members: group.members.map((member) => member.userId),
    }));
}

export async function getGroup(groupId: string): Promise<Group | null> {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("no user, log in");

    const group = await db.group.findFirst({
        where: {
            id: groupId,
            members: { some: { userId: currentUser.username } },
        },
        select: {
            ...groupSummarySelect,
            ownerId: true,
            restaurants: {
                include: {
                    restaurant: {
                        select: {
                            ...restaurantDetailsSelect,
                            id: true,
                            yelpID: true,
                            latitude: true,
                            longitude: true,
                        },
                    },
                    ratings: {
                        where: { userId: currentUser.username },
                        select: { score: true },
                    },
                },
            },
        },
    });
    if (!group) return null;

    return {
        ...group,
        members: group.members.map((member) => member.userId),
        restaurants: group.restaurants.map(({ restaurant, ratings }) => ({
            ...restaurant,
            userRating: ratings[0]?.score ?? null,
        })),
    };
}

export async function createGroup(
    name: string,
): Promise<{ error: string } | { id: string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }

    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 60) {
        return { error: "group name must be between 1 and 60 characters" };
    }

    const existing = await db.group.findUnique({
        where: {
            ownerId_name: {
                ownerId: currentUser.username,
                name: normalizedName,
            },
        },
        select: { id: true },
    });
    if (existing) {
        return { error: "you already have a group with that name" };
    }

    const created = await db.group.create({
        data: {
            name: normalizedName,
            ownerId: currentUser.username,
            members: { create: { userId: currentUser.username } },
        },
        select: { id: true },
    });
    revalidatePath("/");
    return { id: created.id };
}

export async function renameGroup(
    groupId: string,
    name: string,
): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }

    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 60) {
        return { error: "group name must be between 1 and 60 characters" };
    }

    const group = await db.group.findFirst({
        where: {
            id: groupId,
            ownerId: currentUser.username,
        },
        select: { id: true },
    });
    if (!group) {
        return { error: "only the group owner can rename the group." };
    }

    const existing = await db.group.findUnique({
        where: {
            ownerId_name: {
                ownerId: currentUser.username,
                name: normalizedName,
            },
        },
        select: { id: true },
    });
    if (existing && existing.id !== group.id) {
        return { error: "you already have a group with that name" };
    }

    await db.group.update({
        where: { id: group.id },
        data: { name: normalizedName },
    });
    revalidateGroup(groupId);
}

export async function addMember(
    groupId: string,
    username: string,
): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(normalizedUsername)) {
        return { error: "invalid username" };
    }

    const group = await db.group.findFirst({
        where: {
            id: groupId,
            ownerId: currentUser.username,
        },
        select: {
            id: true,
            members: {
                where: { userId: normalizedUsername },
                select: { userId: true },
            },
        },
    });
    if (!group) {
        return { error: "only the group owner can add members." };
    }

    const user = await db.user.findUnique({
        where: { username: normalizedUsername },
        select: { username: true },
    });
    if (!user) {
        return { error: "username does not exist." };
    }

    if (group.members.length > 0) {
        return { error: "user is already a member" };
    }

    await db.groupMembership.create({
        data: { groupId: group.id, userId: user.username },
    });
    revalidateGroup(groupId);
}

export async function removeMember(
    groupId: string,
    username: string,
): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(normalizedUsername)) {
        return { error: "invalid username" };
    }

    const group = await db.group.findFirst({
        where: { id: groupId },
        select: {
            id: true,
            ownerId: true,
            members: {
                where: { userId: normalizedUsername },
                select: { userId: true },
            },
        },
    });
    if (!group) {
        return { error: "group does not exist." };
    }

    if (group.members.length === 0) {
        return { error: "user is not a member" };
    }

    if (normalizedUsername === group.ownerId) {
        return { error: "group owner cannot leave" };
    }

    if (
        currentUser.username !== group.ownerId &&
        currentUser.username !== normalizedUsername
    ) {
        return { error: "only the group owner can remove other members" };
    }

    await db.groupMembership.delete({
        where: {
            groupId_userId: { groupId: group.id, userId: normalizedUsername },
        },
    });
    revalidateGroup(groupId);
}

export async function deleteGroup(groupId: string): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }

    const group = await db.group.findFirst({
        where: {
            id: groupId,
            ownerId: currentUser.username,
        },
        select: { id: true },
    });
    if (!group) {
        return { error: "only the group owner can delete the group." };
    }

    await db.group.delete({ where: { id: group.id } });
    revalidateGroup(groupId);
}

export async function searchUsers(
    query: string,
    groupId: string,
): Promise<string[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }

    const group = await db.group.findFirst({
        where: { id: groupId, ownerId: currentUser.username },
        select: { members: { select: { userId: true } } },
    });
    if (!group) return [];

    const users = await db.user.findMany({
        where: {
            username: {
                contains: query.trim().toLowerCase(),
                notIn: group.members.map((member) => member.userId),
            },
        },
        select: { username: true },
        orderBy: { username: "asc" },
        take: 15,
    });
    return users.map((user) => user.username);
}

export async function setGroupRestaurants(
    groupId: string,
    selectedYelpIds: string[],
    newRestaurants: RestaurantInput[],
): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }
    const group = await db.group.findFirst({
        where: { id: groupId, ownerId: currentUser.username, status: "DRAFT" },
        select: {
            restaurants: {
                select: {
                    restaurantId: true,
                    restaurant: { select: { yelpID: true } },
                },
            },
        },
    });
    if (!group) {
        return {
            error: "only the owner can select restaurants before voting starts",
        };
    }
    const selectedIds = new Set(selectedYelpIds);
    const currentIds = new Set(
        group.restaurants.map(({ restaurant }) => restaurant.yelpID),
    );
    const suppliedRestaurants = new Map(
        newRestaurants.map((restaurant) => [restaurant.yelpID, restaurant]),
    );
    const additions: RestaurantInput[] = [];
    for (const id of selectedIds) {
        if (!currentIds.has(id)) {
            const restaurant = suppliedRestaurants.get(id);
            if (!restaurant) {
                return {
                    error: "a selected restaurant is no longer available",
                };
            }
            additions.push(restaurant);
        }
    }
    await db.group.update({
        where: { id: groupId, ownerId: currentUser.username, status: "DRAFT" },
        data: {
            restaurants: {
                deleteMany: {
                    restaurantId: {
                        in: group.restaurants
                            .filter(
                                ({ restaurant }) =>
                                    !selectedIds.has(restaurant.yelpID),
                            )
                            .map(({ restaurantId }) => restaurantId),
                    },
                },
                create: additions.map(restaurantLink),
            },
        },
    });
    revalidateGroup(groupId);
}

export async function signup(
    _prev: AuthResult,
    formData: FormData,
): Promise<AuthResult> {
    const username = String(formData.get("username") ?? "")
        .trim()
        .toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
        return {
            error: "Username must be 3–32 characters: letters, numbers, or underscores.",
        };
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        return {
            error: "Password must be at least 8 characters and at most 72 bytes.",
        };
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
        return { error: "That username is taken." };
    }

    await db.user.create({
        data: { username, passwordHash: await bcrypt.hash(password, 12) },
    });
    await createSession(username);
    redirect("/");
}

export async function login(
    _prev: AuthResult,
    formData: FormData,
): Promise<AuthResult> {
    const username = String(formData.get("username") ?? "")
        .trim()
        .toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!username || !password) {
        return { error: "Enter your username and password." };
    }

    const user = await db.user.findUnique({ where: { username } });
    if (
        !user ||
        Buffer.byteLength(password, "utf8") > 72 ||
        !(await bcrypt.compare(password, user.passwordHash))
    ) {
        return { error: "Invalid username or password." };
    }

    await createSession(user.username);
    redirect("/");
}

export async function logout(): Promise<void> {
    await deleteSession();
    redirect("/login");
}

async function transitionGroup(
    groupId: string,
    status: "DRAFT" | "VOTING",
): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }
    const where = { id: groupId, ownerId: currentUser.username, status };
    const group = await db.group.findFirst({
        where,
        select: { id: true },
    });

    if (!group) {
        return {
            error:
                status === "DRAFT"
                    ? "only the group owner can start voting for a draft group."
                    : "only the group owner can close a group that is voting.",
        };
    }

    await db.group.update({
        where,
        data: { status: status === "DRAFT" ? "VOTING" : "COMPLETE" },
    });
    revalidateGroup(groupId);
}

export async function groupToVoting(groupId: string): Promise<AuthResult> {
    return transitionGroup(groupId, "DRAFT");
}

export async function completeVoting(
    groupId: string,
): Promise<CalculateResultsResult> {
    const result = await transitionGroup(groupId, "VOTING");
    if (result?.error) return result;
    return calculateResults(groupId);
}

export async function rateRestaurant(
    groupId: string,
    restaurantId: string,
    score: number,
): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
        return { error: "rating must be between 1 and 5." };
    }

    const group = await db.group.findFirst({
        where: {
            id: groupId,
            status: "VOTING",
            members: { some: { userId: currentUser.username } },
        },
        select: { id: true },
    });
    if (!group) {
        return { error: "you must be a group member to rate during voting." };
    }

    const groupRestaurant = await db.groupRestaurant.findUnique({
        where: {
            groupId_restaurantId: {
                groupId: group.id,
                restaurantId,
            },
        },
        select: { groupId: true },
    });
    if (!groupRestaurant) {
        return { error: "restaurant is not selected for this group." };
    }

    await db.rating.upsert({
        where: {
            groupId_restaurantId_userId: {
                groupId: group.id,
                restaurantId,
                userId: currentUser.username,
            },
        },
        create: {
            groupId: group.id,
            restaurantId,
            userId: currentUser.username,
            score,
        },
        update: { score },
    });
    revalidateGroup(groupId);
}

export async function calculateResults(
    groupId: string,
): Promise<CalculateResultsResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }
    const group = await db.group.findFirst({
        where: {
            id: groupId,
            OR: [
                { ownerId: currentUser.username },
                {
                    status: "COMPLETE",
                    members: { some: { userId: currentUser.username } },
                },
            ],
        },
        select: { id: true, status: true },
    });

    if (!group) {
        return {
            error: "you must be the owner or a member of a completed group to view results.",
        };
    }
    if (group.status !== "VOTING" && group.status !== "COMPLETE") {
        return {
            error: "results can only be calculated during voting or completion.",
        };
    }

    const restaurants = await db.groupRestaurant.findMany({
        where: { groupId: group.id },
        include: {
            restaurant: {
                select: {
                    ...restaurantDetailsSelect,
                    id: true,
                },
            },
            ratings: { select: { score: true } },
        },
    });

    const pointsByScore: Record<number, number> = {
        2: 1,
        3: 3,
        4: 4,
        5: 5,
    };

    const results = restaurants
        .filter(
            ({ ratings }) =>
                ratings.length > 0 &&
                !ratings.some((rating) => rating.score === 1),
        )
        .map(({ restaurant: { id, ...details }, ratings }) => ({
            ...details,
            restaurantId: id,
            points: ratings.reduce((total, rating) => {
                const points = pointsByScore[rating.score];
                if (points === undefined) {
                    throw new Error(`invalid rating score: ${rating.score}`);
                }
                return total + points;
            }, 0),
        }))
        .sort(
            (first, second) =>
                second.points - first.points ||
                first.name.localeCompare(second.name),
        )
        .slice(0, 3)
        .map((result, index) => ({ ...result, place: index + 1 }));

    return { results };
}
