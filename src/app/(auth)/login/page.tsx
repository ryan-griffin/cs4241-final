import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { buttonVariants } from "@/components/ui/button";
import {
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { login } from "@/lib/auth-actions";

export default function LoginPage() {
    return (
        <>
            <CardHeader>
                <CardTitle>Log in</CardTitle>
                <CardDescription>
                    Enter your username and password to log in.
                </CardDescription>
                <CardAction>
                    <Link
                        href="/signup"
                        className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                        })}
                    >
                        Sign up
                    </Link>
                </CardAction>
            </CardHeader>
            <CardContent>
                <AuthForm action={login} submitLabel="Log in" />
            </CardContent>
        </>
    );
}
