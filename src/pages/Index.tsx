import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, LogOut, GraduationCap, Users, BookOpen, LayoutGrid, Settings, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface AttendanceRecord {
  id: string;
  roll: string;
  name: string;
  className: string;
  section: string;
  status: "Present" | "Absent";
  date: string;
}

const STORAGE_KEY = "attendance-records";

type Page = "home" | "attendance" | "section" | "class" | "settings";

const navItems: { key: Page; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "Home", icon: <LayoutGrid className="h-4 w-4" /> },
  { key: "attendance", label: "Attendance", icon: <Users className="h-4 w-4" /> },
  { key: "section", label: "Section", icon: <BookOpen className="h-4 w-4" /> },
  { key: "class", label: "Class", icon: <GraduationCap className="h-4 w-4" /> },
  { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export default function Index() {
  const { toast } = useToast();

  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("home");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [roll, setRoll] = useState("");
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState<"Present" | "Absent">("Present");

  const [searchRoll, setSearchRoll] = useState("");
  const [searchName, setSearchName] = useState("");

  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedClass, setSelectedClass] = useState("BCA");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setRecords(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roll || !name || !className || !section) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      roll, name, className, section, status,
      date: new Date().toISOString().split("T")[0],
    };
    setRecords([newRecord, ...records]);
    setRoll("");
    setName("");
    toast({ title: "Attendance recorded successfully" });
  };

  const calculatePercentage = (studentRoll: string) => {
    const studentRecords = records.filter((r) => r.roll === studentRoll);
    if (!studentRecords.length) return 0;
    const present = studentRecords.filter((r) => r.status === "Present").length;
    return ((present / studentRecords.length) * 100).toFixed(1);
  };

  const filteredRecords = records.filter(
    (r) =>
      r.roll.toLowerCase().includes(searchRoll.toLowerCase()) &&
      r.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const sectionRecords = records.filter((r) => r.section === selectedSection);
  const classRecords = records.filter((r) => r.className === selectedClass);

  const totalPresent = records.filter((r) => r.status === "Present").length;
  const totalAbsent = records.filter((r) => r.status === "Absent").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">College Attendance</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.key}
                variant={page === item.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage(item.key)}
                className="gap-1.5"
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }} className="text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={page === item.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setPage(item.key)}
              className="gap-1 text-xs shrink-0"
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">

        {/* HOME */}
        {page === "home" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground text-sm">Welcome to College Attendance Management 🎓</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Records</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{records.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Present</p>
                  <p className="text-3xl font-bold text-success mt-1">{totalPresent}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Absent</p>
                  <p className="text-3xl font-bold text-destructive mt-1">{totalAbsent}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ATTENDANCE PAGE */}
        {page === "attendance" && (
          <div className="space-y-5">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-6">
                  <Input placeholder="Roll No" value={roll} onChange={(e) => setRoll(e.target.value)} />
                  <Input placeholder="Student Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Select onValueChange={setClassName}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="BTech">BTech</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={setSection}>
                    <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={status} onValueChange={(v) => setStatus(v as "Present" | "Absent")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="gap-1">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" /> Search
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Search by Roll" value={searchRoll} onChange={(e) => setSearchRoll(e.target.value)} />
                <Input placeholder="Search by Name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
              </CardContent>
            </Card>

            <Card className="shadow-card overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Roll</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No records found
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.roll}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.className}</TableCell>
                        <TableCell>{r.section}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "Present" ? "default" : "destructive"} className={r.status === "Present" ? "bg-success hover:bg-success/90" : ""}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{calculatePercentage(r.roll)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION PAGE */}
        {page === "section" && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Section Wise View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                </SelectContent>
              </Select>
              {sectionRecords.length === 0 && (
                <p className="text-muted-foreground text-sm py-4">No records for this section.</p>
              )}
              <div className="space-y-2">
                {sectionRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
                    <div>
                      <span className="font-medium">{r.roll}</span>
                      <span className="text-muted-foreground ml-2">{r.name}</span>
                    </div>
                    <Badge variant="secondary">{calculatePercentage(r.roll)}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CLASS PAGE */}
        {page === "class" && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Class Wise View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BCA">BCA</SelectItem>
                  <SelectItem value="BTech">BTech</SelectItem>
                  <SelectItem value="MCA">MCA</SelectItem>
                </SelectContent>
              </Select>
              {classRecords.length === 0 && (
                <p className="text-muted-foreground text-sm py-4">No records for this class.</p>
              )}
              <div className="space-y-2">
                {classRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
                    <div>
                      <span className="font-medium">{r.roll}</span>
                      <span className="text-muted-foreground ml-2">{r.name}</span>
                    </div>
                    <Badge variant="secondary">{calculatePercentage(r.roll)}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SETTINGS */}
        {page === "settings" && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => {
                  setRecords([]);
                  localStorage.removeItem(STORAGE_KEY);
                  toast({ title: "All data cleared" });
                }}
              >
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
