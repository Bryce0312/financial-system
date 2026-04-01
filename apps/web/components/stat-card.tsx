import { Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="doodle-stat-card">
      <CardHeader className="doodle-stat-card__header">
        <CardTitle className="doodle-stat-card__label">{label}</CardTitle>
      </CardHeader>
      <CardContent className="doodle-stat-card__body">
        <div className="doodle-stat-card__value">{value}</div>
        {hint ? <p className="doodle-stat-card__hint">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}