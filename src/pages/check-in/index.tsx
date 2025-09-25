import { useEffect } from "react";
import { FetchUsers } from "@/lib/api";
import type { UserEntry } from "@/types";
import React from "react";
import TableComponent from "@/components/table";

const CheckInPage = () => {
    const [players, setPlayers] = React.useState<UserEntry[]>([]);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await FetchUsers();
                setPlayers(response);
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
        <h1 className="text-2xl font-bold mb-4">Check-In Page</h1>
        <p>This is where users can check in for the event.</p>
        {loading ? (
            <p>Loading users...</p>
        ) : (
            <TableComponent
                caption="Registered Users"
                headers={["Full Name", "Name", "Username"]}
                rows={players.map(player => [
                    player.full_name,
                    player.name,
                    player.username
                ])}
            />
        )}
        </div>
        </>

    );
};

export default CheckInPage;