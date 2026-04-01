import { ExpenseForm } from "@/components/expense-form";
import { AppShell } from "@/components/app-shell";

export default function NewExpensePage() {
  return (
    <AppShell>
      <div className="expense-art-stage">
        <ExpenseForm />
      </div>
    </AppShell>
  );
}
