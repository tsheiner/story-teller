import { Table } from 'react-bootstrap';
import { TableConfig } from '../services/ChartParserService';

interface TableComponentProps {
  config: TableConfig;
}

export function TableComponent({ config }: TableComponentProps) {
  return (
    <div className="table-wrapper my-3">
      {config.title && <h5 className="mb-3">{config.title}</h5>}
      <Table striped bordered hover responsive className="table-sm">
        <thead>
          <tr>
            {config.columns.map((column, index) => (
              <th key={index} className="bg-light">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}