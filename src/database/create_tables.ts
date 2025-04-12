import {DatabaseClientConfig} from "./models/config";
import {Client} from "pg";
import {readFile} from "node:fs/promises";


export async function createTables(fileSQL: string, config?: DatabaseClientConfig) {
    const client = new Client(config);
    await client.connect();
    const content = await readFile(fileSQL);
    await client.query(content.toString());
    await client.end();
}
