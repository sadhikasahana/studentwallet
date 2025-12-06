import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryBudget } from "@/types/expense";
import { AlertCircle } from "lucide-react";

interface CategoryCardProps {
  budget: CategoryBudget;
}

export const CategoryCard = ({ budget }: CategoryCardProps) => {
  const percentage = (budget.spent / budget.limit) * 100;
  const remaining = budget.limit - budget.spent;
  
  const getStatusColor = () => {
    if (percentage >= 100) return "text-destructive";
    if (percentage >= 80) return "text-warning";
    return "text-success";
  };

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-success";
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <span className="text-2xl">{budget.icon}</span>
            <span className="capitalize">{budget.category}</span>
          </span>
          {percentage >= 100 && <AlertCircle className="h-5 w-5 text-destructive" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className={`font-semibold ${getStatusColor()}`}>₹{budget.spent.toFixed(2)}</span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-2" indicatorClassName={getProgressColor()} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">₹{budget.limit.toFixed(2)}</span>
          </div>
        </div>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {remaining >= 0 ? (
            <span>₹{remaining.toFixed(2)} remaining</span>
          ) : (
            <span>₹{Math.abs(remaining).toFixed(2)} over budget!</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
