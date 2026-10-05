"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, deleteSession, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type AuthResult = { error: string } | undefined;

export type Result = {
    place: number;
    restaurantId: string;
    name: string;
    points: number;
};

export type CalculateResultsResult = { error: string } | { results: Result[] };

export type Group = {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    ownerId: string;
    members: string[];
};

export async function getGroups(): Promise<Group[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("no user, log in");
    }

    const groups = await db.group.findMany({
        where: { members: { some: { userId: currentUser.username } } },
        include: { members: { select: { userId: true } } },
        orderBy: { createdAt: "desc" },
    });

    return groups.map((group) => ({
        id: group.id,
        name: group.name,
        status: group.status,
        createdAt: group.createdAt,
        ownerId: group.ownerId,
        members: group.members.map((member) => member.userId),
    }));
}

export async function createGroup(name: string): Promise<AuthResult> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { error: "no user, log in" };
    }

    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 60) {
        return { error: "group name must be under 60 characters" };
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

    await db.group.create({
        data: {
            name: normalizedName,
            ownerId: currentUser.username,
            members: { create: { userId: currentUser.username } },
        },
    });
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
}

/* 
Check user is log in 
check user own group
check if group still in draft 
prevents restaurant from bring added 2 times
create restaurant if it doesn't already exist
*/

export async function addRestaurantTOGroup(
    groupId: string,
    restaurant: {
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
    },
): Promise<AuthResult> {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return { error: "no user, log in" };
    }

    const group = await db.group.findFirst({
        where: {
            id: groupId,
            ownerId: currentUser.username,
            status: "DRAFT",
        },
        select: {
            id: true,
        },
    });

    if (!group) {
        return {
            error: "Only owner can select restaurant before voring starts",
        };
    }
    const existingRestairant = await db.restaurant.findUnique({
        where: {
            yelpID: restaurant.yelpID,
        },
        select: {
            id: true,
        },
    });

    let restaurantId = existingRestairant?.id;

    if (!restaurantId) {
        const newRestaurant = await db.restaurant.create({
            data: {
                yelpID: restaurant.yelpID,
                name: restaurant.name,
                imageUrl: restaurant.imageUrl ?? null,
                address: restaurant.address ?? null,
                city: restaurant.city ?? null,
                state: restaurant.state ?? null,
                ZipCode: restaurant.ZipCode ?? null,
                latitude: restaurant.latitude ?? null,
                longitude: restaurant.longitude ?? null,
                price: restaurant.price ?? null,
                YelpRating: restaurant.YelpRating,
                yelpURL: restaurant.yelpURL ?? null,
            },
            select: {
                id: true,
            },
        });
        restaurantId = newRestaurant.id;
    }
    const alreadySeleceted = await db.groupRestaurant.findUnique({
        where: {
            groupId_restaurantId: {
                groupId: group.id,
                restaurantId,
            },
        },
        select: {
            groupId: true,
        },
    });

    if (alreadySeleceted) {
        return { error: "restaurant is already selected." };
    }
    await db.groupRestaurant.create({
        data: {
            groupId: group.id,
            restaurantId,
        },
    });
}

export async function getCurrentUsername(): Promise<string | null> {
    const currentUser = await getCurrentUser();
    return currentUser?.username ?? null;
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

export async function groupToVoting(groupId: string): Promise<AuthResult> {
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
        return { error: "only the group owner can start voting." };
    }

    await db.group.update({
        where: { id: group.id },
        data: { status: "VOTING" },
    });
}

export async function groupToComplete(groupId: string): Promise<AuthResult> {
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
        return { error: "only the group owner can close voting." };
    }

    await db.group.update({
        where: { id: group.id },
        data: { status: "COMPLETE" },
    });
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
            ownerId: currentUser.username,
        },
        select: { id: true },
    });

    if (!group) {
        return { error: "only the group owner can compile results." };
    }

    const restaurants = await db.groupRestaurant.findMany({
        where: { groupId: group.id },
        include: {
            restaurant: { select: { id: true, name: true } },
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
        .map(({ restaurant, ratings }) => ({
            restaurantId: restaurant.id,
            name: restaurant.name,
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
