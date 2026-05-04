import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HeartPulse, Footprints, Flame, Moon, Link2, Unlink, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getGoogleUser, isOuraEnabledForCurrentUser, ouraApi, type OuraSummary } from "@/lib/storage";

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

function shiftIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function escapeMdCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .trim();
}

function getPathValue(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, row);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function buildMarkdownTable(summary: OuraSummary): string {
  const rowsByDay = new Map<string, Record<string, string | number>>();
  const ensureRow = (day: string) => {
    if (!rowsByDay.has(day)) {
      rowsByDay.set(day, { Date: day });
    }
    return rowsByDay.get(day)!;
  };

  const activityRows = Array.isArray(summary.activity) ? summary.activity : [];
  for (const row of activityRows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const steps = asNumber(row.steps);
    if (steps !== null) out.Steps = steps;

    const activeCalories = asNumber(row.active_calories);
    if (activeCalories !== null) out.Active_Calories = activeCalories;

    const activityScore = asNumber(row.score);
    if (activityScore !== null) out.Activity_Score = activityScore;

    const stayActive = asNumber(getPathValue(row, "contributors.stay_active"));
    if (stayActive !== null) out.Stay_Active_Score = stayActive;

    const moveHourly = asNumber(getPathValue(row, "contributors.move_every_hour"));
    if (moveHourly !== null) out.Move_Hourly_Score = moveHourly;

    const trainingVolume = asNumber(getPathValue(row, "contributors.training_volume"));
    if (trainingVolume !== null) out.Training_Volume_Score = trainingVolume;
  }

  const sleepRows = Array.isArray(summary.sleep) ? summary.sleep : [];
  for (const row of sleepRows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const sleepScore = asNumber(row.score);
    if (sleepScore !== null) out.Sleep_Score = sleepScore;

    const deepSleep = asNumber(getPathValue(row, "contributors.deep_sleep"));
    if (deepSleep !== null) out.Deep_Sleep_Score = deepSleep;

    const remSleep = asNumber(getPathValue(row, "contributors.rem_sleep"));
    if (remSleep !== null) out.REM_Sleep_Score = remSleep;

    const sleepEfficiency = asNumber(getPathValue(row, "contributors.efficiency"));
    if (sleepEfficiency !== null) out.Sleep_Efficiency = sleepEfficiency;

    const totalSleepDuration = asNumber(row.total_sleep_duration);
    if (totalSleepDuration !== null) out.Total_Sleep_Duration_Sec = totalSleepDuration;
  }

  const readinessRows = Array.isArray(summary.readiness) ? summary.readiness : [];
  for (const row of readinessRows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const readinessScore = asNumber(row.score);
    if (readinessScore !== null) out.Readiness_Score = readinessScore;

    const readinessActivityBalance = asNumber(getPathValue(row, "contributors.activity_balance"));
    if (readinessActivityBalance !== null) out.Readiness_Activity_Balance = readinessActivityBalance;
  }

  const spo2Rows = Array.isArray(summary.spo2) ? summary.spo2 : [];
  for (const row of spo2Rows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const spo2Average = asNumber(getPathValue(row, "spo2_percentage.average"));
    if (spo2Average !== null) out.SpO2_Average = spo2Average;
  }

  const stressRows = Array.isArray(summary.stress) ? summary.stress : [];
  for (const row of stressRows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const stressHigh = asNumber(row.stress_high_duration);
    if (stressHigh !== null) out.Stress_High_Duration = stressHigh;
  }

  const resilienceRows = Array.isArray(summary.resilience) ? summary.resilience : [];
  for (const row of resilienceRows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const resilienceLevel = asString(row.level);
    if (resilienceLevel) out.Resilience_Level = resilienceLevel;
  }

  const cardioRows = Array.isArray(summary.cardiovascularAge) ? summary.cardiovascularAge : [];
  for (const row of cardioRows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const cardioAge = asNumber(row.cardiovascular_age);
    if (cardioAge !== null) out.Cardiovascular_Age = cardioAge;
  }

  const vo2Rows = Array.isArray(summary.vo2Max) ? summary.vo2Max : [];
  for (const row of vo2Rows) {
    const day = asString(row.day);
    if (!day) continue;
    const out = ensureRow(day);

    const vo2 = asNumber(row.vo2_max);
    if (vo2 !== null) out.VO2_Max = vo2;
  }

  const columns = [
    "Date",
    "Steps",
    "Active_Calories",
    "Activity_Score",
    "Sleep_Score",
    "Deep_Sleep_Score",
    "REM_Sleep_Score",
    "Sleep_Efficiency",
    "Total_Sleep_Duration_Sec",
    "Stay_Active_Score",
    "Move_Hourly_Score",
    "Training_Volume_Score",
    "Readiness_Score",
    "Readiness_Activity_Balance",
    "SpO2_Average",
    "Stress_High_Duration",
    "Resilience_Level",
    "Cardiovascular_Age",
    "VO2_Max",
  ] as const;

  const sortedRows = Array.from(rowsByDay.values()).sort((a, b) => String(a.Date).localeCompare(String(b.Date)));
  const lines: string[] = [];
  lines.push("# Oura Export");
  lines.push("");
  lines.push(`Range: ${summary.range?.startDate ?? "-"} to ${summary.range?.endDate ?? "-"}`);
  lines.push("");
  lines.push("| " + columns.join(" | ") + " |");
  lines.push("| " + columns.map(() => "---").join(" | ") + " |");

  if (sortedRows.length === 0) {
    lines.push("| " + columns.map(() => "-").join(" | ") + " |");
  } else {
    for (const row of sortedRows) {
      const values = columns.map((column) => escapeMdCell(row[column] ?? "-"));
      lines.push(`| ${values.join(" | ")} |`);
    }
  }

  return lines.join("\n");
}

export default function OuraDashboardPage() {
  const { toast } = useToast();
  const today = todayIsoDate();
  const [startDate, setStartDate] = useState<string>(shiftIsoDate(today, -6));
  const [endDate, setEndDate] = useState<string>(today);
  const isRangeValid = startDate <= endDate;

  const { data: googleUser } = useQuery({
    queryKey: ["googleUser"],
    queryFn: getGoogleUser,
    staleTime: Infinity,
  });

  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ["oura-status"],
    queryFn: ouraApi.getStatus,
  });

  const { data: summary, isLoading: isSummaryLoading, refetch } = useQuery<OuraSummary>({
    queryKey: ["oura-summary", startDate, endDate],
    queryFn: () => ouraApi.getSummary({ startDate, endDate }),
    enabled: !!status?.enabled && !!status?.connected && isRangeValid,
  });

  const connectMutation = useMutation({
    mutationFn: ouraApi.getConnectUrl,
    onSuccess: (authUrl) => {
      window.location.href = authUrl;
    },
    onError: () => {
      toast({ title: "Could not start Oura connection", variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: ouraApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oura-status"] });
      queryClient.invalidateQueries({ queryKey: ["oura-summary"] });
      toast({ title: "Disconnected from Oura" });
    },
    onError: () => {
      toast({ title: "Failed to disconnect Oura", variant: "destructive" });
    },
  });

  const enabledByEmail = isOuraEnabledForCurrentUser();
  const isEnabled = enabledByEmail && !!status?.enabled;

  const latestActivityDay = useMemo(() => {
    const date = summary?.latestActivity?.day;
    return typeof date === "string" ? date : null;
  }, [summary?.latestActivity]);

  const latestSleepDay = useMemo(() => {
    const date = summary?.latestSleep?.day;
    return typeof date === "string" ? date : null;
  }, [summary?.latestSleep]);

  const markdownTableData = useMemo(() => {
    if (!summary?.connected) {
      return "";
    }

    return buildMarkdownTable(summary);
  }, [summary]);

  const copyRawData = async () => {
    if (!markdownTableData) {
      toast({ title: "No Oura data available to copy", variant: "destructive" });
      return;
    }

    try {
      await navigator.clipboard.writeText(markdownTableData);
      toast({ title: "Copied markdown table to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access was blocked.", variant: "destructive" });
    }
  };

  const useLast7Days = () => {
    const newEnd = todayIsoDate();
    setEndDate(newEnd);
    setStartDate(shiftIsoDate(newEnd, -6));
  };

  if (!googleUser) {
    return (
      <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold">Oura Dashboard</h1>
        <Card className="p-4 text-sm text-muted-foreground">
          Sign in with Google first to use account-based integrations.
        </Card>
      </div>
    );
  }

  if (!isEnabled && !isStatusLoading) {
    return (
      <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold">Oura Dashboard</h1>
        <Card className="p-4 text-sm text-muted-foreground">
          Oura dashboard is not enabled for this account.
          You are signed in as {googleUser.email}.
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Oura Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={useLast7Days}>
            Last 7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isSummaryLoading || !isRangeValid}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">Choose date range (default: last 7 days)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Start date</span>
            <input
              type="date"
              value={startDate}
              max={today}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">End date</span>
            <input
              type="date"
              value={endDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        {!isRangeValid && (
          <p className="text-sm text-destructive">Start date must be on or before end date.</p>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Connection</p>
            <p className="font-medium">
              {status?.connected ? "Connected to Oura" : "Not connected"}
            </p>
          </div>
          {status?.connected ? (
            <Button
              variant="outline"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}>
              <Link2 className="h-4 w-4 mr-2" />
              Connect Oura
            </Button>
          )}
        </div>
        {status?.lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Last sync: {new Date(status.lastSyncAt).toLocaleString()}
          </p>
        )}
      </Card>

      {status?.connected && (
        <>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">All Oura Data (Markdown Table)</p>
              <Button variant="outline" size="sm" onClick={copyRawData}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Flattened per-day markdown table with key activity, sleep, readiness, SpO2, stress, resilience, cardiovascular age, and VO2 max metrics.
            </p>
            <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">
              {markdownTableData || "No Oura data loaded yet."}
            </pre>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Avg Steps</p>
              <p className="text-xl font-bold flex items-center gap-1 mt-1">
                <Footprints className="h-4 w-4 text-primary" />
                {summary?.metrics?.avgSteps ?? "-"}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Avg Active Cal</p>
              <p className="text-xl font-bold flex items-center gap-1 mt-1">
                <Flame className="h-4 w-4 text-primary" />
                {summary?.metrics?.avgActiveCalories ?? "-"}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Avg Sleep (h)</p>
              <p className="text-xl font-bold flex items-center gap-1 mt-1">
                <Moon className="h-4 w-4 text-primary" />
                {summary?.metrics?.avgSleepHours ?? "-"}
              </p>
            </Card>
          </div>

          <Card className="p-4 space-y-2">
            <p className="font-medium flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-primary" />
              Oura Summary
            </p>
            <p className="text-sm text-muted-foreground">
              Range: {summary?.range?.startDate ?? "-"} to {summary?.range?.endDate ?? "-"}
            </p>
            <p className="text-sm text-muted-foreground">
              Latest activity day: {latestActivityDay ?? "-"}
            </p>
            <p className="text-sm text-muted-foreground">
              Latest sleep day: {latestSleepDay ?? "-"}
            </p>
            {summary?.reason && (
              <p className="text-sm text-destructive">{summary.reason}</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
