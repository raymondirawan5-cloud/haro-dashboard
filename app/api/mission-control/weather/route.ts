import { NextRequest, NextResponse } from "next/server";

function weatherCodeToText(code: number) {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Partly Cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unavailable";
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") || "Jakarta";

  try {
    // Jakarta fallback coordinates; keep simple/stable for dashboard HUD.
    const lat = -6.2;
    const lon = 106.816666;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("weather upstream failed");

    const json = await res.json();
    const current = json?.current || {};
    const temperature = typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : null;
    const condition = weatherCodeToText(Number(current.weather_code));

    return NextResponse.json({ city, temperature, condition });
  } catch {
    return NextResponse.json({ city, temperature: null, condition: "Unavailable" }, { status: 200 });
  }
}
