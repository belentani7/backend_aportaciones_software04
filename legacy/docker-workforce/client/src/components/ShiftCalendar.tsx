import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Shift {
  id: number;
  employeeId: number;
  startTime: Date;
  endTime: Date;
  shiftType: "morning" | "afternoon" | "night";
  status: "scheduled" | "published" | "completed";
}

interface Employee {
  id: number;
  name: string;
  email: string;
}

export function ShiftCalendar({ tenantId }: { tenantId: number }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);

  const { data: shiftsData } = trpc.shifts.list.useQuery({ tenantId });
  const { data: employeesData } = trpc.employees.list.useQuery({ tenantId });

  useEffect(() => {
    if (shiftsData) setShifts(shiftsData);
  }, [shiftsData]);

  useEffect(() => {
    if (employeesData) setEmployees(employeesData);
  }, [employeesData]);

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const shiftTypes = ["morning", "afternoon", "night"];
  const shiftHours: Record<string, { start: number; end: number }> = {
    morning: { start: 6, end: 14 },
    afternoon: { start: 14, end: 22 },
    night: { start: 22, end: 6 },
  };

  const getShiftsForCell = (day: Date, shiftType: string): Shift[] => {
    return shifts.filter((s) => {
      const shiftDate = new Date(s.startTime);
      return shiftDate.toDateString() === day.toDateString() && s.shiftType === shiftType;
    });
  };

  const handleDragStart = (shift: Shift) => {
    setDraggedShift(shift);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: Date, shiftType: string) => {
    if (!draggedShift) return;

    const newStartTime = new Date(day);
    const { start } = shiftHours[shiftType];
    newStartTime.setHours(start, 0, 0);

    const newEndTime = new Date(newStartTime);
    newEndTime.setHours(start + 8);

    setShifts((prev) =>
      prev.map((s) =>
        s.id === draggedShift.id
          ? { ...s, startTime: newStartTime, endTime: newEndTime, shiftType: shiftType as any }
          : s
      )
    );

    setDraggedShift(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Calendario de Turnos</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))} className="p-2 hover:bg-gray-100 rounded">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Hoy
          </button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))} className="p-2 hover:bg-gray-100 rounded">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left font-semibold">Turno</th>
              {days.map((day) => (
                <th key={day.toISOString()} className="border p-2 text-center font-semibold">
                  <div>{day.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                  <div className="text-sm text-gray-600">{day.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shiftTypes.map((shiftType) => (
              <tr key={shiftType}>
                <td className="border p-2 font-semibold bg-gray-50 capitalize">{shiftType}</td>
                {days.map((day) => (
                  <td
                    key={`${day.toISOString()}-${shiftType}`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(day, shiftType)}
                    className="border p-2 min-h-24 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="space-y-1">
                      {getShiftsForCell(day, shiftType).map((shift) => (
                        <div
                          key={shift.id}
                          draggable
                          onDragStart={() => handleDragStart(shift)}
                          className="bg-blue-500 text-white text-xs p-2 rounded cursor-move hover:bg-blue-600"
                        >
                          {employees.find((e) => e.id === shift.employeeId)?.name || `Emp ${shift.employeeId}`}
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-2">
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nuevo Turno
        </button>
      </div>
    </div>
  );
}
