import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, User, Edit, Eye, Loader2, Upload, Download, Settings, ArrowUpDown, ChevronLeft, ChevronRight, Filter, BarChart3, TrendingUp, PieChart } from "lucide-react";
import ZoneBadge from "@/components/ZoneBadge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

interface Teacher {
  id: number;
  teacher_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email?: string;
  department: string;
  position?: string;
  status: string;
  zone: "green" | "yellow" | "red";
  notes?: string;
  enrolled_students?: number;
  failed_students?: number;
  failure_percentage?: number | string;
  p1_failed?: number;
  p1_percent?: number | string;
  p1_category?: string;
  p2_failed?: number;
  p2_percent?: number | string;
  p2_category?: string;
  p3_failed?: number;
  p3_percent?: number | string;
  p3_category?: string;
  created_at: string;
}

const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [semester, setSemester] = useState("1st");
  const [selectedPeriod, setSelectedPeriod] = useState("P1");
  const [formData, setFormData] = useState({
    teacher_id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    department: "",
    position: "",
    status: "Active",
    zone: "green" as Teacher["zone"],
    notes: ""
  });
  
  // New flexible state
  const [sortField, setSortField] = useState<keyof Teacher | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState({
    teacher_id: true,
    name: true,
    department: true,
    enrolled: true,
    p1_performance: true,
    p2_performance: true,
    p3_performance: true,
    zone: true,
    actions: true
  });
  const [filters, setFilters] = useState({
    department: '',
    zone: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    department: '',
    performanceRange: 'all',
    chartType: 'bar'
  });
  
  const { toast } = useToast();

  // Filter teachers based on report filters
  const getFilteredTeachers = () => {
    return teachers.filter(teacher => {
      // Department filter
      if (reportFilters.department && teacher.department !== reportFilters.department) {
        return false;
      }
      
      // Performance range filter
      if (reportFilters.performanceRange !== 'all') {
        const avgPercent = ((Number(teacher.p1_percent) || 0) + (Number(teacher.p2_percent) || 0) + (Number(teacher.p3_percent) || 0)) / 3;
        switch (reportFilters.performanceRange) {
          case 'green':
            return avgPercent <= 10;
          case 'yellow':
            return avgPercent > 10 && avgPercent <= 40;
          case 'red':
            return avgPercent > 40;
          default:
            return true;
        }
      }
      
      return true;
    });
  };

  // Chart data generation functions
  const getZoneDistributionData = () => {
    const filteredTeachers = getFilteredTeachers();
    const zones = filteredTeachers.reduce((acc, teacher) => {
      acc[teacher.zone] = (acc[teacher.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(zones).map(([zone, count]) => ({
      zone: zone.charAt(0).toUpperCase() + zone.slice(1),
      count,
      percentage: Math.round((count / filteredTeachers.length) * 100)
    }));
  };

  const getDepartmentPerformanceData = () => {
    const filteredTeachers = getFilteredTeachers();
    const departments = filteredTeachers.reduce((acc, teacher) => {
      if (!acc[teacher.department]) {
        acc[teacher.department] = {
          total: 0,
          green: 0,
          yellow: 0,
          red: 0,
          avgP1Percent: 0,
          avgP2Percent: 0,
          avgP3Percent: 0
        };
      }
      acc[teacher.department].total++;
      acc[teacher.department][teacher.zone]++;
      
      const p1Percent = Number(teacher.p1_percent) || 0;
      const p2Percent = Number(teacher.p2_percent) || 0;
      const p3Percent = Number(teacher.p3_percent) || 0;
      
      acc[teacher.department].avgP1Percent += p1Percent;
      acc[teacher.department].avgP2Percent += p2Percent;
      acc[teacher.department].avgP3Percent += p3Percent;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(departments).map(([department, data]) => ({
      department: department.length > 15 ? department.substring(0, 15) + '...' : department,
      total: data.total,
      green: data.green,
      yellow: data.yellow,
      red: data.red,
      avgP1Percent: Math.round((data.avgP1Percent / data.total) * 10) / 10,
      avgP2Percent: Math.round((data.avgP2Percent / data.total) * 10) / 10,
      avgP3Percent: Math.round((data.avgP3Percent / data.total) * 10) / 10
    }));
  };

  const getPerformanceTrendData = () => {
    return getFilteredTeachers().map(teacher => ({
      name: `${teacher.first_name.split(' ')[0]} ${teacher.last_name}`.substring(0, 15),
      p1: Number(teacher.p1_percent) || 0,
      p2: Number(teacher.p2_percent) || 0,
      p3: Number(teacher.p3_percent) || 0,
      zone: teacher.zone
    }));
  };

  const getTopPerformersData = () => {
    return getFilteredTeachers()
      .map(teacher => ({
        name: `${teacher.first_name} ${teacher.last_name}`.substring(0, 20),
        p1Percent: Number(teacher.p1_percent) || 0,
        p2Percent: Number(teacher.p2_percent) || 0,
        p3Percent: Number(teacher.p3_percent) || 0,
        avgPercent: ((Number(teacher.p1_percent) || 0) + (Number(teacher.p2_percent) || 0) + (Number(teacher.p3_percent) || 0)) / 3,
        zone: teacher.zone
      }))
      .sort((a, b) => a.avgPercent - b.avgPercent)
      .slice(0, 10);
  };

  const exportReportsData = () => {
    const reportsData = {
      zoneDistribution: getZoneDistributionData(),
      departmentPerformance: getDepartmentPerformanceData(),
      performanceTrends: getPerformanceTrendData(),
      topPerformers: getTopPerformersData(),
      summary: {
        totalTeachers: teachers.length,
        greenZone: teachers.filter(t => t.zone === 'green').length,
        yellowZone: teachers.filter(t => t.zone === 'yellow').length,
        redZone: teachers.filter(t => t.zone === 'red').length,
        generatedAt: new Date().toISOString()
      }
    };

    const dataStr = JSON.stringify(reportsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Reports Exported",
      description: "Teacher performance reports have been downloaded successfully.",
    });
  };

  // Generate academic years from 2023 to present
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let year = 2023; year <= currentYear; year++) {
    academicYears.push(`${year}-${year + 1}`);
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/deliberation/routes/teachers.php');
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTeachers(data);
      } else {
        console.error('Invalid data format:', data);
        setTeachers([]);
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
      toast({
        title: "Error",
        description: "Failed to load teachers data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering and sorting logic
  const filteredTeachers = (teachers || []).filter(teacher => {
    const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
           teacher.teacher_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           teacher.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filters.department || teacher.department === filters.department;
    const matchesZone = !filters.zone || teacher.zone === filters.zone;
    const matchesStatus = !filters.status || teacher.status === filters.status;
    
    return matchesSearch && matchesDepartment && matchesZone && matchesStatus;
  });

  // Sorting logic
  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle special cases for sorting
    if (sortField === 'first_name' || sortField === 'last_name') {
      aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
      bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = sortedTeachers.slice(startIndex, startIndex + itemsPerPage);

  // Get unique values for filters
  const departments = [...new Set(teachers.map(t => t.department))];
  const zones = [...new Set(teachers.map(t => t.zone))];
  const statuses = [...new Set(teachers.map(t => t.status))];

  const handleSort = (field: keyof Teacher) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // P1, P2, and P3 are always available

  // Helper to render a compact, color-coded performance cell for P1/P2/P3
  const renderPerformance = (teacher: Teacher, period: 'p1' | 'p2' | 'p3') => {
    const failed = (teacher as any)[`${period}_failed`] as number | undefined;
    const percent = (teacher as any)[`${period}_percent`] as number | undefined;
    const category = (teacher as any)[`${period}_category`] as string | undefined;

    const isNA = !failed || failed === 0;
    const badgeClassName = isNA
      ? 'bg-blue-500 hover:bg-blue-600 text-white'
      : category?.includes('RED')
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : category?.includes('YELLOW')
      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
      : 'bg-green-500 hover:bg-green-600 text-white';

    const percentText = percent && !isNaN(Number(percent)) ? `${Number(percent).toFixed(1)}%` : 'N/A';
    const badgeLabel = isNA ? 'N/A' : category || 'N/A';

    return (
      <div className="space-y-1">
        <div className="text-sm">Failed: {failed || 0}</div>
        <div className="text-xs text-muted-foreground">{percentText}</div>
        <Badge className={`text-xs ${badgeClassName}`}>{badgeLabel}</Badge>
      </div>
    );
  };

  // Helper to render categorization badge only
  const renderCategoryBadge = (category?: string) => {
    const badgeClassName = !category
      ? 'bg-blue-500 hover:bg-blue-600 text-white'
      : category.includes('RED')
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : category.includes('YELLOW')
      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
      : 'bg-green-500 hover:bg-green-600 text-white';
    return <Badge className={`text-xs ${badgeClassName}`}>{category || 'N/A'}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading teachers...</span>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      teacher_id: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      email: "",
      department: "",
      position: "",
      status: "Active",
      zone: "green",
      notes: ""
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      teacher_id: teacher.teacher_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      middle_name: teacher.middle_name || "",
      email: teacher.email || "",
      department: teacher.department,
      position: teacher.position || "",
      status: teacher.status,
      zone: teacher.zone,
      notes: teacher.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsViewDialogOpen(true);
  };

  const handleSaveTeacher = async () => {
    if (!formData.teacher_id || !formData.first_name || !formData.last_name || !formData.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('http://localhost/deliberation/routes/teachers.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher added successfully"
        });
        setIsAddDialogOpen(false);
        resetForm();
        fetchTeachers();
      } else {
        throw new Error('Failed to add teacher');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast({
        title: "Error",
        description: "Failed to add teacher",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher || !formData.teacher_id || !formData.first_name || !formData.last_name || !formData.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost/deliberation/routes/teachers.php?id=${selectedTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher updated successfully"
        });
        setIsEditDialogOpen(false);
        setSelectedTeacher(null);
        resetForm();
        fetchTeachers();
      } else {
        throw new Error('Failed to update teacher');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast({
        title: "Error",
        description: "Failed to update teacher",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - only CSV supported
    const allowedTypes = ['text/csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      toast({
        title: "Excel file not supported",
        description: (
          <div className="space-y-2">
            <p>Excel files (.xlsx, .xls) are not directly supported.</p>
            <div className="text-sm">
              <p className="font-medium">Please convert to CSV:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Open your Excel file</li>
                <li>Go to File → Save As</li>
                <li>Choose "CSV (Comma delimited)" format</li>
                <li>Save the file</li>
                <li>Upload the CSV file instead</li>
              </ol>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000
      });
      return;
    }

    if (!allowedTypes.includes(file.type) && fileExtension !== 'csv') {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV files only.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'teachers');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('http://localhost/deliberation/routes/upload.php', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Upload successful",
          description: result.message,
        });
        // Refresh the teachers list
        fetchTeachers();
      } else {
        // Handle Excel file error with instructions
        if (result.instructions) {
          const instructionText = result.instructions.join('\n');
          toast({
            title: "Excel file not supported",
            description: (
              <div className="space-y-2">
                <p>{result.error}</p>
                <div className="text-sm">
                  <p className="font-medium">Instructions:</p>
                  <pre className="whitespace-pre-wrap text-xs">{instructionText}</pre>
                </div>
              </div>
            ),
            variant: "destructive",
            duration: 10000
          });
        } else {
          toast({
            title: "Upload failed",
            description: result.error || "Failed to upload file",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Network error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    let csvContent = "FacultyNo,FacultyName,EnrolledStudents,P1_Failed,P1_Percent,P1_Category,P2_Failed,P2_Percent,P2_Category";
    let sampleData = "14-007-F,ADORMIE CORRALES MACARIO,184,18,9.78,GREEN (0.01%-10%),,,\n" +
      "24-219-F,ALEXIS VIADOR LAROSA,307,9,2.93,GREEN (0.01%-10%),,,\n" +
      "24-077-F,AMBER ANN ACAYLAR,201,16,7.96,GREEN (0.01%-10%),,,";
    
    // Add P3 only for 2nd semester
    if (semester === "2nd") {
      csvContent += ",P3_Failed,P3_Percent,P3_Category";
      sampleData = sampleData.replace(/,,,/g, ",,,");
    }
    
    csvContent += "\n" + sampleData;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_performance_template_${semester}_semester.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">
            Manage faculty records and performance evaluation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload CSV file"
            />
            <Button disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? `Uploading... ${uploadProgress}%` : "Upload CSV"}
            </Button>
          </div>
          <Button 
            onClick={() => setShowReports(!showReports)} 
            variant={showReports ? "default" : "outline"}
            className="mr-2"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showReports ? "Hide Reports" : "View Reports"}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Reports Section */}
      {showReports && (
        <div className="space-y-6 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Teacher Performance Analytics
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis of teacher performance across different periods and departments
                  </CardDescription>
                </div>
                <Button onClick={exportReportsData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Advanced Filters for Reports */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Report Filters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="report-department" className="text-sm">Department</Label>
                    <Select value={reportFilters.department} onValueChange={(value) => setReportFilters(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Departments</SelectItem>
                        {Array.from(new Set(teachers.map(t => t.department))).map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="report-performance" className="text-sm">Performance Range</Label>
                    <Select value={reportFilters.performanceRange} onValueChange={(value) => setReportFilters(prev => ({ ...prev, performanceRange: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Performance Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Performance Levels</SelectItem>
                        <SelectItem value="green">Green Zone (0-10%)</SelectItem>
                        <SelectItem value="yellow">Yellow Zone (10-40%)</SelectItem>
                        <SelectItem value="red">Red Zone (40%+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="report-chart" className="text-sm">Chart Type</Label>
                    <Select value={reportFilters.chartType} onValueChange={(value) => setReportFilters(prev => ({ ...prev, chartType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Chart Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setReportFilters({ department: '', performanceRange: 'all', chartType: 'bar' })}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Zone Distribution Pie Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Performance Zone Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={getZoneDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({zone, percentage}) => `${zone}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {getZoneDistributionData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.zone === 'Green' ? '#10b981' : 
                              entry.zone === 'Yellow' ? '#f59e0b' : '#ef4444'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Department Performance Bar Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Average Performance by Department
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getDepartmentPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="department" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgP1Percent" fill="#3b82f6" name="P1 Avg %" />
                      <Bar dataKey="avgP2Percent" fill="#8b5cf6" name="P2 Avg %" />
                      <Bar dataKey="avgP3Percent" fill="#06b6d4" name="P3 Avg %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic Performance Comparison Chart */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance Comparison ({reportFilters.chartType.charAt(0).toUpperCase() + reportFilters.chartType.slice(1)} Chart)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  {reportFilters.chartType === 'bar' ? (
                    <BarChart data={getDepartmentPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="department" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgP1Percent" fill="#3b82f6" name="P1 Avg %" />
                      <Bar dataKey="avgP2Percent" fill="#8b5cf6" name="P2 Avg %" />
                      <Bar dataKey="avgP3Percent" fill="#06b6d4" name="P3 Avg %" />
                    </BarChart>
                  ) : reportFilters.chartType === 'line' ? (
                    <LineChart data={getDepartmentPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="department" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgP1Percent" stroke="#3b82f6" name="P1 Avg %" strokeWidth={2} />
                      <Line type="monotone" dataKey="avgP2Percent" stroke="#8b5cf6" name="P2 Avg %" strokeWidth={2} />
                      <Line type="monotone" dataKey="avgP3Percent" stroke="#06b6d4" name="P3 Avg %" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <AreaChart data={getDepartmentPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="department" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="avgP1Percent" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="P1 Avg %" />
                      <Area type="monotone" dataKey="avgP2Percent" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" name="P2 Avg %" />
                      <Area type="monotone" dataKey="avgP3Percent" stackId="3" stroke="#06b6d4" fill="#06b6d4" name="P3 Avg %" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Performance Trends */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Trends Across Periods
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={getPerformanceTrendData().slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="p1" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      name="P1 %"
                      opacity={0.7}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p2" 
                      stackId="2" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      name="P2 %"
                      opacity={0.7}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p3" 
                      stackId="3" 
                      stroke="#06b6d4" 
                      fill="#06b6d4" 
                      name="P3 %"
                      opacity={0.7}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top Performers */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Top 10 Performers (Lowest Failure Rates)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getTopPerformersData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgPercent" fill="#10b981" name="Average Failure %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Insights */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Department Performance Ranking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getDepartmentPerformanceData()
                          .sort((a, b) => a.avgP1Percent - b.avgP1Percent)
                          .slice(0, 5)
                          .map((dept, index) => (
                            <div key={dept.department} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">#{index + 1}</span>
                                <span className="text-sm">{dept.department}</span>
                              </div>
                              <Badge variant={dept.avgP1Percent <= 10 ? "default" : dept.avgP1Percent <= 40 ? "secondary" : "destructive"}>
                                {dept.avgP1Percent.toFixed(1)}%
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getTopPerformersData().slice(0, 5).map((teacher, index) => (
                          <div key={teacher.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">#{index + 1}</span>
                              <span className="text-sm">{teacher.name}</span>
                            </div>
                            <Badge variant={teacher.avgPercent <= 10 ? "default" : teacher.avgPercent <= 40 ? "secondary" : "destructive"}>
                              {teacher.avgPercent.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {getFilteredTeachers().filter(t => t.zone === 'green').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Green Zone Teachers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {getFilteredTeachers().filter(t => t.zone === 'yellow').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Yellow Zone Teachers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {getFilteredTeachers().filter(t => t.zone === 'red').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Red Zone Teachers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {getFilteredTeachers().length}
                    </div>
                    <p className="text-sm text-muted-foreground">Filtered Teachers</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Academic Year and Semester Selectors */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Academic Year:</span>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Vertical separator line */}
        <div className="h-6 w-px bg-border"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Semester:</span>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">1st</SelectItem>
              <SelectItem value="2nd">2nd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Period selector dropdown */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-20 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P1">P1</SelectItem>
              <SelectItem value="P2">P2</SelectItem>
              <SelectItem value="P3">P3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find teachers by name, ID, or department
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(visibleColumns).map(([key, visible]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={visible}
                      onCheckedChange={(checked) =>
                        setVisibleColumns(prev => ({ ...prev, [key]: checked }))
                      }
                    >
                      {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="department-filter">Department</Label>
                  <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone-filter">Zone</Label>
                  <Select value={filters.zone} onValueChange={(value) => setFilters(prev => ({ ...prev, zone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All zones</SelectItem>
                      {zones.map(zone => (
                        <SelectItem key={zone} value={zone}>
                          {zone.charAt(0).toUpperCase() + zone.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Faculty List</CardTitle>
              <CardDescription>
                {sortedTeachers.length} teachers found
                {sortedTeachers.length !== teachers.length && ` (filtered from ${teachers.length} total)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm">Show:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white text-black">
                  {visibleColumns.teacher_id && (
                    <TableHead 
                      className="cursor-pointer text-black hover:bg-muted/50"
                      onClick={() => handleSort('teacher_id')}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        Faculty Number
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead 
                      className="cursor-pointer text-black hover:bg-muted/50"
                      onClick={() => handleSort('first_name')}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        Faculty Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.department && (
                    <TableHead 
                      className="cursor-pointer text-black hover:bg-muted/50"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        Department
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.enrolled && (
                    <TableHead 
                      className="cursor-pointer text-black hover:bg-muted/50"
                      onClick={() => handleSort('enrolled_students')}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        Number of Enrolled Students
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.p1_performance && (
                    <>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P1 Number of Failed</TableHead>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P1 % of Failed</TableHead>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P1 Categorization</TableHead>
                    </>
                  )}
                  {visibleColumns.p2_performance && (
                    <>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P2 Number of Failed</TableHead>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P2 % of Failed</TableHead>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P2 Categorization</TableHead>
                    </>
                  )}
                  {visibleColumns.p3_performance && (
                    <>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P3 Number of Failed</TableHead>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P3 % of Failed</TableHead>
                      <TableHead className="text-black hover:bg-muted/50 font-semibold">P3 Categorization</TableHead>
                    </>
                  )}
                  {visibleColumns.zone && (
                    <TableHead 
                      className="cursor-pointer text-black hover:bg-muted/50"
                      onClick={() => handleSort('zone')}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        Zone
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="text-black hover:bg-muted/50 font-semibold">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    {visibleColumns.teacher_id && (
                      <TableCell className="font-medium">
                        {teacher.teacher_id}
                      </TableCell>
                    )}
                    {visibleColumns.name && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {`${teacher.first_name} ${teacher.last_name}`}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.department && (
                      <TableCell>
                        <Badge variant="outline" className="truncate max-w-[150px]">
                          {teacher.department}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.enrolled && (
                      <TableCell>
                        <div className="text-sm font-medium">
                          {teacher.enrolled_students || 0}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.p1_performance && (
                      <>
                        <TableCell>{teacher.p1_failed ?? 0}</TableCell>
                        <TableCell>
                          {teacher.p1_percent && !isNaN(Number(teacher.p1_percent)) ? `${Number(teacher.p1_percent).toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>{renderCategoryBadge(teacher.p1_category)}</TableCell>
                      </>
                    )}
                    {visibleColumns.p2_performance && (
                      <>
                        <TableCell>{teacher.p2_failed ?? 0}</TableCell>
                        <TableCell>
                          {teacher.p2_percent && !isNaN(Number(teacher.p2_percent)) ? `${Number(teacher.p2_percent).toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>{renderCategoryBadge(teacher.p2_category)}</TableCell>
                      </>
                    )}
                    {visibleColumns.p3_performance && (
                      <>
                        <TableCell>{teacher.p3_failed ?? 0}</TableCell>
                        <TableCell>
                          {teacher.p3_percent && !isNaN(Number(teacher.p3_percent)) ? `${Number(teacher.p3_percent).toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>{renderCategoryBadge(teacher.p3_category)}</TableCell>
                      </>
                    )}
                    {visibleColumns.zone && (
                      <TableCell>
                        <ZoneBadge zone={teacher.zone} />
                      </TableCell>
                    )}
                    {visibleColumns.actions && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleView(teacher)}>
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTeachers.length)} of {sortedTeachers.length} teachers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {new Set((teachers || []).map(t => t.department)).size}
            </div>
            <p className="text-xs text-muted-foreground">Departments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {(teachers || []).filter(t => t.zone === "green").length}
            </div>
            <p className="text-xs text-muted-foreground">High performers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {(teachers || []).filter(t => t.zone === "red").length}
            </div>
            <p className="text-xs text-muted-foreground">Need support</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new teacher to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher_id" className="text-right">Teacher ID*</Label>
              <Input
                id="teacher_id"
                value={formData.teacher_id}
                onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                className="col-span-3"
                placeholder="T001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">First Name*</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="col-span-3"
                placeholder="First Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">Last Name*</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="col-span-3"
                placeholder="Last Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="middle_name" className="text-right">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                className="col-span-3"
                placeholder="Middle Name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
                placeholder="teacher@school.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Department*</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="col-span-3"
                placeholder="General Education"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="col-span-3"
                placeholder="Faculty"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="zone" className="text-right">Zone</Label>
              <Select value={formData.zone} onValueChange={(value: Teacher["zone"]) => setFormData({...formData, zone: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="col-span-3"
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTeacher}>Add Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update the teacher's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_teacher_id" className="text-right">Teacher ID*</Label>
              <Input
                id="edit_teacher_id"
                value={formData.teacher_id}
                onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_first_name" className="text-right">First Name*</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_last_name" className="text-right">Last Name*</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_middle_name" className="text-right">Middle Name</Label>
              <Input
                id="edit_middle_name"
                value={formData.middle_name}
                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_email" className="text-right">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_department" className="text-right">Department*</Label>
              <Input
                id="edit_department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_position" className="text-right">Position</Label>
              <Input
                id="edit_position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_status" className="text-right">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_zone" className="text-right">Zone</Label>
              <Select value={formData.zone} onValueChange={(value: Teacher["zone"]) => setFormData({...formData, zone: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_notes" className="text-right">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTeacher}>Update Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>
              View teacher information
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Teacher ID:</Label>
                <div className="col-span-3">{selectedTeacher.teacher_id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Name:</Label>
                <div className="col-span-3">{selectedTeacher.first_name} {selectedTeacher.last_name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Email:</Label>
                <div className="col-span-3">{selectedTeacher.email || 'No email'}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Position:</Label>
                <div className="col-span-3">{selectedTeacher.position || 'No position'}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Status:</Label>
                <div className="col-span-3">{selectedTeacher.status}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Department:</Label>
                <div className="col-span-3">{selectedTeacher.department}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Zone:</Label>
                <div className="col-span-3">
                  <ZoneBadge zone={selectedTeacher.zone} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Notes:</Label>
                <div className="col-span-3">{selectedTeacher.notes || "No notes"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created:</Label>
                <div className="col-span-3">{new Date(selectedTeacher.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;