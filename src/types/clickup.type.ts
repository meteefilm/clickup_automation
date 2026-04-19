export interface ClickUpTag {
    name: string;
}

export interface ClickUpTask {
    id: string;
    name: string;
    tags?: Array<ClickUpTag | string> | any;
    list?: {
        id?: string;
        name?: string;
    };
    folder?: {
        id?: string;
        name?: string;
    };
    space?: {
        id?: string;
        name?: string;
    };
    custom_fields?: Array<{
        id: string;
        name: string;
        type: string;
        value?: unknown;
    }>;
}

export interface ClickUpAutomationPayload {
    auto_id?: string;
    trigger_id?: string;
    date?: string;
    payload?: {
        id?: string;
        name?: string;
        tags?: Array<string | { name?: string }>;
        lists?: Array<{
            list_id?: string;
            type?: string;
        }>;
        fields?: Array<{
            id: string;
            name: string;
            type: string;
            value?: unknown;
        }>;
    };
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