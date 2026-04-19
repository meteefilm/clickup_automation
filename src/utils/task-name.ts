import { ClickUpCustomField, ClickUpTask } from "../types/clickup.type";

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

function getCustomFieldValue(
    fields: ClickUpCustomField[] | undefined,
    fieldName: string,
): string | null {
    if (!fields?.length) return null;

    const field = fields.find(
        (item) => item.name.toLowerCase() === fieldName.toLowerCase(),
    );

    if (!field || field.value == null) return null;

    if (typeof field.value === "string") return field.value;
    if (typeof field.value === "number" || typeof field.value === "boolean") {
        return String(field.value);
    }

    return null;
}

export function resolveProjectName(task: ClickUpTask): string {
    const fromCustomField = getCustomFieldValue(task.custom_fields, "project_code");
    if (fromCustomField) {
        return normalizeToken(fromCustomField);
    }

    const listName = task.list?.name ?? "";
    const folderName = task.folder?.name ?? "";
    const spaceName = task.space?.name ?? "";
    const combined = `${spaceName} ${folderName} ${listName}`.toUpperCase();

    if (combined.includes("PORTAL")) return "PORTAL";
    if (combined.includes("DTP")) return "DTP";
    if (combined.includes("NSW")) return "NSW";

    return "GENERAL";
}

/**
 * กติกาใหม่:
 * - ไม่มี tag => null
 * - มีหลาย tag => null (ไม่เอา tag มาแสดง)
 * - มี 1 tag => ใช้ tag นั้น
 */
export function resolveTagName(task: ClickUpTask): string | null {
    const tags = (task.tags ?? [])
        .map((tag) => tag.name?.trim())
        .filter((name): name is string => Boolean(name));

    if (tags.length !== 1) {
        return null;
    }

    return normalizeToken(tags[0]);
}

/**
 * ตัด prefix เดิมที่อาจเคยถูกระบบเติมไว้
 * รองรับทั้ง:
 * - PROJECT_NAME
 * - PROJECT_TAG_NAME
 *
 * เพื่อให้เวลาเติม tag ทีหลัง จะได้ re-build ใหม่สะอาด ๆ
 */
function stripManagedPrefix(
    taskName: string,
    projectName: string,
    knownTags: string[],
): string {
    const cleanName = taskName.trim();
    if (!cleanName) return cleanName;

    const escapedProject = escapeRegex(projectName);

    // ตัดแบบ PROJECT_TAG_
    for (const tag of knownTags) {
        const escapedTag = escapeRegex(tag);
        const regex = new RegExp(`^${escapedProject}_${escapedTag}_(.+)$`, "i");
        const match = cleanName.match(regex);
        if (match?.[1]) {
            return match[1].trim();
        }
    }

    // ตัดแบบ PROJECT_
    const regexProjectOnly = new RegExp(`^${escapedProject}_(.+)$`, "i");
    const matchProjectOnly = cleanName.match(regexProjectOnly);
    if (matchProjectOnly?.[1]) {
        return matchProjectOnly[1].trim();
    }

    return cleanName;
}

/**
 * รวบรวม tag ทั้งหมดไว้ใช้ strip prefix เก่า
 * ถึงแม้หลาย tag จะไม่เอามาแสดง แต่ยังใช้ตรวจชื่อเก่าได้
 */
function getAllNormalizedTags(task: ClickUpTask): string[] {
    const unique = new Set<string>();

    for (const tag of task.tags ?? []) {
        const name = tag.name?.trim();
        if (!name) continue;
        unique.add(normalizeToken(name));
    }

    return [...unique];
}

/**
 * ถ้าชื่อปัจจุบันอยู่ในรูปแบบที่ถูกต้องแล้ว ให้ข้ามได้
 */
function isAlreadyFormatted(
    currentName: string,
    expectedName: string,
): boolean {
    return currentName.trim().toUpperCase() === expectedName.trim().toUpperCase();
}

export function buildTaskName(task: ClickUpTask): string {
    const projectName = resolveProjectName(task);
    const tagName = resolveTagName(task); // null ถ้าไม่มีหรือมีหลาย tag
    const allTags = getAllNormalizedTags(task);
    const currentName = task.name.trim();

    if (!currentName) {
        return tagName ? `${projectName}_${tagName}` : projectName;
    }

    // ตัด prefix เดิมที่ระบบเคยใส่ไว้ก่อน
    const baseName = stripManagedPrefix(currentName, projectName, allTags);

    // ประกอบชื่อใหม่ตามกติกา
    const expectedName = tagName
        ? `${projectName}_${tagName}_${baseName}`
        : `${projectName}_${baseName}`;

    // ถ้าปัจจุบันถูกต้องอยู่แล้ว ไม่ต้องแก้
    if (isAlreadyFormatted(currentName, expectedName)) {
        return currentName;
    }

    return expectedName;
}