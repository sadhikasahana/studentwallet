import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/types/expense";
import { AlertCircle, AlertTriangle, TrendingUp, Bell } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface AlertsPanelProps {
  alerts: Alert[];
  onMarkAsRead: (id: string) => void;
}

export const AlertsPanel = ({ alerts, onMarkAsRead }: AlertsPanelProps) => {
  const unreadAlerts = alerts.filter(a => !a.read);

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "budget_exceeded":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "suspicious_spending":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "excess_spending":
        return <TrendingUp className="h-5 w-5 text-destructive" />;
    }
  };

  return (
    <Card className="bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </span>
          {unreadAlerts.length > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full">
              {unreadAlerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No alerts</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-all ${alert.read
                  ? "bg-muted/50 border-muted"
                  : "bg-card border-border shadow-sm"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${alert.read ? "text-muted-foreground" : "font-medium"}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(alert.timestamp), "MMM dd, yyyy HH:mm")}
                    </p>
                    {!alert.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(alert.id)}
                        className="h-7 text-xs mt-2"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
