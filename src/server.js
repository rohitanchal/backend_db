import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import dbBackupRoutes from "./dbBackup/dbBackupRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const origin = process.env.FRONTEND_ORIGIN || "http://localhost:4200";

app.disable("x-powered-by");
app.use(cors({
    origin,
    methods: ["GET", "POST"],
    exposedHeaders: ["Content-Disposition"],
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "MongoVault API is running" });
});

app.use("/api/backup/download", dbBackupRoutes);

app.listen(port, () => {
    console.log(`MongoVault API listening on port ${port}`);
});
