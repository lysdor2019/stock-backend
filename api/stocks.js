export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const symbols = req.query.symbols;
  if (!symbols) return res.status(400).json({ error: "缺少 symbols 参数" });

  try {
    const url = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(symbols)}&lang=en-US&region=US`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com/",
        "Origin": "https://finance.yahoo.com",
      },
    });

    if (!r.ok) throw new Error(`Yahoo ${r.status}`);

    const json = await r.json();
    const quotes = json.quoteResponse?.result || [];
    if (quotes.length === 0) throw new Error("Yahoo 返回空数据");

    const data = quotes.map((q) => {
      const fcf = q.freeCashflow || 0;
      const mktCap = q.marketCap || 1;
      return {
        ticker: q.symbol,
        price: +(q.regularMarketPrice?.toFixed(2) || 0),
        change: +(q.regularMarketChangePercent?.toFixed(2) || 0),
        pe: +(q.trailingPE?.toFixed(1) || 0),
        pb: +(q.priceToBook?.toFixed(2) || 0),
        roe: +(((q.returnOnEquity || 0) * 100).toFixed(1)),
        revenueGrowth: +(((q.revenueGrowth || 0) * 100).toFixed(1)),
        debtEquity: +(q.debtToEquity?.toFixed(1) || 0),
        grossMargin: +(((q.grossMargins || 0) * 100).toFixed(1)),
        fcfYield: +((fcf / mktCap) * 100).toFixed(2),
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json({ updated: new Date().toISOString(), data });

  } catch (err) {
    return res.status(500).json({ error: err.message || "获取失败" });
  }
}
