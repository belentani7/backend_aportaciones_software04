import { useMemo } from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ComplianceIssue {
  id: number;
  employeeId: number;
  violationType: string;
  severity: "critical" | "warning" | "info";
  description: string;
  detectedAt: Date;
  resolved: boolean;
}

export function ComplianceDashboard({ tenantId }: { tenantId: number }) {
  const { data: violationsData } = trpc.compliance.violations.useQuery({ tenantId });

  const stats = useMemo(() => {
    if (!violationsData) return { critical: 0, warning: 0, info: 0, resolved: 0 };

    return {
      critical: violationsData.filter((v) => v.severity === "critical" && !v.resolved).length,
      warning: violationsData.filter((v) => v.severity === "warning" && !v.resolved).length,
      info: violationsData.filter((v) => v.severity === "info" && !v.resolved).length,
      resolved: violationsData.filter((v) => v.resolved).length,
    };
  }, [violationsData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 border-red-500 text-red-900";
      case "warning":
        return "bg-yellow-100 border-yellow-500 text-yellow-900";
      case "info":
        return "bg-blue-100 border-blue-500 text-blue-900";
      default:
        return "bg-gray-100 border-gray-500 text-gray-900";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Cumplimiento Legal</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600 font-semibold">Críticas</div>
          <div className="text-3xl font-bold text-red-900">{stats.critical}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-semibold">Advertencias</div>
          <div className="text-3xl font-bold text-yellow-900">{stats.warning}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-semibold">Información</div>
          <div className="text-3xl font-bold text-blue-900">{stats.info}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-semibold">Resueltas</div>
          <div className="text-3xl font-bold text-green-900">{stats.resolved}</div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {violationsData?.map((violation) => (
          <div key={violation.id} className={`border-l-4 p-4 rounded ${getSeverityColor(violation.severity)}`}>
            <div className="flex items-start gap-3">
              {getSeverityIcon(violation.severity)}
              <div className="flex-1">
                <div className="font-semibold">{violation.violationType}</div>
                <div className="text-sm mt-1">{violation.description}</div>
                <div className="text-xs mt-2 opacity-75">
                  {new Date(violation.detectedAt).toLocaleString("es-ES")}
                </div>
              </div>
              {violation.resolved && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
