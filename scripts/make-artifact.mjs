// Turn the single-file build into an Artifact page body (no doctype/html/head/body wrappers).
// Usage: node scripts/make-artifact.mjs dist-single/index.html out.html
import fs from 'fs';
const [,, src = 'dist-single/index.html', out = 'dist-single/artifact.html'] = process.argv;
const html = fs.readFileSync(src, 'utf8');
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
const styles = [...head.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]);
const scripts = [...head.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
const desc = /<meta name="description" content="([^"]*)"/.exec(head)?.[1] ?? '';
const page = [
  '<title>Kitchen Fight</title>',
  desc ? `<meta name="description" content="${desc}">` : '',
  '<meta name="theme-color" content="#2b1712">',
  ...styles,
  body.trim(),
  ...scripts,
].filter(Boolean).join('\n');
fs.writeFileSync(out, page);
console.log('wrote', out, (page.length / 1024).toFixed(0) + ' KB', 'styles', styles.length, 'scripts', scripts.length);
