import { ClickUpTask } from "../types/clickup.type";

function normalizeToken(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
}

function getTagNames(task: ClickUpTask): string[] {
    const rawTags = task.tags ?? [];

    return rawTags
        .map((tag:any) => {
            if (typeof tag === "string") {
                return tag.trim();
            }
            if (tag && typeof tag === "object" && "name" in tag) {
                return String(tag.name ?? "").trim();
            }
            return "";
        })
        .filter(Boolean)
        .map(normalizeToken);
}

export function resolveProjectName(task: ClickUpTask): string {
    const taskName = task.name.toUpperCase();

    if (taskName.includes("PORTAL")) return "PORTAL";
    if (taskName.includes("DTP")) return "DTP";
    if (taskName.includes("NSW")) return "NSW";

    return taskName;
}

export function resolveTagName(task: ClickUpTask): string | null {
    const tags = getTagNames(task);

    if (tags.length !== 1) {
        return null;
    }

    return tags[0];
}

function stripManagedPrefix(taskName: string, projectName: string, tagName: string | null): string {
    const upper = taskName.trim().toUpperCase();

    if (tagName) {
        const prefixWithTag = `${projectName}_${tagName}_`;
        if (upper.startsWith(prefixWithTag)) {
            return taskName.trim().slice(prefixWithTag.length);
        }
    }

    const prefixProjectOnly = `${projectName}_`;
    if (upper.startsWith(prefixProjectOnly)) {
        return taskName.trim().slice(prefixProjectOnly.length);
    }

    return taskName.trim();
}

export function buildTaskName(task: ClickUpTask): string {
    const projectName = resolveProjectName(task);
    const tagName = resolveTagName(task);
    const currentName = task.name.trim();

    const baseName = stripManagedPrefix(currentName, projectName, tagName);

    const newName = tagName
        ? `${projectName}_${tagName}_${baseName}`
        : `${projectName}_${baseName}`;

    return newName.trim();
}