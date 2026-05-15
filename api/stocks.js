const TWELVE_KEY = "61e5c09ab358401fba7f35d3b1628360"; // 替换成你的 Key

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const symbols = req.query.symbols;
  if (!symbols) return res.status(400).json({ error: "缺少 symbols 参数" });

  try {
    const symbolList = symbols.split(",").map(s => s.trim());
    
    // Twelve Data 批量报价接口
    const url = `https://api.twelvedata.com/quote?symbol=${symbolList.join(",")}&apikey=${TWELVE_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Twelve Data ${r.status}`);
    const json = await r.json();

    // 单个股票返回对象，多个返回 {NVDA: {...}, AAPL: {...}}
    const isMultiple = symbolList.length > 1;
    
    const data = symbolList.map(ticker => {
      const q = isMultiple ? json[ticker] : json;
      if (!q || q.status === "error") {
        return { ticker, price: 0, change: 0, error: true };
      }
      return {
        ticker,
        price: +(parseFloat(q.close || q.previous_close || 0).toFixed(2)),
        change: +(parseFloat(q.percent_change || 0).toFixed(2)),
        pe: 0, pb: 0, roe: 0, revenueGrowth: 0,
        debtEquity: 0, grossMargin: 0, fcfYield: 0,
        priceOnly: true,
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json({ updated: new Date().toISOString(), data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
