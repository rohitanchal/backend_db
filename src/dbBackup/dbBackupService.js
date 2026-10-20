import { crc32 } from "node:zlib";
import mongodb from "mongodb";
import { EJSON } from "bson";

const { MongoClient } = mongodb;

function u16(value) {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16LE(value);
    return buffer;
}

function u32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value >>> 0);
    return buffer;
}

function zipStored(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;

    for (const file of files) {
        const name = Buffer.from(file.name);
        const crc = crc32(file.data) >>> 0;
        const local = Buffer.concat([
            u32(0x04034b50),
            u16(20),
            u16(0),
            u16(0),
            u16(0),
            u16(0),
            u32(crc),
            u32(file.data.length),
            u32(file.data.length),
            u16(name.length),
            u16(0),
            name,
            file.data,
        ]);
        const central = Buffer.concat([
            u32(0x02014b50),
            u16(20),
            u16(20),
            u16(0),
            u16(0),
            u16(0),
            u16(0),
            u32(crc),
            u32(file.data.length),
            u32(file.data.length),
            u16(name.length),
            u16(0),
            u16(0),
            u16(0),
            u16(0),
            u32(0),
            u32(offset),
            name,
        ]);
        offset += local.length;
        locals.push(local);
        centrals.push(central);
    }

    const centralDir = Buffer.concat(centrals);
    const end = Buffer.concat([
        u32(0x06054b50),
        u16(0),
        u16(0),
        u16(files.length),
        u16(files.length),
        u32(centralDir.length),
        u32(offset),
        u16(0),
    ]);
    return Buffer.concat([...locals, centralDir, end]);
}

function backupFilename(date) {
    const stamp = date.toISOString().replace(/[:.]/g, "-");
    return `mongovault-backup-${stamp}.zip`;
}

function collectionFileName(name) {
    return `${name.replace(/[\\/]/g, "_")}.json`;
}

function documentsJson(docs) {
    if (!docs.length) return "[]\n";
    const lines = docs.map((doc) => `  ${EJSON.stringify(doc)}`);
    return `[\n${lines.join(",\n")}\n]\n`;
}

export function collectionNames(listed) {
    return listed
        .map((item) => item?.name)
        .filter((name) => typeof name === "string" && name && !name.startsWith("system."))
        .sort();
}

export async function streamDatabaseBackup(res, uri) {
    if (typeof uri !== "string" || !uri.trim()) {
        const error = new Error("Enter a MongoDB connection URI.");
        error.statusCode = 400;
        throw error;
    }

    const client = new MongoClient(uri.trim());
    try {
        await client.connect();
        const db = client.db();
        const listed = await db.listCollections({}, { nameOnly: true }).toArray();
        const names = collectionNames(listed);
        const files = [];

        for (const name of names) {
            const docs = await db.collection(name).find({}).toArray();
            files.push({
                name: collectionFileName(name),
                data: Buffer.from(documentsJson(docs)),
            });
        }

        const zip = zipStored(files);
        const filename = backupFilename(new Date());
        res.status(200);
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", zip.length);
        res.setHeader("Cache-Control", "no-store");
        res.end(zip);
    } finally {
        await client.close().catch(() => {});
    }
}
