import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { Expense, CategoryBudget, Alert } from "@/types/expense";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CategoryCard } from "@/components/CategoryCard";
import { RecentTransactions } from "@/components/RecentTransactions";
import { AlertsPanel } from "@/components/AlertsPanel";
import { SpendingChart } from "@/components/SpendingChart";
import { LendingTracker } from "@/components/LendingTracker";
import { BorrowTracker } from "@/components/BorrowTracker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SpeakingAgent } from "@/components/SpeakingAgent";
import { useDailyReminder } from "@/hooks/use-daily-reminder";

const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: "food", limit: 600, spent: 0, icon: "🍔" },
  { category: "stationary", limit: 300, spent: 0, icon: "📚" },
  { category: "clothes", limit: 500, spent: 0, icon: "👕" },
  { category: "medicines", limit: 200, spent: 0, icon: "💊" },
  { category: "transport", limit: 400, spent: 0, icon: "🚗" },
  { category: "entertainment", limit: 350, spent: 0, icon: "🎮" },
  { category: "other", limit: 250, spent: 0, icon: "📦" },
];

const MONTHLY_DEPOSIT = 3000; // Example monthly deposit amount

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; parent_name: string; parent_email: string } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>(INITIAL_BUDGETS);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lendingRecords, setLendingRecords] = useState<{ amount: number; date: string }[]>([]);
  const [borrowingRecords, setBorrowingRecords] = useState<{ amount: number; date: string }[]>([]);
  const { shouldShowReminder, markExpenseAdded } = useDailyReminder();

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

  // Calculate spending for different time periods
  const today = new Date().toISOString().split('T')[0];
  const totalSpentToday = expenses
    .filter(exp => exp.date === today)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalSpentThisMonth = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Assuming semester is 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const totalSpentThisSemester = expenses
    .filter(exp => new Date(exp.date) >= sixMonthsAgo)
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Auth check and profile fetch
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      loadExpensesAndBudgets();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('name, parent_name, parent_email')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!error && data) {
      setUserProfile(data);
    }
  };

  const loadExpensesAndBudgets = async () => {
    if (!session?.user) return;

    // Load expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false });

    if (!expensesError && expensesData) {
      setExpenses(
        expensesData.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          category: e.category as Expense['category'],
          description: e.description,
          date: e.date,
          isSuspicious: e.is_suspicious || false,
        }))
      );
    }

    // Load budgets
    const { data: budgetsData, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', session.user.id);

    if (!budgetsError && budgetsData && budgetsData.length > 0) {
      setBudgets(
        budgetsData.map((b) => ({
          category: b.category as CategoryBudget['category'],
          limit: Number(b.budget_limit),
          spent: Number(b.spent),
          icon: b.icon,
        }))
      );
    } else {
      // Initialize default budgets if none exist
      const budgetInserts = INITIAL_BUDGETS.map((b) => ({
        user_id: session.user.id,
        category: b.category,
        budget_limit: b.limit,
        spent: b.spent,
        icon: b.icon,
      }));

      await supabase.from('budgets').insert(budgetInserts);
      setBudgets(INITIAL_BUDGETS);
    }
  };

  const loadLendingAndBorrowing = async () => {
    if (!session?.user) return;

    // Load lending records
    const { data: lendingData } = await supabase
      .from('borrowed_money')
      .select('amount, date')
      .eq('user_id', session.user.id);

    if (lendingData) {
      setLendingRecords(lendingData.map(r => ({ amount: Number(r.amount), date: r.date })));
    }

    // Load borrowing records
    const { data: borrowingData } = await supabase
      .from('borrowed_from_others')
      .select('amount, date')
      .eq('user_id', session.user.id);

    if (borrowingData) {
      setBorrowingRecords(borrowingData.map(r => ({ amount: Number(r.amount), date: r.date })));
    }
  };

  const sendEmailAlert = async (subject: string, message: string) => {
    if (!userProfile) return;

    try {
      await supabase.functions.invoke('send-email-alert', {
        body: {
          to: userProfile.parent_email,
          studentName: userProfile.name,
          parentName: userProfile.parent_name,
          subject,
          message,
        },
      });
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  useEffect(() => {
    if (totalSpent > MONTHLY_DEPOSIT) {
      const existingAlert = alerts.find(a => a.type === "excess_spending" && !a.read);
      if (!existingAlert) {
        addAlert({
          type: "excess_spending",
          message: `⚠️ ALERT: Total spending (₹${totalSpent.toFixed(2)}) exceeds monthly deposit (₹${MONTHLY_DEPOSIT}). This suggests income from unknown sources.`,
        });
        sendEmailAlert(
          "Excess Spending Alert",
          `Your child's total spending (₹${totalSpent.toFixed(2)}) has exceeded the monthly deposit amount (₹${MONTHLY_DEPOSIT}). This may indicate income from unknown sources.`
        );
      }
    }
  }, [totalSpent, userProfile]);

  const addAlert = (alertData: Omit<Alert, "id" | "timestamp" | "read">) => {
    const newAlert: Alert = {
      ...alertData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setAlerts(prev => [newAlert, ...prev]);
    toast.error("Alert sent to parents!");
  };

  const handleAddExpense = async (expenseData: Omit<Expense, "id" | "date">) => {
    if (!session?.user) return;

    const date = new Date().toISOString().split('T')[0];

    // Save to database
    const { data: newExpenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        user_id: session.user.id,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        date: date,
        is_suspicious: expenseData.isSuspicious || false,
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error adding expense:', expenseError);
      toast.error('Failed to add expense');
      return;
    }

    const newExpense: Expense = {
      id: newExpenseData.id,
      amount: Number(newExpenseData.amount),
      category: newExpenseData.category as Expense['category'],
      description: newExpenseData.description,
      date: newExpenseData.date,
      isSuspicious: newExpenseData.is_suspicious || false,
    };

    setExpenses(prev => [newExpense, ...prev]);

    // Update budget in database
    const categoryBudget = budgets.find(b => b.category === expenseData.category);
    if (categoryBudget) {
      const newSpent = categoryBudget.spent + expenseData.amount;

      const { error: budgetError } = await supabase
        .from('budgets')
        .update({ spent: newSpent })
        .eq('user_id', session.user.id)
        .eq('category', expenseData.category);

      if (!budgetError) {
        setBudgets(prev =>
          prev.map(budget =>
            budget.category === expenseData.category
              ? { ...budget, spent: newSpent }
              : budget
          )
        );
      }

      if (newSpent > categoryBudget.limit) {
        addAlert({
          type: "budget_exceeded",
          message: `Budget exceeded for ${newExpense.category}! Spent: ₹${newSpent.toFixed(2)}, Limit: ₹${categoryBudget.limit}.`,
          category: newExpense.category,
          amount: newExpense.amount,
        });
        sendEmailAlert(
          "Budget Exceeded Alert",
          `Your child has exceeded their budget for ${newExpense.category}. Amount spent: ₹${newSpent.toFixed(2)}, Budget limit: ₹${categoryBudget.limit}.`
        );
      }
    }

    if (newExpense.isSuspicious) {
      addAlert({
        type: "suspicious_spending",
        message: `🚨 Suspicious spending detected: "${newExpense.description}" for ₹${newExpense.amount}.`,
        category: newExpense.category,
        amount: newExpense.amount,
      });
      sendEmailAlert(
        "🚨 Suspicious Spending Alert",
        `Suspicious spending detected: "${newExpense.description}" in category ${newExpense.category} for ₹${newExpense.amount}.`
      );
    }
  };

  const handleMarkAsRead = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SpeakingAgent shouldSpeak={shouldShowReminder} />

      {/* ---- Header ---- */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Student Wallet</h1>
              <p className="text-muted-foreground">
                {userProfile ? `Welcome, ${userProfile.name}` : "Track your expenses easily"}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-5">
        {/* ────────────── SUMMARY ROW 1 ────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <Card className="bg-purple-100">
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">₹{totalBudget.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-100">
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold">
                ₹{(totalBudget - totalSpent).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ────────────── ROW 2: TODAY ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-1">
          <Card className="bg-purple-100">
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-muted-foreground">Spent Today</p>
              <p className="text-2xl font-bold">₹{totalSpentToday.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-100">
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-muted-foreground">Spent This Month</p>
              <p className="text-2xl font-bold">₹{totalSpentThisMonth.toFixed(2)}</p>
            </CardContent>
          </Card>

        </div>

        {/* ────────────── ROW 3: MONTH ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="scale-90 lg:scale-90 origin-top">
            <SpendingChart
              budgets={budgets}
              expenses={expenses}
              lendingRecords={lendingRecords}
              borrowingRecords={borrowingRecords}
              period="today"
              title="Today's Spending Distribution"
            />
          </div>

          <div className="scale-90 lg:scale-90 origin-top">
            <SpendingChart
              budgets={budgets}
              expenses={expenses}
              lendingRecords={lendingRecords}
              borrowingRecords={borrowingRecords}
              period="month"
              title="This Month's Spending Distribution"
            />
          </div>
        </div>

        {/* ────────────── ROW 4: SEMESTER ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-purple-100">
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-muted-foreground">Spent This Semester</p>
              <p className="text-2xl font-bold">₹{totalSpentThisSemester.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* ────────────── ROW 5: SEMESTER CHART ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="scale-90 lg:scale-90 origin-top">
            <SpendingChart
              budgets={budgets}
              expenses={expenses}
              lendingRecords={lendingRecords}
              borrowingRecords={borrowingRecords}
              period="all"
              title="This Semester's Spending Distribution"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-8">

            {/* Add New Expense */}
            <ExpenseForm onAddExpense={handleAddExpense} />

            {/* Budget Overview */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Budget Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((b) => (
                  <CategoryCard key={b.category} budget={b} />
                ))}
              </div>
            </section>

            {/* Lending & Borrow Trackers */}
            <LendingTracker />
            <BorrowTracker />

          </div>



          {/* RIGHT COLUMN */}
          <div className="space-y-8">

            {/* Alerts */}
            <AlertsPanel alerts={alerts} onMarkAsRead={handleMarkAsRead} />

            {/* Recent Transactions */}
            <RecentTransactions expenses={expenses} />

          </div>

        </div>
      </main>


    </div>
  );
};

export default Index;
