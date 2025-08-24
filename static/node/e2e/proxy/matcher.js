module.exports = async function matcher({
  cacheResp,
  color,
  next,
  req,
  res,
}) {
  const { domain, fullURL, originalUrl, state } = req;
  let payload;
  
  if (domain === 'opentdb.com') {
    if (originalUrl.includes('api.php?amount=1')) {
      payload = await cacheResp(req, {
        label: 'randomTrivia',
        prefixLabel: false,
        subDir: 'opentdb',
      });
      
      if (state.mockData) {
        payload.results = state.mockData;
      }
    }
    
    if (payload) res.json(payload);
    else console.log(`${color.block.warn('WARN')} No payload for ${color.text.info(fullURL)}`);
  }
  else next();
};
