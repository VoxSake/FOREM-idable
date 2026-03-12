import { format } from "date-fns";
import { JobApplication } from "@/types/application";

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function exportInterviewsToICS(applications: JobApplication[]) {
  const interviews = applications.filter((entry) => entry.interviewAt);
  if (!interviews.length) return;

  const events = interviews
    .map((entry) => {
      const startsAt = toIcsDateTime(entry.interviewAt!);
      if (!startsAt) return null;

      const end = new Date(entry.interviewAt!);
      end.setHours(end.getHours() + 1);
      const endsAt = toIcsDateTime(end.toISOString());
      const title = escapeIcsText(
        `Entretien - ${entry.job.company || "Entreprise"} - ${entry.job.title}`
      );
      const description = escapeIcsText(
        [entry.job.location, entry.interviewDetails || "", entry.job.url !== "#" ? entry.job.url : ""]
          .filter(Boolean)
          .join("\n")
      );
      const location = escapeIcsText(entry.job.location || "");
      const uid = `${entry.job.id}-interview@forem-idable`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${toIcsDateTime(new Date().toISOString())}`,
        `DTSTART:${startsAt}`,
        endsAt ? `DTEND:${endsAt}` : null,
        `SUMMARY:${title}`,
        description ? `DESCRIPTION:${description}` : null,
        location ? `LOCATION:${location}` : null,
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .filter(Boolean);

  if (!events.length) return;

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FOREM-idable//Interviews//FR",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `entretiens-foremidable-${format(new Date(), "yyyy-MM-dd")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
