import { Combobox } from "@base-ui/react/combobox";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type Props = {
    onSearch: (query: string) => Promise<string[]>;
    onPick: (username: string) => void;
};

export function MemberCombobox({ onSearch, onPick }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        let active = true;
        setLoading(true);
        setError("");
        setOptions([]);
        const timer = setTimeout(() => {
            onSearch(query)
                .then((users) => {
                    if (active) setOptions(users);
                })
                .catch(() => {
                    if (active) setError("Unable to search users.");
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [open, query, onSearch]);

    function pick(username: string) {
        setOpen(false);
        setQuery("");
        onPick(username);
    }

    return (
        <Combobox.Root
            items={options}
            filter={null}
            value={null}
            open={open}
            onOpenChange={setOpen}
            inputValue={query}
            onInputValueChange={setQuery}
            onValueChange={(username) => {
                if (username) pick(username);
            }}
        >
            <Combobox.Input
                render={<Input />}
                placeholder="Search for a user to add..."
                aria-label="Search for a user to add"
            />
            <Combobox.Portal>
                <Combobox.Positioner sideOffset={4} className="z-50">
                    <Combobox.Popup className="w-(--anchor-width) rounded-2xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
                        {(loading || error) && (
                            <p
                                aria-live="polite"
                                className="p-4 text-center text-sm text-muted-foreground"
                            >
                                {error || "Searching..."}
                            </p>
                        )}
                        <Combobox.Empty className="text-center text-sm text-muted-foreground">
                            {!loading && !error && (
                                <div className="p-4">No users found.</div>
                            )}
                        </Combobox.Empty>
                        <Combobox.List className="max-h-64 overflow-y-auto">
                            {(username: string) => (
                                <Combobox.Item
                                    key={username}
                                    value={username}
                                    className="cursor-pointer rounded-xl px-3 py-2 text-sm data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                                >
                                    {username}
                                </Combobox.Item>
                            )}
                        </Combobox.List>
                    </Combobox.Popup>
                </Combobox.Positioner>
            </Combobox.Portal>
        </Combobox.Root>
    );
}
