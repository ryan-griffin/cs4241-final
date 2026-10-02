import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";

export default function Home() {
    return (
        <main>
            <form action={logout}>
                <Button type="submit" variant="outline">
                    Log out
                </Button>
            </form>
        </main>
    );
}
