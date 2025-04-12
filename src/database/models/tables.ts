interface RemindersTableModel {
    id: number;
    user_id: number;
    reminder_text: string;
    reminder_timestamp: Date;
    reminder_creation_timestamp: Date;
}

interface UsersTableModel {
    user_id: number;
    first_name: string;
    is_premium?: boolean;
    language_code?: string;
    username?: string;
    timezone?: string;
}

export {RemindersTableModel, UsersTableModel};
