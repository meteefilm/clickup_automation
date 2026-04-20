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

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTagNames(task: ClickUpTask): any[] {
    const rawTags = task.tags ?? [];

    const tags = rawTags
        .map((tag: any) => {
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

    return [...new Set(tags)];
}

/**
 * ใช้ full task จาก API อย่างเดียว
 * priority:
 * 1. list.name
 * 2. folder.name
 * 3. space.name
 */
export function resolveProjectName(task: ClickUpTask): string {
    const listName = task.list?.name?.trim();
    const folderName = task.folder?.name?.trim();
    const spaceName = task.space?.name?.trim();

    if (listName) return normalizeToken(listName);
    if (folderName) return normalizeToken(folderName);
    if (spaceName) return normalizeToken(spaceName);

    return "GENERAL";
}

/**
 * กติกา:
 * - ไม่มี tag => null
 * - มี 1 tag => ใช้ tag นั้น
 * - มีหลาย tag => null
 */
export function resolveTagName(task: ClickUpTask): string | null {
    const tags = getTagNames(task);

    if (tags.length !== 1) {
        return null;
    }

    return tags[0];
}

/**
 * strip prefix ที่ระบบเคยตั้งไว้
 * รองรับ:
 * - PROJECT_NAME
 * - PROJECT_TAG_NAME
 */
function stripManagedPrefix(taskName: string, projectName: string, allTags: string[]): string {
    const currentName = taskName.trim();
    if (!currentName) return currentName;

    const escapedProject = escapeRegex(projectName);

    // ตัด PROJECT_<TAG>_
    for (const tag of allTags) {
        const escapedTag = escapeRegex(tag);
        const regex = new RegExp(`^${escapedProject}_${escapedTag}_(.+)$`, "i");
        const match = currentName.match(regex);

        if (match?.[1]) {
            return match[1].trim();
        }
    }

    // ตัด PROJECT_
    const regexProjectOnly = new RegExp(`^${escapedProject}_(.+)$`, "i");
    const matchProjectOnly = currentName.match(regexProjectOnly);

    if (matchProjectOnly?.[1]) {
        return matchProjectOnly[1].trim();
    }

    return currentName;
}

function isAlreadyFormatted(currentName: string, expectedName: string): boolean {
    return currentName.trim().toUpperCase() === expectedName.trim().toUpperCase();
}

export function buildTaskName(task: ClickUpTask): string {
    const projectName = resolveProjectName(task);
    const tagName = resolveTagName(task);
    const allTags = getTagNames(task);
    const currentName = task.name.trim();

    if (!currentName) {
        return tagName ? `${projectName}_${tagName}` : projectName;
    }

    const baseName = stripManagedPrefix(currentName, projectName, allTags);

    const expectedName = tagName
        ? `${projectName}_${tagName}_${baseName}`
        : `${projectName}_${baseName}`;

    if (isAlreadyFormatted(currentName, expectedName)) {
        return currentName;
    }

    return expectedName.trim();
}