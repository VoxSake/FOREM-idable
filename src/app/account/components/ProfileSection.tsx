import { UserRound } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FeedbackState, ProfileFormValues } from "../account.schemas";
import { AccountField } from "./AccountField";
import { AccountSectionHeader } from "./AccountSectionHeader";
import { FeedbackAlert } from "./FeedbackAlert";

type ProfileSectionProps = {
  form: UseFormReturn<ProfileFormValues>;
  canSubmit: boolean;
  isSubmitting: boolean;
  feedback: FeedbackState | null;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
};

export function ProfileSection({
  form,
  canSubmit,
  isSubmitting,
  feedback,
  onSubmit,
}: ProfileSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <AccountSectionHeader
        icon={UserRound}
        title="Profil"
        description="Nom et prénom affichés dans l'application."
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="flex flex-col gap-5">
          <AccountField
            id="account-first-name"
            label="Prénom"
            autoComplete="given-name"
            placeholder="Prénom"
            error={form.formState.errors.firstName?.message}
            {...form.register("firstName")}
          />
          <AccountField
            id="account-last-name"
            label="Nom"
            autoComplete="family-name"
            placeholder="Nom"
            error={form.formState.errors.lastName?.message}
            {...form.register("lastName")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" disabled={!canSubmit || isSubmitting}>
            Enregistrer le profil
          </Button>
          <FeedbackAlert title="Mise à jour du profil" feedback={feedback} />
        </div>
      </form>
    </section>
  );
}
