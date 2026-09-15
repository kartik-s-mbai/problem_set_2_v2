export default async function handler(req, res) {
  if (typeof res.status !== 'function') {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
  }
  if (typeof res.json !== 'function') {
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
  }

  const query = req.query || Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
  const rawTown = query.town !== undefined && query.town !== null ? String(query.town).trim() : 'TAMPINES';
  const rawType = query.type !== undefined && query.type !== null ? String(query.type).trim() : '4 ROOM';

  const townStr = rawTown || 'TAMPINES';
  const typeStr = rawType || '4 ROOM';

  const town = townStr.toUpperCase();
  const flatType = typeStr.toUpperCase();

  const allowedPattern = /^[A-Za-z0-9 /]+$/;
  if (!allowedPattern.test(town) || !allowedPattern.test(flatType)) {
    return res.status(400).json({
      error: 'Query parameters town and type allow only letters, digits, spaces, and slashes.'
    });
  }

  const params = new URLSearchParams();
  params.set('resource_id', 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc');
  params.set('filters', JSON.stringify({ town, flat_type: flatType }));
  params.set('limit', '10000');

  const upstreamUrl = `https://data.gov.sg/api/action/datastore_search?${params.toString()}`;

  let response;
  try {
    response = await fetch(upstreamUrl);
  } catch (networkErr) {
    return res.status(504).json({
      upstreamStatus: null,
      refusal: false,
      unreachable: true,
      error: "We couldn't reach data.gov.sg. Check your connection and try again."
    });
  }

  if (!response.ok) {
    return res.status(response.status).json({
      upstreamStatus: response.status,
      refusal: true,
      unreachable: false,
      error: `data.gov.sg turned the request away with status ${response.status}.`
    });
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    return res.status(502).json({
      upstreamStatus: response.status,
      refusal: true,
      unreachable: false,
      error: 'data.gov.sg returned an unreadable response body.'
    });
  }

  if (!data || data.success === false) {
    return res.status(502).json({
      upstreamStatus: response.status,
      refusal: true,
      unreachable: false,
      error: data?.error?.message || 'data.gov.sg datastore query was not successful.'
    });
  }

  const rawRecords = data.result?.records || [];
  const records = rawRecords.map((r) => ({
    ...r,
    resale_price: Number(r.resale_price)
  }));

  if (records.length === 0) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.status(200).json({
      town,
      flatType,
      month: null,
      medianPrice: null,
      count: 0
    });
  }

  const months = [...new Set(records.map((r) => r.month))].sort();
  const mostRecentMonth = months[months.length - 1];

  const latestRecords = records.filter((r) => r.month === mostRecentMonth);
  const count = latestRecords.length;

  const prices = latestRecords.map((r) => r.resale_price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const medianPrice = prices.length % 2 !== 0
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
  return res.status(200).json({
    town,
    flatType,
    month: mostRecentMonth,
    medianPrice,
    count
  });
}
