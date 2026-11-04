// Shared HTML wrapper for every email (inline styles: email clients ignore <style> tags)
const escape = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const esc = escape;

export const button = (href, label) => `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0">
    <tr><td style="border-radius:999px;background:#6b4f3a">
      <a href="${escape(href)}" style="display:inline-block;padding:13px 26px;font-weight:600;font-size:15px;color:#ffffff;text-decoration:none;border-radius:999px">${escape(label)}</a>
    </td></tr>
  </table>`;

// rows: [[label, value], ...]
export const details = (rows) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border:1px solid #e7ddd0;border-radius:12px;border-collapse:separate">
    ${rows
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v], i) => `
      <tr>
        <td style="padding:11px 16px;font-size:13px;color:#8a7564;${i ? 'border-top:1px solid #e7ddd0;' : ''}">${escape(k)}</td>
        <td style="padding:11px 16px;font-size:14px;color:#2b1f17;font-weight:600;text-align:right;${i ? 'border-top:1px solid #e7ddd0;' : ''}">${escape(v)}</td>
      </tr>`)
      .join('')}
  </table>`;

export const layout = ({ hotel, preheader = '', heading, body }) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(heading)}</title></head>
<body style="margin:0;padding:0;background:#f7f3ed;font-family:Poppins,'Segoe UI',Arial,sans-serif;color:#2b1f17">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ed;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px">
        <tr><td style="background:#2b1f17;border-radius:18px 18px 0 0;padding:22px 28px">
          <span style="display:inline-block;width:30px;height:30px;border-radius:8px;background:#b69a7d;vertical-align:middle"></span>
          <span style="color:#ffffff;font-size:18px;font-weight:600;vertical-align:middle;margin-left:10px">${escape(hotel.name)}</span>
        </td></tr>
        <tr><td style="background:#ffffff;padding:30px 28px;border-radius:0 0 18px 18px">
          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#2b1f17">${escape(heading)}</h1>
          <div style="font-size:15px;line-height:1.65;color:#5a4636">${body}</div>
        </td></tr>
        <tr><td style="padding:18px 8px;text-align:center;font-size:12px;line-height:1.6;color:#8a7564">
          ${escape(hotel.name)} · ${escape(hotel.address)}<br>
          ${escape(hotel.phone)} · <a href="mailto:${escape(hotel.email)}" style="color:#8a7564">${escape(hotel.email)}</a><br>
          You are receiving this email because of your account or booking with us.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
