import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import {
  Transaction,
  DashboardStats,
  CategorySummary,
  AccountSummary,
  MonthlyData,
} from "@/types/finance";

const categoryColors = [
  "#9b87f5",
  "#7E69AB",
  "#6E59A5",
  "#1A1F2C",
  "#D6BCFA",
  "#F2FCE2",
  "#FEF7CD",
  "#FEC6A1",
  "#E5DEFF",
  "#FFDEE2",
  "#FDE1D3",
  "#D3E4FD",
  "#F1F0FB",
];

export const parseXLS = (data: ArrayBuffer): Transaction[] => {
  const transactions: Transaction[] = [];
  const errors: string[] = [];
  try {
    const workbook = XLSX.read(data, { type: "array" });
    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("No sheets found in the XLS file.");
    }
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new Error("Worksheet not found.");
    let rows: any[][] = [];
    try {
      rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    } catch (e) {
      throw new Error(
        "Failed to convert sheet to JSON: " + (e as Error).message
      );
    }
    if (rows.length === 0) throw new Error("The XLS file is empty.");
    const headerRow = rows[0].map((cell: string) =>
      ("" + cell).toLowerCase().trim()
    );
    const expectedHeaders = [
      "account",
      "category",
      "amount",
      "type",
      "payment_type",
      "note",
      "date",
    ];
    const skipHeader = expectedHeaders.some((header) =>
      headerRow.includes(header)
    );
    const startIndex = skipHeader ? 1 : 0;
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row || row.length === 0 || row.every((cell) => cell === ""))
          continue;
        if (row.length < 7) {
          errors.push(
            `Row ${i + 1}: Insufficient columns (expected 7, got ${
              row.length
            }).`
          );
          continue;
        }
        const [
          account,
          category,
          amountStr,
          typeStr,
          paymentTypeRaw,
          note,
          dateStr,
        ] = row.map((val) => ("" + val).trim());
        if (!account || !category || !amountStr) {
          const missing: string[] = [];
          if (!account) missing.push("account");
          if (!category) missing.push("category");
          if (!amountStr) missing.push("amount");
          errors.push(
            `Row ${i + 1}: Missing required fields (${missing.join(", ")})`
          );
          continue;
        }
        let normalizedAmount = amountStr
          .replace(/\(([^)]+)\)/, "-$1")
          .replace(/,/g, "");
        let amount = parseFloat(normalizedAmount);
        if (isNaN(amount)) {
          errors.push(`Row ${i + 1}: Invalid amount format "${amountStr}"`);
          continue;
        }
        let type: "Income" | "Expense" = "Expense";
        if (typeStr) {
          const normType = typeStr.toLowerCase();
          if (["income", "revenue", "deposit", "credit"].includes(normType)) {
            type = "Income";
            amount = Math.abs(amount);
          } else if (
            ["expense", "expenses", "payment", "debit", "withdrawal"].includes(
              normType
            )
          ) {
            type = "Expense";
            amount = Math.abs(amount);
          } else {
            type = amount < 0 ? "Expense" : "Income";
            amount = Math.abs(amount);
            errors.push(
              `Row ${
                i + 1
              }: Unclear transaction type "${typeStr}", using ${type} based on amount sign.`
            );
          }
        } else {
          type = amount < 0 ? "Expense" : "Income";
          amount = Math.abs(amount);
        }
        const validPaymentTypes = [
          "TRANSFER",
          "DEBIT_CARD",
          "CREDIT_CARD",
          "CASH",
        ];
        let normPayment = paymentTypeRaw.toUpperCase().replace(/ /g, "_");
        if (normPayment === "DEBIT") normPayment = "DEBIT_CARD";
        if (normPayment === "CREDIT") normPayment = "CREDIT_CARD";
        if (["BANK", "WIRE", "ACH"].includes(normPayment))
          normPayment = "TRANSFER";
        if (!validPaymentTypes.includes(normPayment)) {
          errors.push(
            `Row ${
              i + 1
            }: Invalid payment type "${paymentTypeRaw}" (using TRANSFER as default)`
          );
          normPayment = "TRANSFER";
        }
        let date = new Date();
        if (dateStr) {
          const dt = dateStr;
          const direct = new Date(dt);
          if (!isNaN(direct.getTime())) {
            date = direct;
          } else {
            const formats = [
              /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/,
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
              /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
            ];
            let parsed = false;
            for (const regex of formats) {
              const match = dt.match(regex);
              if (match) {
                let year,
                  month,
                  day,
                  hours = 0,
                  minutes = 0,
                  seconds = 0;
                if (regex === formats[0]) {
                  [, year, month, day, hours, minutes, seconds] = match.map(
                    (v) => (v ? parseInt(v, 10) : 0)
                  );
                } else if (regex === formats[1]) {
                  [, month, day, year, hours, minutes, seconds] = match.map(
                    (v) => (v ? parseInt(v, 10) : 0)
                  );
                } else {
                  [, day, month, year, hours, minutes, seconds] = match.map(
                    (v) => (v ? parseInt(v, 10) : 0)
                  );
                }
                date = new Date(year, month - 1, day, hours, minutes, seconds);
                parsed = true;
                break;
              }
            }
            if (!parsed || isNaN(date.getTime())) {
              errors.push(
                `Row ${
                  i + 1
                }: Invalid date format "${dateStr}" (using current date as default)`
              );
              date = new Date();
            }
          }
        }
        transactions.push({
          id: uuidv4(),
          account,
          category,
          amount,
          type,
          payment_type: normPayment as any,
          note: note || "",
          date: date.toISOString().slice(0, 19).replace("T", " "),
        });
      } catch (rowError: any) {
        errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }
  } catch (error: any) {
    errors.push(`General parsing error: ${error.message}`);
  }
  if (errors.length > 0) {
    console.error("XLS import warnings:", errors);
    try {
      sessionStorage.setItem("xlsImportErrors", JSON.stringify(errors));
    } catch (e: any) {
      console.error("Failed to store XLS import errors:", (e as Error).message);
    }
  }
  return transactions;
};

export const calculateDashboardStats = (
  transactions: Transaction[]
): DashboardStats => {
  try {
    const totalIncome = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const expensesByCategory = transactions
      .filter((t) => t.type === "Expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    const byCategory: CategorySummary[] = Object.entries(expensesByCategory)
      .map(([category, total], index) => ({
        category,
        total,
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
        color: categoryColors[index % categoryColors.length],
      }))
      .sort((a, b) => b.total - a.total);
    const totalsByAccount = transactions.reduce((acc, t) => {
      acc[t.account] =
        (acc[t.account] || 0) + (t.type === "Income" ? t.amount : -t.amount);
      return acc;
    }, {} as Record<string, number>);
    const totalAccountsSum = Object.values(totalsByAccount).reduce(
      (sum, value) => sum + Math.abs(value),
      0
    );
    const byAccount: AccountSummary[] = Object.entries(totalsByAccount)
      .map(([account, total]) => ({
        account,
        total,
        percentage:
          totalAccountsSum > 0 ? (Math.abs(total) / totalAccountsSum) * 100 : 0,
      }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    const byMonth: MonthlyData[] = groupTransactionsByMonth(transactions);
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    return {
      totalIncome,
      totalExpense,
      balance,
      byCategory,
      byAccount,
      byMonth,
      recentTransactions,
    };
  } catch (error: any) {
    console.error("Error calculating dashboard stats:", error.message);
    return {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      byCategory: [],
      byAccount: [],
      byMonth: [],
      recentTransactions: [],
    };
  }
};

function groupTransactionsByMonth(transactions: Transaction[]): MonthlyData[] {
  try {
    const monthlyData: Record<
      string,
      { income: number; expense: number; month: string }
    > = {};
    transactions.forEach((t) => {
      try {
        const date = new Date(t.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { income: 0, expense: 0, month: monthYear };
        }
        if (t.type === "Income") {
          monthlyData[monthYear].income += t.amount;
        } else {
          monthlyData[monthYear].expense += t.amount;
        }
      } catch (e: any) {
        console.error(
          "Error processing transaction for month grouping:",
          (e as Error).message
        );
      }
    });
    return Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  } catch (e: any) {
    console.error(
      "Error grouping transactions by month:",
      (e as Error).message
    );
    return [];
  }
}

export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e: any) {
    console.error("Error formatting currency:", (e as Error).message);
    return amount.toString();
  }
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch (e: any) {
    console.error("Error formatting date:", (e as Error).message);
    return dateString;
  }
};

export const getExampleCSV = (): string => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const formatDateForCSV = (date: Date): string => {
      return date.toISOString().slice(0, 19).replace("T", " ");
    };
    return `account,category,amount,type,payment_type,note,date
Bank Account,Salary,3000,Income,TRANSFER,Monthly salary,${formatDateForCSV(
      today
    )}
Credit Card,"Groceries, Food",120.50,Expense,CREDIT_CARD,Weekly shopping,${formatDateForCSV(
      yesterday
    )}
Cash,"Entertainment",45.99,Expense,CASH,Movie tickets,${formatDateForCSV(
      yesterday
    )}
Bank Account,Rent,1200,Expense,TRANSFER,Monthly rent,${formatDateForCSV(
      lastWeek
    )}
Savings,Investment,500,Expense,TRANSFER,Stock purchase,${formatDateForCSV(
      lastWeek
    )}`;
  } catch (e: any) {
    console.error("Error generating example CSV:", (e as Error).message);
    return "";
  }
};

export const analyzeCSVFormat = (
  csvContent: string
): {
  columns: string[];
  suggestedCorrections: { column: string; type: string }[];
} => {
  try {
    const rows = csvContent.split("\n");
    const headerRow = rows[0].split(",");
    const columns = headerRow.map((column) => column.trim().toLowerCase());
    const suggestedCorrections = columns.map((column) => ({
      column,
      type: "",
    }));
    return { columns, suggestedCorrections };
  } catch (e: any) {
    console.error("Error analyzing CSV format:", (e as Error).message);
    return { columns: [], suggestedCorrections: [] };
  }
};
