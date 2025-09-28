import { useEffect } from "react";
import { FetchUsers, CheckInUser, CreateUser } from "@/lib/api";
import type { UserEntry } from "@/types";
import React, { useState } from "react";
import DataTable from "@/components/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
const CapitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}
const CheckInPage = () => {
    const [players, setPlayers] = React.useState<UserEntry[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [checkedInPlayers, setCheckedInPlayers] = useState<Set<string>>(new Set());
    const columns: ColumnDef<UserEntry, unknown>[] = [
        { accessorKey: "full_name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                        Full Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                return CapitalizeWords(row.getValue("full_name"));
            }
        },
        { accessorKey: "name", header: "Name" },
        { accessorKey: "username", header: "Username" },
        {
            accessorKey: "checkIn",
            header: "Check In",
            cell: ({ row }) => {
                const rowData = row.original;
                return (
                    <Button onClick={() => checkinHandler(rowData)}>
                        {checkedInPlayers.has(rowData.username) ? "Remove" : "Check In"}
                    </Button>
                );
            }
        }
    ];
    const [newUser, setNewUser] = useState<{ full_name: string; name: string; username: string }>({
        full_name: '',
        name: '',
        username: ''
    });

    const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const checkinHandler = async (row: UserEntry) => {
        if (checkedInPlayers.has(row.username)) {
            console.log("Removing check-in for:", row);
            setCheckedInPlayers(prev => {
                const newSet = new Set(prev);
                newSet.delete(row.username);
                return newSet;
            });
            await CheckInUser(row.username, "remove", row.full_name, row.name);
            return;
        }
        console.log("Check-in button clicked for:", row);
        setCheckedInPlayers(prev => new Set(prev).add(row.username));
        await CheckInUser(row.username, "check-in", row.full_name, row.name);
    };
    
    const filteredPlayers = players.filter(player =>
        (player.full_name && player.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (player.name && player.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (player.username && player.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        console.log("Filtered players:", filteredPlayers);
    }, [filteredPlayers]);

    useEffect(() => {
        console.log("Checked-in players updated:", Array.from(checkedInPlayers));
    }, [checkedInPlayers]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await FetchUsers();
                setPlayers(response);

                if (response.length > 0) {
                    for (const user of response) {
                        console.log("User:", user);
                        if (user.has_checkin_today === 1) {
                            setCheckedInPlayers(prev => new Set(prev).add(user.username));
                        }
                    }
                    console.log("First User:", response[0]);
                }
                setLoading(false);
                console.log("Fetched Users:", response);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    return (
    <>
    <div className="p-4">
    {/* Searchable Table */}
    <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Search Users</h2>
        <input
            type="text"
            placeholder="Search by name or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded w-full mb-4"
        />
        {loading ? (
            <p>Loading users...</p>
        ) : (
            <>
                <DataTable columns={columns} data={filteredPlayers} />
                
                {filteredPlayers.length === 0 && (
                    <div className="mt-4 p-4 border rounded-md">
                        <h3 className="text-lg font-medium mb-3">Add New User</h3>
                        <div className="grid gap-4">
                            <div>
                                <label htmlFor="full_name" className="block text-sm mb-1">Full Name</label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    value={newUser.full_name}
                                    onChange={handleNewUserChange}
                                    placeholder="Full Name"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="name" className="block text-sm mb-1">Name</label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={newUser.name}
                                    onChange={handleNewUserChange}
                                    placeholder="Name"
                                    className="w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="username" className="block text-sm mb-1">Username</label>
                                <Input
                                    id="username"
                                    name="username"
                                    value={newUser.username}
                                    onChange={handleNewUserChange}
                                    placeholder="Username"
                                    className="w-full"
                                    required
                                />
                            </div>
                            <Button 
                                onClick={async () => {
                                    if (!newUser.name || !newUser.username) {
                                        alert("Name and Username are required");
                                        return;
                                    }
                                    console.log("Creating and checking in new user:", newUser);
                                    await CreateUser(newUser.full_name, newUser.name, newUser.username);
                                    setCheckedInPlayers(prev => new Set(prev).add(newUser.username));
                                    
                                    const newUserEntry: UserEntry = {
                                        _id: "",
                                        full_name: newUser.full_name,
                                        name: newUser.name,
                                        username: newUser.username,
                                        has_checkin_today: 1
                                    };
                                    
                                    await CheckInUser(newUser.username, "check-in", newUser.full_name, newUser.name);
                                    setPlayers(prev => [...prev, newUserEntry]);
                                    setNewUser({ full_name: '', name: '', username: '' });
                                    setSearchQuery("");
                                }}
                                className="w-full"
                            >
                                Add & Check In
                            </Button>
                        </div>
                    </div>
                )}
            </>
        )}
        </div>
    </div>
    </>
    );
};

export default CheckInPage;