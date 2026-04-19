import axios from "axios";
import { ClickUpTask } from "../types/clickup.type";

const CLICKUP_TOKEN = process.env.CLICKUP_TOKEN;

if (!CLICKUP_TOKEN) {
    throw new Error("Missing CLICKUP_TOKEN in environment");
}

const clickupApi = axios.create({
    baseURL: "https://api.clickup.com/api/v2",
    timeout: 15000,
    headers: {
        Authorization: CLICKUP_TOKEN,
        "Content-Type": "application/json",
    },
});

export async function getTask(taskId: string): Promise<ClickUpTask> {
    const response = await clickupApi.get<ClickUpTask>(`/task/${taskId}`);
    return response.data;
}

export async function updateTaskName(taskId: string, newName: string): Promise<void> {
    await clickupApi.put(`/task/${taskId}`, {
        name: newName,
    });
}