import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import {
  buildOverpassQuery,
  parseOverpassElements,
  queryOverpass,
  SCOUT_CATEGORIES,
} from "@/lib/server/scoutOverpass";
import { scrapeEmails } from "@/lib/server/scoutScraper";

const encoder = new TextEncoder();

function sendEvent(controller: ReadableStreamDefaultController, event: unknown) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId: rawJobId } = await context.params;
  const jobId = Number(rawJobId);
  if (!jobId) {
    return new Response("Invalid job ID", { status: 400 });
  }

  // Verify ownership
  const check = await db.query<{ user_id: number; status: string }>(
    `SELECT user_id, status FROM scout_jobs WHERE id = $1`,
    [jobId]
  );
  if (check.rows.length === 0) {
    return new Response("Job not found", { status: 404 });
  }
  if (check.rows[0].user_id !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // If already completed or failed, just send final state
        if (check.rows[0].status === "completed" || check.rows[0].status === "failed") {
          const result = await db.query<{ result_count: number }>(
            `SELECT result_count FROM scout_jobs WHERE id = $1`,
            [jobId]
          );
          sendEvent(controller, {
            type: check.rows[0].status === "completed" ? "completed" : "error",
            resultCount: result.rows[0]?.result_count ?? 0,
            message: check.rows[0].status === "failed" ? "Échec précédent." : undefined,
          });
          controller.close();
          return;
        }

        // Mark as running
        await db.query(`UPDATE scout_jobs SET status = 'running' WHERE id = $1`, [jobId]);

        const jobResult = await db.query<{
          lat: string;
          lon: string;
          radius: number;
          categories: string;
          scrape_emails: boolean;
        }>(
          `SELECT lat, lon, radius, categories, scrape_emails FROM scout_jobs WHERE id = $1`,
          [jobId]
        );

        const job = jobResult.rows[0];
        const categories: string[] = JSON.parse(job.categories);
        const batchSize = 3;
        const batches: string[][] = [];
        for (let i = 0; i < categories.length; i += batchSize) {
          batches.push(categories.slice(i, i + batchSize));
        }

        // Update total steps
        const totalSteps = batches.length;
        await db.query(`UPDATE scout_jobs SET total_steps = $1 WHERE id = $2`, [totalSteps, jobId]);

        let insertedCount = 0;
        const seenOsmIds = new Set<number>();

        for (let i = 0; i < batches.length; i++) {
          const query = buildOverpassQuery(
            batches[i],
            job.radius,
            Number(job.lat),
            Number(job.lon)
          );

          const elements = await queryOverpass(query, request.signal);
          const parsed = parseOverpassElements(elements);

          // Insert results, skipping duplicates
          for (const item of parsed) {
            if (item.osmId && seenOsmIds.has(item.osmId)) continue;
            if (item.osmId) seenOsmIds.add(item.osmId);

            await db.query(
              `INSERT INTO scout_results (job_id, name, type, email, website, phone, address, lat, lon, town, email_source, osm_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT DO NOTHING`,
              [
                jobId,
                item.name,
                item.type,
                item.email || null,
                item.website || null,
                item.phone || null,
                item.address || null,
                item.lat !== null ? String(item.lat) : null,
                item.lon !== null ? String(item.lon) : null,
                item.town || null,
                item.email ? "osm" : "",
                item.osmId || null,
              ]
            );
            insertedCount++;
          }

          await db.query(
            `UPDATE scout_jobs SET completed_steps = $1, result_count = $2 WHERE id = $3`,
            [i + 1, insertedCount, jobId]
          );

          sendEvent(controller, {
            type: "progress",
            step: i + 1,
            total: totalSteps,
            found: insertedCount,
            message: `Batch ${i + 1}/${totalSteps} — ${parsed.length} résultats`,
          });

          if (request.signal.aborted) {
            throw new Error("Aborted");
          }

          if (i < batches.length - 1) {
            await sleep(3000);
          }
        }

        // Optional email scraping
        if (job.scrape_emails) {
          const toScrape = await db.query<{
            id: number;
            website: string;
          }>(
            `SELECT id, website FROM scout_results WHERE job_id = $1 AND (email IS NULL OR email = '') AND website IS NOT NULL AND website != ''`,
            [jobId]
          );

          const totalScrapeSteps = totalSteps + toScrape.rows.length;
          await db.query(`UPDATE scout_jobs SET total_steps = $1 WHERE id = $2`, [totalScrapeSteps, jobId]);

          for (let i = 0; i < toScrape.rows.length; i++) {
            const { id: resultId, website } = toScrape.rows[i];
            const emails = await scrapeEmails(website);

            if (emails.length > 0) {
              await db.query(
                `UPDATE scout_results SET email = $1, email_source = 'scrape', all_emails = $2 WHERE id = $3`,
                [emails[0], JSON.stringify(emails), resultId]
              );
            }

            sendEvent(controller, {
              type: "progress",
              step: totalSteps + i + 1,
              total: totalScrapeSteps,
              found: insertedCount,
              message: `Scraping ${i + 1}/${toScrape.rows.length}`,
            });

            if (request.signal.aborted) {
              throw new Error("Aborted");
            }

            if (i < toScrape.rows.length - 1) {
              await sleep(400);
            }
          }
        }

        await db.query(
          `UPDATE scout_jobs SET status = 'completed', result_count = $1, completed_at = NOW() WHERE id = $2`,
          [insertedCount, jobId]
        );

        sendEvent(controller, {
          type: "completed",
          resultCount: insertedCount,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        await db.query(
          `UPDATE scout_jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
          [message, jobId]
        );
        sendEvent(controller, { type: "error", message });
        logServerEvent({
          category: "scout",
          action: "stream_failed",
          level: "error",
          meta: { jobId, error: message },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
