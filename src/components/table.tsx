import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TableProps {  
  caption: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

const TableComponent = ({ caption, headers, rows }: TableProps) => {
     return (
        <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
            <TableRow>
            {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
            ))}
            </TableRow>
        </TableHeader>
        <TableBody>
            {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
            </TableRow>
            ))}
        </TableBody>
        </Table>
    );
}

export default TableComponent