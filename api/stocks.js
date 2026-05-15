export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const symbols = req.query.symbols;
  if (!symbols) {
    return res.status(400).json({ error: "缺少 symbols 参数" });
  }

  try {
    const fields = [
      "regularMarketPrice",
      "regularMarketChangePercent",
      "trailingPE",
      "priceToBook",
      "returnOnEquity",
      "revenueGrowth",
      "debtToEquity",
      "grossMargins",
      "freeCashflow",
      "marketCap",
    ].join(",");

    const yahooUrl =
      `https://query1.finance.yahoo.com/v7/finance/quote` +
      `?symbols=${encodeURIComponent(symbols)}&fields=${fields}`;

    const yahooRes = await fetch(yahooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!yahooRes.ok) {
      throw new Error(`Yahoo 返回 ${yahooRes.status}`);
    }

    const data = await yahooRes.json();
    const quotes = data.quoteResponse?.result || [];

    const result = quotes.map((q) => {
      const fcf = q.freeCashflow || 0;
      const mktCap = q.marketCap || 1;
      return {
        ticker: q.symbol,
        price: q.regularMarketPrice || 0,
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
    return res.status(200).json({ updated: new Date().toISOString(), data: result });
  } catch (err) {
    return res.status(500).json({ error: err.message || "获取数据失败" });
  }
}
