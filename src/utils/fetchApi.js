import fetch from 'isomorphic-fetch';

async function fetchServer(url, options) {
  const result = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await result.json();
  if (!result.ok) {
    throw new Error(`${result.status} ${result.statusText} ${body.error}`);
  }
  return body;
}

export default fetchServer;
