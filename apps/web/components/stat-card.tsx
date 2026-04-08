import { Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="doodle-stat-card rounded-[30px] border-[#ddd6e8] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(255,255,255,0.98))] shadow-[0_18px_38px_rgba(91,83,111,0.08)]">
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
