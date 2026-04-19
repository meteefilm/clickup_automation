export interface ClickUpTag {
    name: string;
}

export interface ClickUpListRef {
    id?: string;
    name?: string;
}

export interface ClickUpFolderRef {
    id?: string;
    name?: string;
}

export interface ClickUpSpaceRef {
    id?: string;
    name?: string;
}

export interface ClickUpCustomField {
    id: string;
    name: string;
    type: string;
    value?: unknown;
}

export interface ClickUpTask {
    id: string;
    name: string;
    tags?: ClickUpTag[];
    list?: ClickUpListRef;
    folder?: ClickUpFolderRef;
    space?: ClickUpSpaceRef;
    custom_fields?: ClickUpCustomField[];
}

export interface ClickUpWebhookPayload {
    event?: string;
    task_id?: string;
    task?: {
        id?: string;
    };
    history_items?: Array<{
        task_id?: string;
    }>;
}