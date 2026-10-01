"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type AuthResult = { error: string } | undefined;

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
