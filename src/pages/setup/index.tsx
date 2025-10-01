import { Button } from "@/components/ui/button";
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FetchCheckins } from "@/lib/api";
import { Settings, Zap, Target, Save } from "lucide-react";
import { CapitalizeWords } from "@/utils";

interface PlayersCheckedIn {
    date: string;
    division: string;
    tag: number;
    username: string;
    full_name: string;
    handicap: number;
    id: number;
}

const divisions = ['advanced', 'intermediate', 'recreational'];

const SetupPage = () => {
    const [bestOn5, setBestOn5] = React.useState<number[]>([]);
    const [duels, setDuels] = React.useState<Record<string, PlayersCheckedIn[]>>({});
    const [playerDivisions, setPlayerDivisions] = React.useState<Record<string, PlayersCheckedIn[]>>({});
    const [loading, setLoading] = React.useState<boolean>(true);

    const GenerateRandomValues = (count: number, min: number, max: number) => {
        const randomNumbers = new Set<number>();

        while (randomNumbers.size < count) {
            const rand = Math.floor(Math.random() * (max - min + 1)) + min;
            randomNumbers.add(rand);
        }
        return Array.from(randomNumbers).sort((a: number, b: number) => a - b);
    }

    useEffect(() => {
        const FetchTodaysCheckins = async () => {
            const response = await FetchCheckins('2025-09-28');
            console.log("Today's check-ins:", response);

            const divisionData: Record<string, PlayersCheckedIn[]> = {};
            response.forEach((entry: PlayersCheckedIn) => {
                if (!divisionData[entry.division]) {
                    divisionData[entry.division] = [];
                }
                divisionData[entry.division].push(entry);
            });
            console.log("Division Data:", divisionData);
            setPlayerDivisions(divisionData);
            setLoading(false);
        };
        FetchTodaysCheckins();
    },[])

    useEffect(() => {
        console.log("Player Divisions updated:", playerDivisions);
    }, [playerDivisions]);

    useEffect(() => {
        console.log("Duels updated:", duels);
    }, [duels]);

    return (
        <>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
            <div className="max-w-7xl mx-auto">
                <Card className="mb-6 shadow-lg border-2 border-blue-200 overflow-hidden p-0">
                    <CardHeader className="bg-blue-600 text-white p-0 px-4 py-3">
                        <CardTitle className="text-2xl font-bold flex items-center m-0">
                            <Settings className="w-8 h-8 mr-3" />
                            Round Setup Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <Card className="shadow-lg border-2 border-orange-200 bg-orange-50 overflow-hidden p-0">
                                <CardHeader className="bg-orange-600 text-white p-0 px-4 py-3">
                                    <CardTitle className="text-xl font-bold flex items-center m-0">
                                        <Zap className="w-6 h-6 mr-2" />
                                        Duels Generation Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {Object.keys(duels).length > 0 ? (
                                        <div className="space-y-3">
                                            {Object.entries(duels).map(([division, players]) => (
                                                <div key={division} className="border-l-4 border-orange-500 pl-3">
                                                    <h4 className="font-medium text-sm capitalize mb-2 text-orange-800">{division} Division</h4>
                                                    {players.length > 0 ? (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {players.map((player) => (
                                                                <div key={player.id} className="bg-white p-2 rounded border border-orange-200">
                                                                    <span className="font-medium text-orange-700">#{player.tag}</span> - {CapitalizeWords(player.full_name)}
                                                                    <span className="text-xs text-orange-600 ml-2">(HC: {player.handicap})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-orange-500 text-sm">No players selected for duels</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-orange-600 text-center py-8">Click the button below to generate duels.</p>
                                    )}
                                </CardContent>
                            </Card>
                            
                            <Card className="shadow-lg border-2 border-blue-200 bg-blue-50 overflow-hidden p-0">
                                <CardHeader className="bg-blue-600 text-white p-0 px-4 py-3">
                                    <CardTitle className="text-xl font-bold flex items-center m-0">
                                        <Target className="w-6 h-6 mr-2" />
                                        Best on 5 Holes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {bestOn5.length > 0 ? (
                                        <div className="border-l-4 border-blue-500 pl-3">
                                            <h4 className="font-medium text-sm mb-3 text-blue-800">Selected Holes</h4>
                                            <div className="grid grid-cols-5 gap-2">
                                                {bestOn5.map((hole) => (
                                                    <div key={hole} className="bg-white p-2 rounded text-center border border-blue-200">
                                                        <span className="text-lg font-bold text-blue-700">#{hole}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-blue-600">Click the button below to generate best on 5 holes.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button 
                                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                                onClick={() => {
                                    if(Object.keys(duels).length > 0) {
                                        setDuels({});
                                    }

                                    for (const division of divisions) {
                                        const playersInDivision = playerDivisions[division].length || 0;
                                        if (playersInDivision >= 2) {
                                            const results = GenerateRandomValues(2, 0, playersInDivision - 1);
                                            setDuels((prev) => ({ ...prev, [division]: [...(prev[division] || []), ...results.map((index) => playerDivisions[division][index])] }));
                                        }
                                    }
                                }}
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                Generate Duels
                            </Button>
                            
                            <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                                onClick={() => {
                                    const results = GenerateRandomValues(5, 1, 18);
                                    console.log("Best on 5 results:", results);
                                    setBestOn5(results);
                                }}
                            >
                                <Target className="w-5 h-5 mr-2" />
                                Generate Best on 5
                            </Button>
                            
                            <Button 
                                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Save Configuration
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>     
        </>
    );
}

export default SetupPage;