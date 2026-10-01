import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            "Missing AUTH_SECRET (min 32 chars). Generate one with `openssl rand -base64 32` and add it to .env.",
        );
    }
    return new TextEncoder().encode(secret);
}

async function createSessionToken(username: string): Promise<string> {
    return new SignJWT({ username })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE_SECONDS} sec`)
        .sign(getSecretKey());
}

async function verifySessionToken(token: string): Promise<string | null> {
    const key = getSecretKey();
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        });
        return typeof payload.username === "string" && payload.username
            ? payload.username
            : null;
    } catch {
        return null;
    }
}

export async function createSession(username: string): Promise<void> {
    const token = await createSessionToken(username);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
}

export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
        return null;
    }

    const username = await verifySessionToken(token);
    if (!username) {
        return null;
    }

    return db.user.findUnique({
        where: { username },
        select: { username: true },
    });
});
