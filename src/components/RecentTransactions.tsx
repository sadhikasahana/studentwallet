import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "@/types/expense";
import { AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface RecentTransactionsProps {
  expenses: Expense[];
}

const categoryIcons: Record<string, string> = {
  food: "🍔",
  stationary: "📚",
  clothes: "👕",
  medicines: "💊",
  transport: "🚗",
  entertainment: "🎮",
  other: "📦",
};

export const RecentTransactions = ({ expenses }: RecentTransactionsProps) => {
  const sortedExpenses = [...expenses].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 10);

  return (
    <Card className="bg-orange-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            sortedExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${expense.isSuspicious ? "bg-destructive/10 border-destructive/20" : "bg-card hover:bg-accent/50"
                  }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{categoryIcons[expense.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{expense.description}</p>
                      {expense.isSuspicious && (
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground capitalize">{expense.category}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
