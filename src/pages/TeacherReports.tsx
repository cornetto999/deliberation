import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";
import { Loader2, BarChart3 } from "lucide-react";

type Zone = "green" | "yellow" | "red";

interface Teacher {
  id: number;
  teacher_id: string;
  first_name: string;
  last_name: string;
  department: string;
  zone: Zone;
  enrolled_students?: number;
  p1_failed?: number; p1_percent?: number; p1_category?: string;
  p2_failed?: number; p2_percent?: number; p2_category?: string;
  p3_failed?: number; p3_percent?: number; p3_category?: string;
}

const TeacherReports = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"P1" | "P2" | "P3">("P1");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl('teachers.php'));
        const data = await response.json();
        setTeachers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching teachers for reports:', err);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const calcPercent = (failed?: number | string, enrolled?: number | string) => {
    const f = Number(failed);
    const e = Number(enrolled);
    if (!isFinite(f) || !isFinite(e) || e <= 0) return null;
    return (f / e) * 100;
  };

  const percentFromData = (
    dbPercent?: number | string,
    failed?: number | string,
    enrolled?: number | string
  ) => {
    const direct = Number(dbPercent);
    const calc = calcPercent(failed, enrolled);
    if (calc !== null) return calc;
    if (isFinite(direct)) return direct;
    return null;
  };

  const categoryFromPercentValue = (pct: number) => {
    if (pct === 0) return 'GREEN (0%)';
    if (pct <= 10) return 'GREEN (0.01%-10%)';
    if (pct <= 40) return 'YELLOW (10.01%-40%)';
    return 'RED (40.01%-100%)';
  };

  // Keys based on selected period
  const periodKey = period.toLowerCase(); // p1 | p2 | p3
  const failedKey = `${periodKey}_failed` as keyof Teacher;
  const percentKey = `${periodKey}_percent` as keyof Teacher;
  const categoryKey = `${periodKey}_category` as keyof Teacher;

  const topPercentData = useMemo(() => {
    const rows = (teachers || [])
      .map((t) => {
        const pct = percentFromData(t[percentKey] as any, t[failedKey] as any, t.enrolled_students);
        return pct === null ? null : {
          name: `${t.first_name} ${t.last_name}`,
          teacherId: t.teacher_id,
          percent: Number(pct.toFixed(2))
        };
      })
      .filter(Boolean) as { name: string; teacherId: string; percent: number }[];
    return rows.sort((a, b) => b.percent - a.percent).slice(0, 10);
  }, [teachers, percentKey, failedKey]);

  const totalsData = useMemo(() => {
    const totalEnrolled = (teachers || []).reduce((sum, t) => sum + (Number(t.enrolled_students) || 0), 0);
    const totalFailed = (teachers || []).reduce((sum, t) => sum + (Number(t[failedKey] as any) || 0), 0);
    return [{ label: `Totals ${period}`, enrolled: totalEnrolled, failed: totalFailed }];
  }, [teachers, failedKey, period]);

  const categoryDistribution = useMemo(() => {
    const counts = { green: 0, yellow: 0, red: 0 };
    (teachers || []).forEach((t) => {
      const pct = percentFromData(t[percentKey] as any, t[failedKey] as any, t.enrolled_students);
      let bucket: Zone | null = null;
      if (pct !== null) {
        const label = categoryFromPercentValue(pct);
        if (label.startsWith('GREEN')) bucket = 'green';
        else if (label.startsWith('YELLOW')) bucket = 'yellow';
        else bucket = 'red';
      } else {
        const cat = (t[categoryKey] as string) || '';
        if (cat.startsWith('GREEN')) bucket = 'green';
        else if (cat.startsWith('YELLOW')) bucket = 'yellow';
        else if (cat.startsWith('RED')) bucket = 'red';
      }
      if (bucket) counts[bucket] += 1;
    });
    return [
      { name: 'GREEN', value: counts.green },
      { name: 'YELLOW', value: counts.yellow },
      { name: 'RED', value: counts.red },
    ];
  }, [teachers, percentKey, failedKey, categoryKey]);

  const percentChartConfig = {
    percent: { label: "% Failed" },
  };

  const COLOR_GREEN = "#22c55e"; // green-500
  const COLOR_YELLOW = "#facc15"; // yellow-400
  const COLOR_RED = "#ef4444"; // red-500

  const getColorForPercent = (pct: number) => {
    if (pct === 0) return COLOR_GREEN;
    if (pct <= 10) return COLOR_GREEN;
    if (pct <= 40) return COLOR_YELLOW;
    return COLOR_RED;
  };

  const totalsChartConfig = {
    enrolled: { label: "Enrolled", color: COLOR_GREEN },
    failed: { label: "Failed", color: COLOR_RED },
  };

  const categoryChartColors = {
    GREEN: COLOR_GREEN,
    YELLOW: COLOR_YELLOW,
    RED: COLOR_RED,
  } as const;

  const categoryChartConfig = {
    GREEN: { label: "GREEN", color: categoryChartColors.GREEN },
    YELLOW: { label: "YELLOW", color: categoryChartColors.YELLOW },
    RED: { label: "RED", color: categoryChartColors.RED },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Reports</h1>
          <p className="text-muted-foreground">Charts and insights based on faculty performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/teachers')}>
            Back to Teachers
          </Button>
          <Button onClick={() => navigate('/teachers')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Manage Teachers
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Failure Percent by Teacher (Top 10)</CardTitle>
            <CardDescription>Sorted by highest % in the selected period</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Period:</span>
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="P1">P1</SelectItem>
                <SelectItem value="P2">P2</SelectItem>
                <SelectItem value="P3">P3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={percentChartConfig}>
            <BarChart data={topPercentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide={false} tick={{ fontSize: 10 }} interval={0} angle={-30} dy={20} />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <ChartTooltip content={<ChartTooltipContent nameKey="percent" />} />
              <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                {topPercentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForPercent(entry.percent)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution ({period})</CardTitle>
            <CardDescription>GREEN vs YELLOW vs RED across teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" outerRadius={100} label>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--color-${entry.name})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="value" />} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Enrolled vs Failed ({period})</CardTitle>
            <CardDescription>Aggregated counts across all teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={totalsChartConfig}>
              <BarChart data={totalsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="enrolled" fill={COLOR_GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill={COLOR_RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherReports;