import { Router, Request, Response } from "express";
import { getTask, updateTaskDueDate, updateTaskName } from "../services/clickup.service";
import { buildTaskName } from "../utils/task-name";
import { ClickUpAutomationPayload, ClickUpTask, ClickUpWebhookPayload } from "../types/clickup.type";
import { calculateDueDateByPriority, shouldUpdateDueDate } from "../utils/task-due-date";

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

        const result: any = {
            ok: true,
            taskId: fullTask.id,
        };

        if (newName.trim().toUpperCase() !== fullTask.name.trim().toUpperCase()) {
            await updateTaskName(fullTask.id, newName);

            result.oldName = fullTask.name;
            result.newName = newName;
        } else {
            result.nameSkipped = true;
            result.nameReason = "Task name already formatted";
        }

        if (shouldUpdateDueDate(fullTask)) {
            const dueDate = calculateDueDateByPriority(fullTask);

            if (dueDate) {
                await updateTaskDueDate(fullTask.id, dueDate);

                result.dueDateUpdated = true;
                result.dueDate = dueDate;
            }
        } else {
            result.dueDateSkipped = true;
            result.dueDateReason = fullTask.due_date
                ? "Task already has due date"
                : "No supported priority";
        }

        return res.status(200).json(result);
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