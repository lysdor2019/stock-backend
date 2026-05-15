export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const symbols = req.query.symbols;
  if (!symbols) return res.status(400).json({ error: "缺少 symbols 参数" });

  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Origin: "https://finance.yahoo.com",
    Referer: "https://finance.yahoo.com/",
  };

  try {
    const cookieRes = await fetch("https://finance.yahoo.com/", { headers: HEADERS });
    const rawCookies = cookieRes.headers.get("set-cookie") || "";
    const cookieStr = rawCookies.split(",").map(c => c.split(";")[0].trim()).filter(c => c.includes("=")).join("; ");

    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { ...HEADERS, Cookie: cookieStr }
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.includes("{")) throw new Error("无法获取 crumb");

    const symbolList = symbols.split(",").map(s => s.trim());
    const results = await Promise.all(symbolList.map(async (ticker) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d&crumb=${encodeURIComponent(crumb)}`;
        const r = await fetch(url, { headers: { ...HEADERS, Cookie: cookieStr } });
        const json = await r.json();
        const meta = json.chart?.result?.[0]?.meta || {};
        const price = meta.regularMarketPrice || 0;
        const prev = meta.chartPreviousClose || meta.previousClose || price;
        const change = prev ? +((((price - prev) / prev) * 100).toFixed(2)) : 0;
        return { ticker, price, change, priceOnly: true };
      } catch {
        return { ticker, price: 0, change: 0, error: true };
      }
    }));

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json({ updated: new Date().toISOString(), data: results });
  } catch (err) {
    return res.status(500).json({ error: err.message || "获取数据失败" });
  }
}
