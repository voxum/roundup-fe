import DataTable from "@/components/table";
import DatePicker from "@/components/date-picker";
import { FetchScores, FetchEventByDate } from "@/lib/api";
import { useEffect } from "react";
import React from "react";
import { BarLoader } from 'react-spinners';
import type { ColumnDef } from "@tanstack/table-core";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { CapitalizeWords } from "@/utils";
import type { Event } from "@/types";


const snakeCaseToColumnHeader = (snakeCaseString: string) => {
  if (!snakeCaseString) {
    return "";
  }

  return snakeCaseString
    .split('_')
    .map(word => {
      if (word.length === 0) {
        return "";
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

interface HoleScore {
  strokes: number;
  hole: number;
  [key: string]: unknown;
}

interface ScoreEntry {
  scores?: {
    hole_scores?: HoleScore[];
    [key: string]: unknown;
  };
  date?: string;
  start_date?: string;
  card_id?: string;
  user_fullname?: string;
  full_name?: string;
  username?: string;
  hole_scores?: Array<{
    strokes: number;
    hole: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
  division?: string;
  handicap?: string;
  total_strokes?: number;
  final_score?: number;
}

interface TableData {
  start_date?: string;
  card_id?: string;
  user_fullname?: string;
  username?: string;
  total_strokes: number;
}

interface ParsedData {
  keys: string[];
  rows: (string | number)[][];
  data: TableData[];
}

const divisions = [
  'advanced',
  'intermediate',
  'recreational'
]

const parseData = (data: ScoreEntry[], eventData: Event): ParsedData => {
  if (!data || data.length === 0) {
    return { keys: [], rows: [], data: [] };
  }
  
  const transformedData = data.map((entry: ScoreEntry): TableData => {
    let total_strokes = 0;
    let best_on_score = 0;
    
    if (Array.isArray(entry.scores?.hole_scores)) {
      total_strokes = entry.scores.hole_scores.reduce(
        (sum: number, hole: HoleScore) => sum + (hole.strokes || 0),
        0
      );
      for (let x = 1; x < entry.scores.hole_scores.length + 1; x++) {
        if(eventData?.best_on_holes.find((hole: number) => hole === x)) {
          best_on_score += entry.scores.hole_scores[x - 1].strokes || 0
        }
      }
    } else if (Array.isArray(entry.hole_scores)) {
      total_strokes = entry.hole_scores.reduce(
        (sum: number, hole: HoleScore) => sum + (hole.strokes || 0), 
        0
      );
    }
    const date = entry.start_date || entry.date || '';
    
    return {
      start_date: typeof date === "string" ? date : undefined,
      card_id: entry.card_id,
      user_fullname: entry.user_fullname || entry.full_name || '',
      username: entry.username || '',
      total_strokes: total_strokes,
      handicap: entry.handicap,
      final_score: total_strokes - (entry.handicap ? parseInt(entry.handicap) : 0),
      best_on_score: best_on_score - 15, // Assuming par 15 for best on holes
      division: entry.division,
    };
  });

  const keys = transformedData.length > 0 ? 
    Object.keys(transformedData[0]).map(snakeCaseToColumnHeader) : [];
  
  const rows = transformedData.map((entry) => 
    Object.values(entry).map(value => {
      if (value === undefined) return '';
      return typeof value === 'object' ? JSON.stringify(value) : value;
    })
  );
  return { keys, rows, data: transformedData };
};

interface TableData {
  user_fullname?: string;
  username?: string;
  total_strokes: number;
  handicap?: string;
  final_score?: number;
  best_on_score?: number;
  [key: string]: string | number | undefined;
}

const ResultsPage = () => {
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [playerDivisions, setPlayerDivisions] = React.useState<Record<string, TableData[]>>({});
  const [topSlug, setTopSlug] = React.useState<TableData>();
  const formattedDate = selectedDate.toISOString().split('T')[0];
  const [eventData, setEventData] = React.useState<Event>({} as Event);
  const [dualWinners, setDualWinners] = React.useState<Record<string, TableData[]>>({});
  const [bestOnWinners, setBestOnWinners] = React.useState<Record<string, TableData[]>>({});

  const columns: ColumnDef<TableData, unknown>[] = [
    {
      accessorKey: "user_fullname",
      header: "Name",
    },
    {
      accessorKey: "handicap",
      header: "Handicap"
    },
    {
      accessorKey: "total_strokes",
      header: "Strokes"
    },
    {
      accessorKey: "final_score",
      header: ({ column }) => {
          return (
              <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  >
                  Final Score
                  <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
          )
      },
    },
    {
      accessorKey: "best_on_score",
      header: "Best On"
    }
  ]
  
  const fetchEventData = async () => {
    try {
      const response = await FetchEventByDate(formattedDate);
      console.log("Event Data:", response);
      setEventData(response);
    } catch (error) {
      console.error("Error fetching event data:", error);
    }
  }

  const fetchScoreData = async (date: string) => {
    setLoading(true);
    try {
      const response = await FetchScores('', date);
      console.log("API Response:", response);
      
      if (Array.isArray(response)) {
        const parsedData = parseData(response, eventData);
        console.log("Parsed Data:", parsedData);
        const divisionData: Record<string, TableData[]> = {};
        let bestPlayer: TableData | undefined;

        parsedData.data.forEach((tableData, index) => {
          const score = response[index];
          const division = score?.division || 'recreational';
          
          if (!divisionData[division]) {
            divisionData[division] = [];
          }
          divisionData[division].push(tableData);

        if (tableData.final_score !== undefined) {
          if (!bestPlayer || tableData.final_score < bestPlayer.final_score!) {
            bestPlayer = tableData;
          }
        }
      });
        for (const dual in eventData?.duels_of_the_day || []) {
          const player1 = parsedData.data.find(player => player.username === eventData.duels_of_the_day[dual][1]);
          const player2 = parsedData.data.find(player => player.username === eventData.duels_of_the_day[dual][2]);
          if (player1 && player2) {
            const winner = player1.total_strokes! < player2.total_strokes! ? player1 : player2;
            setDualWinners(prev => ({...prev, [dual]: [winner]}));
          }
        }
       const bestOnWinnersLocal: Record<string, TableData[]> = {};
      
      for (const score of parsedData.data) {
        const division = score.division ?? '';
        
        if (typeof score.best_on_score === 'number') {
          if (!bestOnWinnersLocal[division]) {
            // First player for this division
            bestOnWinnersLocal[division] = [score];
          } else {
            const currentWinners = bestOnWinnersLocal[division];
            const bestScore = currentWinners[0]?.best_on_score;
            
            if (typeof bestScore === 'number') {
              if (score.best_on_score < bestScore) {
                // New best score - replace all winners
                bestOnWinnersLocal[division] = [score];
              } else if (score.best_on_score === bestScore && currentWinners.length < 3) {
                // Tied score and room for more winners
                bestOnWinnersLocal[division] = [...currentWinners, score];
              }
            }
          }
        }
      }
      
      // Set the state once with the complete object
      setBestOnWinners(bestOnWinnersLocal);
      setTopSlug(bestPlayer);
      setPlayerDivisions(divisionData);
      } else {
        console.error("Unexpected response format:", response);
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPlayerDivisions({});
    setTopSlug(undefined);
    setDualWinners({});
    setBestOnWinners({});
  }

  useEffect(() => {
    fetchEventData()
  }, [formattedDate]);

  useEffect(() => {
    fetchScoreData(formattedDate);
  }, [eventData])

  useEffect(() => {
    console.log("Dual Winners Updated:", dualWinners);
  }, [dualWinners]);

  useEffect(() => {
    console.log("Best On Winners Updated:", bestOnWinners);
  }, [bestOnWinners]);

  return (
    <div className="overflow-x-hidden">
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <BarLoader color="#36d7b7" />
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <DatePicker 
                title="Round Date" 
                default_date={selectedDate} 
                changeHandler={(date) => {
                  if (date) {
                    resetState();
                    setSelectedDate(date);
                    const formattedDate = date.toISOString().split('T')[0];
                    fetchScoreData(formattedDate);
                  }
                }} 
              />
            </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col items-center">
                {Object.keys(topSlug || {}).length > 0 && <span className="font-medium text-lg">Top Slug</span>}
                <span className="text-md">{topSlug ? `${topSlug?.user_fullname} (${topSlug?.final_score})` : ''}</span>
              </div>
              
              <div className="flex flex-col items-center">
                {Object.keys(dualWinners).length > 0 && <span className="font-medium text-lg">Duel of the Day Winners</span>}
                {Object.entries(dualWinners).map(([duel, winners]) => (
                  <span key={duel} className="text-md">
                    {CapitalizeWords(duel)}: {winners.map(winner => `${winner.user_fullname} (${winner.final_score})`).join(' & ')}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col items-center">
                {Object.keys(bestOnWinners).length > 0 && <span className="font-medium text-lg">Best On Winners</span>}
                {Object.entries(bestOnWinners).map(([division, winners]) => (
                  <span key={division} className="text-md">
                    {CapitalizeWords(division)}: {winners.map(winner => `${winner.user_fullname} (${winner.best_on_score})`).join(' & ')}
                  </span>
                ))}
              </div>
            </div>
            
          <div className="mt-4">
            <div className="space-y-8">
              {divisions.map((division) => (
                <div key={division} className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-semibold mb-3 text-center">
                    {division.charAt(0).toUpperCase() + division.slice(1)} Division
                  </h2>
                  <div className="border rounded-lg shadow-sm">
                    <div className="overflow-auto">
                      <DataTable 
                        columns={columns} 
                        data={playerDivisions?.[division] || []} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button> Save Results </Button>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;