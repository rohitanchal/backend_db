import express from "express";
import dbBackupController from "./dbBackupController.js";

const router = express.Router();

router.post("/", dbBackupController.downloadDatabaseBackup);

export default router;
