import { ShieldCheck } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FeedbackState, PasswordFormValues } from "../account.schemas";
import { AccountField } from "./AccountField";
import { AccountSectionHeader } from "./AccountSectionHeader";
import { FeedbackAlert } from "./FeedbackAlert";

type PasswordSectionProps = {
  form: UseFormReturn<PasswordFormValues>;
  canSubmit: boolean;
  isSubmitting: boolean;
  feedback: FeedbackState | null;
  onSubmit: (values: PasswordFormValues) => Promise<void>;
};

export function PasswordSection({
  form,
  canSubmit,
  isSubmitting,
  feedback,
  onSubmit,
}: PasswordSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <AccountSectionHeader
        icon={ShieldCheck}
        title="Sécurité"
        description="Changez le mot de passe de votre compte."
      />
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <FieldGroup className="gap-4">
          <AccountField
            id="account-password"
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            description="Au moins 8 caractères."
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />
          <AccountField
            id="account-password-confirm"
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="Ressaisir le mot de passe"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register("confirmPassword")}
          />
        </FieldGroup>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" disabled={!canSubmit || isSubmitting}>
            Changer le mot de passe
          </Button>
          <FeedbackAlert title="Mot de passe" feedback={feedback} />
        </div>
      </form>
    </section>
  );
}
