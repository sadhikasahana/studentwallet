import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CategoryBudget, Expense } from "@/types/expense";

interface SpendingChartProps {
  budgets: CategoryBudget[];
  expenses: Expense[];
  lendingRecords: { amount: number; date: string }[];
  borrowingRecords: { amount: number; date: string }[];
  period?: "today" | "month" | "all";
  title?: string;
}

const COLORS = {
  food: "hsl(var(--chart-1))",
  stationary: "hsl(var(--chart-2))",
  clothes: "hsl(var(--chart-3))",
  medicines: "hsl(var(--chart-4))",
  transport: "hsl(var(--chart-5))",
  entertainment: "hsl(var(--primary))",
  other: "hsl(var(--muted-foreground))",
};

export const SpendingChart = ({
  budgets,
  expenses,
  lendingRecords,
  borrowingRecords,
  period = "all",
  title = "Spending Distribution"
}: SpendingChartProps) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter expenses by period
  const filteredExpenses = expenses.filter(exp => {
    if (period === "today") return exp.date === today;
    if (period === "month") {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    }
    return true;
  });

  // Filter lending by period
  const filteredLending = lendingRecords.filter(rec => {
    if (period === "today") return rec.date === today;
    if (period === "month") {
      const recDate = new Date(rec.date);
      return recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear;
    }
    return true;
  });

  // Filter borrowing by period
  const filteredBorrowing = borrowingRecords.filter(rec => {
    if (period === "today") return rec.date === today;
    if (period === "month") {
      const recDate = new Date(rec.date);
      return recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear;
    }
    return true;
  });

  // Calculate spending by category
  const categorySpending = budgets.reduce((acc, budget) => {
    const categoryExpenses = filteredExpenses
      .filter(exp => exp.category === budget.category)
      .reduce((sum, exp) => sum + exp.amount, 0);

    acc[budget.category] = {
      value: categoryExpenses,
      icon: budget.icon,
    };
    return acc;
  }, {} as Record<string, { value: number; icon: string }>);

  // Add lending as a separate category
  const totalLending = filteredLending.reduce((sum, rec) => sum + rec.amount, 0);
  if (totalLending > 0) {
    categorySpending["lending"] = { value: totalLending, icon: "💸" };
  }

  // Subtract borrowing from total (shown as negative if needed, but we'll just reduce other categories proportionally)
  const totalBorrowing = filteredBorrowing.reduce((sum, rec) => sum + rec.amount, 0);

  const data = Object.entries(categorySpending)
    .filter(([_, data]) => data.value > 0)
    .map(([name, data]) => ({
      name,
      value: data.value,
      icon: data.icon,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No spending data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};