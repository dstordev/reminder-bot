import {configDotenv} from "dotenv";

export interface ConfigModel {
    BOT_TOKEN: string;
    ADMIN_ID: number;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_HOST: string;
    POSTGRES_PORT: string;
    POSTGRES_DATABASE: string;
}

export function getConfig(): ConfigModel | undefined {
    configDotenv();
    return {
        BOT_TOKEN: process.env.BOT_TOKEN!,
        ADMIN_ID: parseInt(process.env.ADMIN_ID!),
        POSTGRES_USER: process.env.POSTGRES_USER!,
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD!,
        POSTGRES_HOST: process.env.POSTGRES_HOST!,
        POSTGRES_PORT: process.env.string!,
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE!,
    };
}
