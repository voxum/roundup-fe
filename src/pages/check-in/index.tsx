import { useEffect } from "react";
import { FetchUsers, CheckInUser, CreateUser } from "@/lib/api";
import type { UserEntry } from "@/types";
import React, { useState } from "react";
import DataTable from "@/components/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { CapitalizeWords } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/date-picker";

const CheckInPage = () => {
    const [players, setPlayers] = React.useState<UserEntry[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [checkedInPlayers, setCheckedInPlayers] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    
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
        { accessorKey: "username", header: "Username" },
        {
            accessorKey: "tag",
            header: "Tag",
        },
        {
            accessorKey: "division",
            header: "Division",
            cell: ({ row }) => {
                const division = row.getValue("division");
                return CapitalizeWords((division as string) || "");
            }
        },
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
    const [newUser, setNewUser] = useState<{ full_name: string; division: string; username: string; tag: string, handicap: number }>({
        full_name: '',
        division: '',
        username: '',
        tag: '',
        handicap: 0
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
            await CheckInUser(row.username, "remove", row.tag);
            return;
        }
        console.log("Check-in button clicked for:", row);
        setCheckedInPlayers(prev => new Set(prev).add(row.username));
        await CheckInUser(row.username, "check-in", row.tag);
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
        <div className="flex justify-end mb-4">
                <DatePicker 
                    title="Round Date" 
                    default_date={selectedDate} 
                    changeHandler={(date) => {
                        if (date) {
                        setSelectedDate(date);
                        const formattedDate = date.toISOString().split('T')[0];
                        console.log("Selected date:", formattedDate);
                        }
                    }} 
                />
        </div>
        <h2 className="text-xl font-semibold mb-2"> Search Users </h2>
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
                                <label htmlFor="username" className="block text-sm mb-1">UDisc Username</label>
                                <Input
                                    id="username"
                                    name="username"
                                    value={newUser.username}
                                    onChange={handleNewUserChange}
                                    placeholder="Udisc Username"
                                    className="w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="handicap" className="block text-sm mb-1">Handicap</label>
                                <Input
                                    id="handicap"
                                    name="handicap"
                                    value={newUser.handicap}
                                    onChange={handleNewUserChange}
                                    placeholder="Handicap"
                                    className="w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="division" className="block text-sm mb-1">Division</label>
                                <Select
                                    value={newUser.division}
                                    onValueChange={(value: string) => setNewUser(prev => ({ ...prev, division: value }))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recreational">{CapitalizeWords("recreational")}</SelectItem>
                                        <SelectItem value="intermediate">{CapitalizeWords("intermediate")}</SelectItem>
                                        <SelectItem value="advanced">{CapitalizeWords("advanced")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="tag" className="block text-sm mb-1">Tag Number</label>
                                <Input
                                    id="tag"
                                    name="tag"
                                    value={newUser.tag}
                                    onChange={handleNewUserChange}
                                    placeholder="Tag Number"
                                    className="w-full"
                                    required
                                />
                            </div>
                            <Button 
                                onClick={async () => {
                                    if (!newUser.full_name || !newUser.username) {
                                        alert("Name and Username are required");
                                        return;
                                    }
                                    console.log("Creating and checking in new user:", newUser);
                                    await CreateUser(newUser.full_name, newUser.username, newUser.division, newUser.tag ? parseInt(newUser.tag) : 0);
                                    setCheckedInPlayers(prev => new Set(prev).add(newUser.username));
                                    
                                    const newUserEntry: UserEntry = {
                                        _id: "",
                                        full_name: newUser.full_name,
                                        username: newUser.username,
                                        has_checkin_today: 1,
                                        division: newUser.division,
                                        tag: newUser.tag ? parseInt(newUser.tag) : 0,
                                        handicap: newUser.handicap,
                                    };

                                    await CheckInUser(newUser.username, "check-in", newUser.tag ? parseInt(newUser.tag) : 0);
                                    setPlayers(prev => [...prev, newUserEntry]);
                                    setNewUser({ full_name: '', division: '', username: '', tag: '', handicap: 0 });
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