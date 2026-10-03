import { useState } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  contractType: "full-time" | "part-time";
  birthDate: Date;
  skills: string[];
  availability: Record<string, boolean>;
}

export function EmployeePortal({ tenantId }: { tenantId: number }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: employees } = trpc.employees.list.useQuery({ tenantId });
  const createMutation = trpc.employees.create.useMutation();
  const updateMutation = trpc.employees.update.useMutation();
  const deleteMutation = trpc.employees.delete.useMutation();

  const filteredEmployees = employees?.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar empleado?")) {
      await deleteMutation.mutateAsync({ tenantId, employeeId: id });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Empleados</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Empleado
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Teléfono</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Contrato</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">{emp.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.email}</td>
                <td className="px-6 py-4 text-sm">{emp.phone}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${emp.contractType === "full-time" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {emp.contractType === "full-time" ? "Jornada Completa" : "Parcial"}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => setEditingId(emp.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay empleados que coincidan con la búsqueda
        </div>
      )}
    </div>
  );
}
