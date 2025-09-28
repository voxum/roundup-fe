import DataTable from "@/components/table";
import DatePicker from "@/components/date-picker";
import { FetchScores } from "@/lib/api";
import { useEffect } from "react";
import React from "react";
import { BarLoader } from 'react-spinners';
import type { ColumnDef } from "@tanstack/table-core";

// const card_id = "scorecard_entry_o8mthw2mcvzxw24irdn28j86";
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

const parseData = (data: ScoreEntry[]): ParsedData => {
  if (!data || data.length === 0) {
    return { keys: [], rows: [], data: [] };
  }
  
  const transformedData = data.map((entry: ScoreEntry): TableData => {
    let totalStrokes = 0;
    
    if (Array.isArray(entry.scores?.hole_scores)) {
      totalStrokes = entry.scores.hole_scores.reduce(
        (sum: number, hole: HoleScore) => sum + (hole.strokes || 0), 
        0
      );
    } else if (Array.isArray(entry.hole_scores)) {
      totalStrokes = entry.hole_scores.reduce(
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
      total_strokes: totalStrokes
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
  start_date?: string;
  card_id?: string;
  user_fullname?: string;
  username?: string;
  total_strokes: number;
  [key: string]: string | number | undefined;
}

const ResultsPage = () => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<TableData[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const formattedDate = selectedDate.toISOString().split('T')[0];
  const columns: ColumnDef<TableData, unknown>[] = [
    {
      accessorKey: "start_date",
      header: "Date"
    },
    {
      accessorKey: "user_fullname",
      header: "Full Name",
    },
    {
      accessorKey: "username",
      header: "Username"
    },
    {
      accessorKey: "total_strokes",
      header: "Total Strokes"
    }
  ]
  
  const fetchScoreData = async (date: string) => {
    setLoading(true);
    console.log("Fetching Scores for date:", date);
    try {
      const response = await FetchScores('', date);
      console.log("API Response:", response);
      
      if (Array.isArray(response)) {
        const parsedData = parseData(response);
        console.log("Parsed Data:", parsedData);
        setData(parsedData.data);
      } else {
        console.error("Unexpected response format:", response);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreData(formattedDate);
  }, [formattedDate]);

  return (
    <div className="overflow-x-hidden">
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <BarLoader color="#36d7b7" />
          </div>
        ) : (
          <>
          <div className="flex">
            <div className="ml-auto">
              <DatePicker 
                title="Round Date" 
                default_date={selectedDate} 
                changeHandler={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    const formattedDate = date.toISOString().split('T')[0];
                    fetchScoreData(formattedDate);
                  }
                }} 
              />
            </div>
          </div>
            <div className="overflow-x-auto">
              <DataTable columns={columns} data={data} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;