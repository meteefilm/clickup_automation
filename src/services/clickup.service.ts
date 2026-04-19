import axios from "axios";

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

export async function updateTaskName(taskId: string, newName: string): Promise<void> {
    await clickupApi.put(`/task/${taskId}`, {
        name: newName,
    });
}