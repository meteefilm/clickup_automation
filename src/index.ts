import "dotenv/config";
import express, { Request, Response } from "express";
import clickupRoute from "./routes/clickup.route";

const app = express();
const PORT = Number(process.env.PORT || 8319);

app.use(express.json());

app.use("/clickup", clickupRoute);

app.use((_req: Request, res: Response) => {
    res.status(404).json({
        ok: false,
        message: "Route not found",
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});