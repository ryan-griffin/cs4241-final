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
import { signup } from "@/lib/auth-actions";

export default function SignupPage() {
    return (
        <>
            <CardHeader>
                <CardTitle>Sign up</CardTitle>
                <CardDescription>
                    Create an account to get started.
                </CardDescription>
                <CardAction>
                    <Link
                        href="/login"
                        className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                        })}
                    >
                        Log in
                    </Link>
                </CardAction>
            </CardHeader>
            <CardContent>
                <AuthForm action={signup} submitLabel="Sign up" />
            </CardContent>
        </>
    );
}
