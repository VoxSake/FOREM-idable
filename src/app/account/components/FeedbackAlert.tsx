import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeedbackState } from "../account.schemas";

type FeedbackAlertProps = {
  title: string;
  feedback: FeedbackState | null;
};

export function FeedbackAlert({ title, feedback }: FeedbackAlertProps) {
  if (!feedback) {
    return null;
  }

  return (
    <Alert
      variant={feedback.type === "error" ? "destructive" : "default"}
      className="min-w-0 flex-1"
    >
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{feedback.message}</AlertDescription>
    </Alert>
  );
}
