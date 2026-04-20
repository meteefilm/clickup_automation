import { Router, Request, Response } from "express";
import { getTask, updateTaskName } from "../services/clickup.service";
import { buildTaskName } from "../utils/task-name";
import { ClickUpAutomationPayload, ClickUpTask, ClickUpWebhookPayload } from "../types/clickup.type";

const router = Router();

function extractTaskFromBody(
    body: ClickUpWebhookPayload | ClickUpAutomationPayload,
): ClickUpTask | null {
    // กรณี Automation webhook จาก ClickUp UI
    if ("payload" in body && body.payload?.id && body.payload?.name) {
        return {
            id: body.payload.id,
            name: body.payload.name,
            tags: body.payload.tags ?? [],
        };
    }

    return null;
}

function extractTaskId(body: ClickUpAutomationPayload): string | null {
    return body.payload?.id ?? null;
}

router.post("/webhook", async (req: Request, res: Response) => {
    try {
        console.log("Incoming payload:", JSON.stringify(req.body, null, 2));


        const task = extractTaskFromBody(req.body);

        if (!task) {
            return res.status(200).json({
                ok: true,
                skipped: true,
                reason: "Unsupported payload format",
            });
        }

        const taskId = extractTaskId(req.body) || "";

        const fullTask = await getTask(taskId);

        console.log("Resolved task from API:", JSON.stringify(fullTask, null, 2));


        const newName = buildTaskName(fullTask);

        if (newName.trim().toUpperCase() === task.name.trim().toUpperCase()) {
            return res.status(200).json({
                ok: true,
                skipped: true,
                reason: "Task name already formatted",
                taskId: task.id,
                name: task.name,
            });
        }

        await updateTaskName(task.id, newName);

        return res.status(200).json({
            ok: true,
            taskId: task.id,
            oldName: task.name,
            newName,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";

        console.error("ClickUp webhook error:", message);

        return res.status(500).json({
            ok: false,
            error: message,
        });
    }
});

export default router;