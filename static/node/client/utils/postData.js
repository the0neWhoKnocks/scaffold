const serializeForm = require('./serializeForm');

async function postWithFetch(url, body) {
  const resp = await window.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  
  const contentType = resp.headers.get('content-type');
  const data = (contentType?.includes('application/json'))
    ? await resp.json()
    : await resp.text();
  
  if (resp.ok) return data;
  throw new Error(data?.message || data);
}

function postWithXHR(url, body, opts) {
  return new Promise((resolve, reject) => {
    const { onProgress } = opts;
    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('progress', () => { onProgress(xhr.response); });
    xhr.addEventListener('load', () => { resolve(xhr.response); });
    xhr.addEventListener('error', () => { reject(xhr.response); });
    xhr.responseType = 'text';
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);
  });
}

module.exports = function postData(url, obj, opts = {}) {
  const body = JSON.stringify((obj instanceof HTMLElement) ? serializeForm(obj) : obj);
  return (opts.onProgress) ? postWithXHR(url, body, opts) : postWithFetch(url, body);
};
