import { useEffect } from "react";
import { FetchUsers, CheckInUser, CreateUser } from "@/lib/api";
import type { UserEntry } from "@/types";
import React, { useState } from "react";
import DataTable from "@/components/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Search, UserPlus, Users, CheckCircle, XCircle } from "lucide-react";
import { CapitalizeWords } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                const isCheckedIn = checkedInPlayers.has(rowData.username);
                return (
                    <Button 
                        onClick={() => checkinHandler(rowData)}
                        className={`${
                            isCheckedIn 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                        } font-medium transition-all duration-200 transform hover:scale-105`}
                    >
                        {isCheckedIn ? (
                            <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Remove
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Check In
                            </>
                        )}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
            <Card className="mb-6 shadow-lg border-2 border-blue-200 overflow-hidden p-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-0 px-4 py-3">
                    <CardTitle className="text-2xl font-bold flex items-center m-0">
                        <Users className="w-8 h-8 mr-3" />
                        Player Check-In System
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">Search Users</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
                        />
                    </div>
                </CardContent>
            </Card>
        {loading ? (
            <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-lg text-gray-600">Loading users...</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <>
                <Card className="shadow-lg border-2 border-gray-200 mb-6 p-0">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b p-0 px-4 py-3">
                        <CardTitle className="text-xl font-semibold text-gray-700 flex items-center m-0">
                            <Users className="w-6 h-6 mr-2" />
                                Players ({filteredPlayers.length} found)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                            <DataTable columns={columns} data={filteredPlayers} />
                        </div>
                    </CardContent>
                </Card>                
                {filteredPlayers.length === 0 && (
                    <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden p-0">
                        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-0 px-4 py-3">
                            <CardTitle className="text-xl font-bold flex items-center m-0">
                                <UserPlus className="w-6 h-6 mr-2" />
                                Add New User
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid gap-6">
                                <div>
                                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        value={newUser.full_name}
                                        onChange={handleNewUserChange}
                                        placeholder="Enter full name..."
                                        className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">UDisc Username</label>
                                    <Input
                                        id="username"
                                        name="username"
                                        value={newUser.username}
                                        onChange={handleNewUserChange}
                                        placeholder="Enter UDisc username..."
                                        className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="handicap" className="block text-sm font-medium text-gray-700 mb-2">Handicap</label>
                                    <Input
                                        id="handicap"
                                        name="handicap"
                                        value={newUser.handicap}
                                        onChange={handleNewUserChange}
                                        placeholder="Enter handicap..."
                                        className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                                    <Select
                                        value={newUser.division}
                                        onValueChange={(value: string) => setNewUser(prev => ({ ...prev, division: value }))}
                                    >
                                        <SelectTrigger className="w-full border-2 border-gray-200 focus:border-green-500">
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
                                    <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-2">Tag Number</label>
                                    <Input
                                        id="tag"
                                        name="tag"
                                        value={newUser.tag}
                                        onChange={handleNewUserChange}
                                        placeholder="Enter tag number..."
                                        className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
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
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                                >
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Add & Check In
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </>
        )}
        </div>
    </div>     
    </>
    );
};

export default CheckInPage;