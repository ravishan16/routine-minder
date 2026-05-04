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

function buildMarkdownTable(summary: OuraSummary): string {
  const sections: string[] = [];

  sections.push("# Oura Export");
  sections.push("");
  sections.push("## Date Range");
  sections.push("| Field | Value |");
  sections.push("| --- | --- |");
  sections.push(`| Start Date | ${escapeMdCell(summary.range?.startDate || "-")} |`);
  sections.push(`| End Date | ${escapeMdCell(summary.range?.endDate || "-")} |`);

  sections.push("");
  sections.push("## Metrics");
  sections.push("| Metric | Value |");
  sections.push("| --- | --- |");
  sections.push(`| Avg Steps | ${escapeMdCell(summary.metrics?.avgSteps ?? "-")} |`);
  sections.push(`| Avg Active Calories | ${escapeMdCell(summary.metrics?.avgActiveCalories ?? "-")} |`);
  sections.push(`| Avg Sleep Hours | ${escapeMdCell(summary.metrics?.avgSleepHours ?? "-")} |`);

  sections.push("");
  sections.push("## Profile");
  sections.push("| Field | Value |");
  sections.push("| --- | --- |");

  const profileEntries = Object.entries(summary.profile || {});
  if (profileEntries.length === 0) {
    sections.push("| - | - |");
  } else {
    for (const [key, value] of profileEntries) {
      sections.push(`| ${escapeMdCell(key)} | ${escapeMdCell(value)} |`);
    }
  }

  sections.push("");
  sections.push("## Daily Activity");
  sections.push("| Day | Steps | Active Calories | Raw JSON |");
  sections.push("| --- | --- | --- | --- |");

  const activityRows = Array.isArray(summary.activity) ? summary.activity : [];
  if (activityRows.length === 0) {
    sections.push("| - | - | - | - |");
  } else {
    for (const row of activityRows) {
      const day = typeof row.day === "string" ? row.day : "-";
      const steps = typeof row.steps === "number" ? row.steps : "-";
      const activeCalories = typeof row.active_calories === "number" ? row.active_calories : "-";
      sections.push(`| ${escapeMdCell(day)} | ${escapeMdCell(steps)} | ${escapeMdCell(activeCalories)} | ${escapeMdCell(JSON.stringify(row))} |`);
    }
  }

  sections.push("");
  sections.push("## Daily Sleep");
  sections.push("| Day | Total Sleep Duration (sec) | Raw JSON |");
  sections.push("| --- | --- | --- |");

  const sleepRows = Array.isArray(summary.sleep) ? summary.sleep : [];
  if (sleepRows.length === 0) {
    sections.push("| - | - | - |");
  } else {
    for (const row of sleepRows) {
      const day = typeof row.day === "string" ? row.day : "-";
      const totalSleep = typeof row.total_sleep_duration === "number" ? row.total_sleep_duration : "-";
      sections.push(`| ${escapeMdCell(day)} | ${escapeMdCell(totalSleep)} | ${escapeMdCell(JSON.stringify(row))} |`);
    }
  }

  return sections.join("\n");
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
              Full profile, activity, and sleep data in markdown table format for the selected window.
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
