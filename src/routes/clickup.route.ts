import { Router, Request, Response } from "express";
import { getTask, updateTaskName } from "../services/clickup.service";
import { buildTaskName } from "../utils/task-name";
import { ClickUpWebhookPayload } from "../types/clickup.type";

const router = Router();

function extractTaskId(payload: ClickUpWebhookPayload): string | null {
    return (
        payload.task_id ||
        payload.task?.id ||
        payload.history_items?.[0]?.task_id ||
        null
    );
}

function shouldProcessEvent(event?: string): boolean {
    return event === "taskCreated" || event === "taskUpdated";
}

router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, route: "clickup" });
});

router.post(
    "/webhook",
    async (req: Request<unknown, unknown, ClickUpWebhookPayload>, res: Response) => {
        try {
            const payload = req.body;
            const event = payload.event;
            const taskId = extractTaskId(payload);

            console.log("Incoming event:", event);
            console.log("Incoming payload:", JSON.stringify(payload, null, 2));

            if (!taskId) {
                return res.status(200).json({
                    ok: true,
                    skipped: true,
                    reason: "No task id found in payload",
                });
            }

            if (!shouldProcessEvent(event)) {
                return res.status(200).json({
                    ok: true,
                    skipped: true,
                    reason: `Ignored event: ${event ?? "unknown"}`,
                });
            }

            const task = await getTask(taskId);
            const newName = buildTaskName(task);

            if (newName === task.name) {
                return res.status(200).json({
                    ok: true,
                    skipped: true,
                    reason: "Task name already formatted",
                    taskId,
                    name: task.name,
                });
            }

            await updateTaskName(taskId, newName);

            return res.status(200).json({
                ok: true,
                taskId,
                oldName: task.name,
                newName,
            });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Unknown error";

            console.error("ClickUp webhook error:", message);

            return res.status(500).json({
                ok: false,
                error: message,
            });
        }
    },
);

export default router;