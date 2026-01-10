import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
    try {
        const scriptPath = path.join(process.cwd(), "scripts/analytics/generate_report.py");
        const venvPython = path.join(process.cwd(), "venv/bin/python3");

        // Execute the python script
        const { stdout, stderr } = await execAsync(`${venvPython} ${scriptPath}`);

        if (stderr) {
            console.error("Python Error:", stderr);
        }

        console.log("Python Output:", stdout);

        return NextResponse.json({
            success: true,
            imagePath: "/reports/analytics_dashboard.png",
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Failed to generate report:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
