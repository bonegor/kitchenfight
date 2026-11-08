/**
 * The bytes behind an asset URL: data: URLs (the single-file build inlines every MP3) are decoded in
 * place, others fetched. Decoding in place keeps the recorded instruments and sound effects working on
 * pages whose Content-Security-Policy does not list data: in connect-src (fetch(data:) is refused there).
 */
export async function readUrl(url: string): Promise<ArrayBuffer> {
  if (url.slice(0, 5).toLowerCase() === 'data:') {
    const comma = url.indexOf(',');
    if (comma < 0) throw new Error('malformed data: URL');
    const meta = url.slice(5, comma);
    const body = url.slice(comma + 1);
    let bin: string;
    if (/;base64$/i.test(meta)) bin = atob(body);
    else bin = body.replace(/%([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 255;
    return out.buffer;
  }
  if (typeof fetch !== 'function') throw new Error('no fetch');
  const res = await fetch(url);
  if (!res.ok && res.status !== 0) throw new Error('http ' + res.status);
  return res.arrayBuffer();
}
