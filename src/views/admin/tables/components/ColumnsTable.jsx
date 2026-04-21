import React from "react";
import { Link } from "react-router-dom";
import CardMenu from "components/card/CardMenu";
import Card from "components/card";
import LeadScoreBadge from "components/contacts/LeadScoreBadge";
import { useLeadScores } from "domains/scoring/hooks";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

function ColumnsTable(props) {
  const { tableData } = props;
  const { data: leadScoresData } = useLeadScores();
  const [sorting, setSorting] = React.useState([]);

  const scoreByContactId = React.useMemo(() => {
    const map = new Map();
    (Array.isArray(leadScoresData) ? leadScoresData : []).forEach((entry) => {
      map.set(String(entry.contactId), entry);
    });
    return map;
  }, [leadScoresData]);

  const normalizedRows = React.useMemo(
    () =>
      (Array.isArray(tableData) ? tableData : []).map((contact) => {
        const scoreData = scoreByContactId.get(String(contact.id)) || { score: 0, level: "low" };
        return {
          id: contact.id,
          name: contact.name || contact.email || `Contact ${contact.id}`,
          email: contact.email || "-",
          company: contact.company || contact.organization || "-",
          updatedAt: contact.updated_at || contact.created_at || null,
          score: scoreData.score || 0,
          scoreLevel: scoreData.level || "low",
        };
      }),
    [scoreByContactId, tableData]
  );

  const columns = [
    columnHelper.accessor("name", {
      id: "name",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">NAME</p>
      ),
      cell: (info) => (
        <div>
          <Link
            to={`/admin/contacts/${info.row.original.id}`}
            className="text-sm font-bold text-brand-500 hover:underline"
          >
            {info.getValue()}
          </Link>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{info.row.original.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor("company", {
      id: "company",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">
          COMPANY
        </p>
      ),
      cell: (info) => (
        <p className="text-sm font-semibold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("score", {
      id: "score",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">
          LEAD SCORE
        </p>
      ),
      cell: (info) => (
        <LeadScoreBadge score={info.getValue()} level={info.row.original.scoreLevel} />
      ),
    }),
    columnHelper.accessor("updatedAt", {
      id: "updatedAt",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">UPDATED</p>
      ),
      cell: (info) => (
        <p className="text-sm font-semibold text-navy-700 dark:text-white">
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : "-"}
        </p>
      ),
    }),
  ]; // eslint-disable-next-line

  const [data, setData] = React.useState(() => [...normalizedRows]);

  React.useEffect(() => {
    setData([...normalizedRows]);
  }, [normalizedRows]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });
  return (
    <Card extra={"w-full pb-10 p-4 h-full"}>
      <header className="relative flex items-center justify-between">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          Contacts Intelligence
        </div>
        <CardMenu />
      </header>

      <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="!border-px !border-gray-400">
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start"
                    >
                      <div className="items-center justify-between text-xs text-gray-200">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: "",
                          desc: "",
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table
              .getRowModel()
              .rows.slice(0, 5)
              .map((row) => {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td
                          key={cell.id}
                          className="min-w-[150px] border-white/0 py-3  pr-4"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default ColumnsTable;
const columnHelper = createColumnHelper();
