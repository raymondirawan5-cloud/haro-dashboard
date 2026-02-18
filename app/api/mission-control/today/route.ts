import { NextResponse } from "next/server";
import { TODAY_PATH, readOrBootstrapToday, updateToday } from "@/lib/mission-control-today";

export async function GET() {
  try {
    const data = readOrBootstrapToday();
    return NextResponse.json({ todayPath: TODAY_PATH, ...data });
  } catch {
    return NextResponse.json({ error: "failed to read mission control today" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const data = updateToday({
      updatedAt: null,
      rayNext90: {
        task: typeof body?.rayNext90?.task === "string" ? body.rayNext90.task : "",
        notes: typeof body?.rayNext90?.notes === "string" ? body.rayNext90.notes : "",
      },
      haroNext90: {
        task: typeof body?.haroNext90?.task === "string" ? body.haroNext90.task : "",
        notes: typeof body?.haroNext90?.notes === "string" ? body.haroNext90.notes : "",
      },
      blockers: Array.isArray(body?.blockers)
        ? body.blockers.map((item: unknown) => {
            const blocker = item as { id?: unknown; text?: unknown; owner?: unknown; due?: unknown };
            return {
              id: typeof blocker?.id === "string" ? blocker.id : "",
              text: typeof blocker?.text === "string" ? blocker.text : "",
              owner:
                blocker?.owner === "ray" || blocker?.owner === "haro" || blocker?.owner === "shared"
                  ? blocker.owner
                  : "shared",
              due: typeof blocker?.due === "string" ? blocker.due : "",
            };
          })
        : [],
    });

    return NextResponse.json({ todayPath: TODAY_PATH, ...data });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
