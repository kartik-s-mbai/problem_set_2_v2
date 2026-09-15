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

  const keyConfigured = 'not required';
  const params = new URLSearchParams();
  params.set('resource_id', 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc');
  params.set('limit', '1');

  const upstreamUrl = `https://data.gov.sg/api/action/datastore_search?${params.toString()}`;

  try {
    const response = await fetch(upstreamUrl);
    return res.status(response.ok ? 200 : response.status).json({
      keyConfigured,
      upstreamAnswered: true,
      upstreamStatus: response.status
    });
  } catch (err) {
    return res.status(504).json({
      keyConfigured,
      upstreamAnswered: false,
      upstreamStatus: null,
      error: "We couldn't reach data.gov.sg. Check your connection and try again."
    });
  }
}
