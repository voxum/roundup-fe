import TableComponent from "@/components/table";
import DatePicker from "@/components/date-picker";
import { FetchScores } from "@/lib/api";
import { useEffect } from "react";
import React from "react";
import { BarLoader } from 'react-spinners';

const card_id = "scorecard_entry_o8mthw2mcvzxw24irdn28j86";
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

const parseData = (data: any) => {
  const transformedData = data.map((entry: any) => {
    console.log("holeScores in parseData:", entry.scores.holeScores); // Debugging holeScores

    const total_strokes = Array.isArray(entry.scores.holeScores)
      ? entry.scores.holeScores.reduce((sum: number, hole: any) => sum + (hole.strokes || 0), 0)
      : 0;

    const { scores, ...rest } = entry; // Remove scores
    return { ...rest, total_strokes }; // Add totalStrokes
  });

  const keys = Object.keys(transformedData[0]).map(snakeCaseToColumnHeader);
  const rows = transformedData.map((entry: any) =>
    Object.values(entry).map(value => (typeof value === 'object' ? JSON.stringify(value) : value))
  );

  return { keys, rows };
};

const ResultsPage = () => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [keys, setKeys] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Array<Array<string | number>>>([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching Scores:");
      try {
        const response = await FetchScores(card_id);
        console.log(response);
        console.log("Parsed Data:", parseData(response));
        setKeys(parseData(response).keys);
        setRows(parseData(response).rows);
        setData(response);
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      console.log("Data state updated:", data);
    }}, [data]);

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
              <DatePicker />
            </div>
          </div>
            <div className="overflow-x-auto">
              <TableComponent
                caption=""
                headers={keys}
                rows={rows}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;