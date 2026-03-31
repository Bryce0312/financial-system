import { Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="border-slate-200 bg-slate-50/70">
      <CardHeader className="border-b-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-slate-950">{value}</div>
        {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

