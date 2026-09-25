function parseRemainingLease(str) {
  if (!str || typeof str !== 'string') return null;
  const yearsMatch = str.match(/(\d+)\s*year/i);
  const monthsMatch = str.match(/(\d+)\s*month/i);
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
  const months = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
  return years + months / 12;
}

function computeMetrics(records) {
  if (!records || records.length === 0) {
    return {
      count: 0,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      medianPricePerSqm: null,
      medianPricePerSqft: null,
      medianPricePerSqFt: null,
      medianRemainingLeaseYears: null
    };
  }

  const count = records.length;
  const prices = records.map((r) => r.resale_price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const medianPrice = prices.length % 2 !== 0
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;

  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  const psmList = records
    .map((r) => r.resale_price / Number(r.floor_area_sqm))
    .filter((v) => !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b);

  const midPsm = Math.floor(psmList.length / 2);
  const rawMedianPsm = psmList.length % 2 !== 0
    ? psmList[midPsm]
    : (psmList[midPsm - 1] + psmList[midPsm]) / 2;
  const medianPricePerSqm = Math.round(rawMedianPsm);
  const medianPricePerSqft = Math.round(rawMedianPsm / 10.7639);

  const leaseList = records
    .map((r) => parseRemainingLease(r.remaining_lease))
    .filter((v) => v !== null && !isNaN(v))
    .sort((a, b) => a - b);

  let medianRemainingLeaseYears = null;
  if (leaseList.length > 0) {
    const midLease = Math.floor(leaseList.length / 2);
    const rawMedianLease = leaseList.length % 2 !== 0
      ? leaseList[midLease]
      : (leaseList[midLease - 1] + leaseList[midLease]) / 2;
    medianRemainingLeaseYears = Math.round(rawMedianLease * 10) / 10;
  }

  return {
    count,
    medianPrice,
    minPrice,
    maxPrice,
    medianPricePerSqm,
    medianPricePerSqft,
    medianPricePerSqFt: medianPricePerSqft,
    medianRemainingLeaseYears
  };
}

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
  const rawTown = query.town !== undefined && query.town !== null ? String(query.town).trim() : '';
  const rawType = query.type !== undefined && query.type !== null ? String(query.type).trim() : '4 ROOM';

  const typeStr = rawType || '4 ROOM';
  const flatType = typeStr.toUpperCase();

  const allowedPattern = /^[A-Za-z0-9 /]+$/;
  if (!allowedPattern.test(flatType)) {
    return res.status(400).json({
      error: 'Query parameters town and type allow only letters, digits, spaces, and slashes.'
    });
  }

  const isAllSingapore = !rawTown || rawTown.toUpperCase() === 'ALL';

  if (isAllSingapore) {
    // 1) First call the datastore with filters={"flat_type":<type>}, sort=month desc, limit=1 to learn latest month
    const step1Params = new URLSearchParams();
    step1Params.set('resource_id', 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc');
    step1Params.set('filters', JSON.stringify({ flat_type: flatType }));
    step1Params.set('sort', 'month desc');
    step1Params.set('limit', '1');

    const step1Url = `https://data.gov.sg/api/action/datastore_search?${step1Params.toString()}`;

    let resp1;
    try {
      resp1 = await fetch(step1Url);
    } catch (networkErr) {
      return res.status(504).json({
        upstreamStatus: null,
        refusal: false,
        unreachable: true,
        error: "We couldn't reach data.gov.sg. Check your connection and try again."
      });
    }

    if (!resp1.ok) {
      return res.status(resp1.status).json({
        upstreamStatus: resp1.status,
        refusal: true,
        unreachable: false,
        error: `data.gov.sg turned the request away with status ${resp1.status}.`
      });
    }

    let data1;
    try {
      data1 = await resp1.json();
    } catch (parseErr) {
      return res.status(502).json({
        upstreamStatus: resp1.status,
        refusal: true,
        unreachable: false,
        error: 'data.gov.sg returned an unreadable response body.'
      });
    }

    if (!data1 || data1.success === false) {
      return res.status(502).json({
        upstreamStatus: resp1.status,
        refusal: true,
        unreachable: false,
        error: data1?.error?.message || 'data.gov.sg datastore query was not successful.'
      });
    }

    const records1 = data1.result?.records || [];
    if (records1.length === 0) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
      return res.status(200).json({
        town: 'ALL',
        flatType,
        month: null,
        medianPrice: null,
        minPrice: null,
        maxPrice: null,
        medianPricePerSqm: null,
        medianPricePerSqft: null,
        medianPricePerSqFt: null,
        medianRemainingLeaseYears: null,
        count: 0
      });
    }

    const latestMonth = records1[0].month;

    // 2) Call it again with filters={"month":<that month>,"flat_type":<type>} and limit=10000
    const step2Params = new URLSearchParams();
    step2Params.set('resource_id', 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc');
    step2Params.set('filters', JSON.stringify({ month: latestMonth, flat_type: flatType }));
    step2Params.set('limit', '10000');

    const step2Url = `https://data.gov.sg/api/action/datastore_search?${step2Params.toString()}`;

    let resp2;
    try {
      resp2 = await fetch(step2Url);
    } catch (networkErr) {
      return res.status(504).json({
        upstreamStatus: null,
        refusal: false,
        unreachable: true,
        error: "We couldn't reach data.gov.sg. Check your connection and try again."
      });
    }

    if (!resp2.ok) {
      return res.status(resp2.status).json({
        upstreamStatus: resp2.status,
        refusal: true,
        unreachable: false,
        error: `data.gov.sg turned the request away with status ${resp2.status}.`
      });
    }

    let data2;
    try {
      data2 = await resp2.json();
    } catch (parseErr) {
      return res.status(502).json({
        upstreamStatus: resp2.status,
        refusal: true,
        unreachable: false,
        error: 'data.gov.sg returned an unreadable response body.'
      });
    }

    if (!data2 || data2.success === false) {
      return res.status(502).json({
        upstreamStatus: resp2.status,
        refusal: true,
        unreachable: false,
        error: data2?.error?.message || 'data.gov.sg datastore query was not successful.'
      });
    }

    const rawRecords2 = data2.result?.records || [];
    const records2 = rawRecords2.map((r) => ({
      ...r,
      resale_price: Number(r.resale_price)
    }));

    if (records2.length === 0) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
      return res.status(200).json({
        town: 'ALL',
        flatType,
        month: latestMonth,
        medianPrice: null,
        minPrice: null,
        maxPrice: null,
        medianPricePerSqm: null,
        medianPricePerSqft: null,
        medianPricePerSqFt: null,
        medianRemainingLeaseYears: null,
        count: 0
      });
    }

    const metrics2 = computeMetrics(records2);

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.status(200).json({
      town: 'ALL',
      flatType,
      month: latestMonth,
      medianPrice: metrics2.medianPrice,
      minPrice: metrics2.minPrice,
      maxPrice: metrics2.maxPrice,
      medianPricePerSqm: metrics2.medianPricePerSqm,
      medianPricePerSqft: metrics2.medianPricePerSqft,
      medianPricePerSqFt: metrics2.medianPricePerSqFt,
      medianRemainingLeaseYears: metrics2.medianRemainingLeaseYears,
      count: metrics2.count
    });
  }

  // Existing path for a named town exactly as it is
  const town = rawTown.toUpperCase();
  if (!allowedPattern.test(town)) {
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
      minPrice: null,
      maxPrice: null,
      medianPricePerSqm: null,
      medianPricePerSqft: null,
      medianPricePerSqFt: null,
      medianRemainingLeaseYears: null,
      count: 0
    });
  }

  const months = [...new Set(records.map((r) => r.month))].sort();
  const mostRecentMonth = months[months.length - 1];

  const latestRecords = records.filter((r) => r.month === mostRecentMonth);
  const metrics = computeMetrics(latestRecords);

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
  return res.status(200).json({
    town,
    flatType,
    month: mostRecentMonth,
    medianPrice: metrics.medianPrice,
    minPrice: metrics.minPrice,
    maxPrice: metrics.maxPrice,
    medianPricePerSqm: metrics.medianPricePerSqm,
    medianPricePerSqft: metrics.medianPricePerSqft,
    medianPricePerSqFt: metrics.medianPricePerSqFt,
    medianRemainingLeaseYears: metrics.medianRemainingLeaseYears,
    count: metrics.count
  });
}
