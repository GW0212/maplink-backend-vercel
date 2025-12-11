// api/resolve.js
// Vercel Serverless Function

function buildNaverDeepLink(finalUrl) {
  try {
    const appname = encodeURIComponent('https://gw0212.github.io/MapLink_Manager/');
    const url = new URL(finalUrl);

    const placeMatch = finalUrl.match(/place\/(\d+)/);
    if (placeMatch) {
      return `nmap://place?id=${placeMatch[1]}&appname=${appname}`;
    }

    const lat =
      url.searchParams.get('lat') ||
      url.searchParams.get('y') ||
      url.searchParams.get('mapy');
    const lng =
      url.searchParams.get('lng') ||
      url.searchParams.get('x') ||
      url.searchParams.get('mapx');

    if (lat && lng) {
      return `nmap://map?lat=${lat}&lng=${lng}&appname=${appname}`;
    }
  } catch (e) {
    console.error('buildNaverDeepLink error:', e);
  }
  return null;
}

function buildKakaoDeepLink(finalUrl) {
  try {
    let m = finalUrl.match(
      /map\.kakao\.com\/link\/map\/[^,]*,([0-9.\-]+),([0-9.\-]+)/
    );
    if (m) {
      const lat = m[1];
      const lng = m[2];
      return `kakaomap://look?p=${lat},${lng}`;
    }

    const url = new URL(finalUrl);
    const lat = url.searchParams.get('lat') || url.searchParams.get('y');
    const lng = url.searchParams.get('lng') || url.searchParams.get('x');
    if (lat && lng) {
      return `kakaomap://look?p=${lat},${lng}`;
    }
  } catch (e) {
    console.error('buildKakaoDeepLink error:', e);
  }
  return null;
}

async function resolveShortUrl(originalUrl) {
  try {
    const res = await fetch(originalUrl, { redirect: 'follow' });
    return res.url || originalUrl;
  } catch (e) {
    console.error('resolveShortUrl error:', e);
    return originalUrl;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url, service } = req.body || {};
    if (!url || !service) return res.status(400).json({ error: 'url, service 필수' });

    let finalUrl = url;
    const lower = String(url).toLowerCase();

    if (lower.includes('naver.me/') ||
        lower.includes('kko.to/') ||
        lower.includes('kko.kakao.com')) {
      finalUrl = await resolveShortUrl(url);
    }

    let deepLink = null;
    if (service === 'naver') deepLink = buildNaverDeepLink(finalUrl);
    else if (service === 'kakao') deepLink = buildKakaoDeepLink(finalUrl);

    return res.status(200).json({ originalUrl: url, finalUrl, deepLink });

  } catch (e) {
    console.error('handler error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
}
