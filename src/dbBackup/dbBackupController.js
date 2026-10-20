import { streamDatabaseBackup } from "./dbBackupService.js";

export async function downloadDatabaseBackup(req, res) {
    try {
        await streamDatabaseBackup(res, req.body?.uri);
    } catch (err) {
        if (res.headersSent) {
            res.destroy();
            return;
        }
        const statusCode = err.statusCode === 400 ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: statusCode === 400
                ? "Enter a MongoDB connection URI."
                : "Database backup could not be created.",
        });
    }
}

export default { downloadDatabaseBackup };
