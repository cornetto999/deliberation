import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ZoneBadge from "@/components/ZoneBadge";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

interface DashboardStats {
  totalStudents: number;
  atRiskStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  zoneDistribution: {
    green: number;
    yellow: number;
    red: number;
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    atRiskStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    zoneDistribution: { green: 0, yellow: 0, red: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch students data
      const studentsResponse = await fetch(apiUrl('students.php'));
      const students = await studentsResponse.json();
      
      // Fetch teachers data
      const teachersResponse = await fetch(apiUrl('teachers.php'));
      const teachers = await teachersResponse.json();
      
      // Fetch subjects data
      const subjectsResponse = await fetch(apiUrl('subjects.php'));
      const subjects = await subjectsResponse.json();

      // Calculate stats
      const totalStudents = students.length;
      const atRiskStudents = students.filter((s: any) => s.at_risk).length;
      const totalTeachers = teachers.length;
      const totalSubjects = subjects.length;

      const zoneDistribution = {
        green: students.filter((s: any) => s.zone === 'green').length,
        yellow: students.filter((s: any) => s.zone === 'yellow').length,
        red: students.filter((s: any) => s.zone === 'red').length,
      };

      setStats({
        totalStudents,
        atRiskStudents,
        totalTeachers,
        totalSubjects,
        zoneDistribution
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReports = () => {
    toast({
      title: "Generating reports",
      description: "Academic reports are being prepared..."
    });
  };

  const handleReviewAtRisk = () => {
    toast({
      title: "Reviewing at-risk students",
      description: "Opening at-risk student analysis..."
    });
  };

  const handleUpdateZones = () => {
    toast({
      title: "Updating zones",
      description: "Performance zones are being recalculated..."
    });
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: GraduationCap,
      description: "Enrolled students",
      trend: "up"
    },
    {
      title: "At Risk Students",
      value: stats.atRiskStudents,
      icon: AlertTriangle,
      description: "Need intervention",
      trend: "down"
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      icon: Users,
      description: "Active faculty",
      trend: "up"
    },
    {
      title: "Total Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      description: "Courses offered",
      trend: "up"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of student performance and academic metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendIcon className="h-3 w-3" />
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Zone Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zone Distribution</CardTitle>
            <CardDescription>
              Student performance by zone classification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoneBadge zone="green" />
                <span className="text-sm">Performing Well</span>
              </div>
              <Badge variant="secondary">{stats.zoneDistribution.green} students</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoneBadge zone="yellow" />
                <span className="text-sm">Needs Attention</span>
              </div>
              <Badge variant="secondary">{stats.zoneDistribution.yellow} students</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoneBadge zone="red" />
                <span className="text-sm">Critical Intervention</span>
              </div>
              <Badge variant="secondary">{stats.zoneDistribution.red} students</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common deliberation tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-auto p-4"
              onClick={handleGenerateReports}
            >
              <FileText className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="text-sm font-medium">Generate Reports</div>
                <div className="text-xs text-muted-foreground">
                  Create comprehensive academic reports
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-auto p-4"
              onClick={handleReviewAtRisk}
            >
              <AlertTriangle className="h-4 w-4 text-zone-red" />
              <div className="text-left">
                <div className="text-sm font-medium">Review At-Risk Students</div>
                <div className="text-xs text-muted-foreground">
                  {stats.atRiskStudents} students need review
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-auto p-4"
              onClick={handleUpdateZones}
            >
              <RefreshCw className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="text-sm font-medium">Update Zone Classifications</div>
                <div className="text-xs text-muted-foreground">
                  Refresh performance zones
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and changes in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-muted-foreground">2 hours ago</span>
              <span>Sarah Williams moved to Red Zone</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">4 hours ago</span>
              <span>New batch of students uploaded via CSV</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-zone-green rounded-full"></div>
              <span className="text-muted-foreground">1 day ago</span>
              <span>Emma Johnson achieved Green Zone status</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;