(function (root) {
  "use strict";

  function decodeXml(value) {
    return String(value || "")
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  function attr(tag, name) {
    const match = tag.match(new RegExp("(?:^|\\s)" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i"));
    if (!match) return "";
    return decodeXml(match[1] != null ? match[1] : match[2] || "");
  }

  function cleanName(value) {
    const name = String(value || "").trim();
    if (!name || name === "null" || name === "(Unknown)" || name.toLowerCase() === "unknown") return "";
    return name;
  }

  function cleanPhone(value) {
    let phone = String(value || "").trim().replace(/^'+/, "");
    if (phone.startsWith("=")) phone = phone.slice(1).trim();
    if ((phone.startsWith('"') && phone.endsWith('"')) || (phone.startsWith("'") && phone.endsWith("'"))) {
      phone = phone.slice(1, -1);
    }
    if (phone.replace(/\D/g, "").length < 3) return "";
    return phone;
  }

  function threadKey(raw) {
    const text = String(raw || "").trim();
    if (!text) return "";
    const digits = text.replace(/\D/g, "");
    if (digits.length < 3) return "";
    if (/[~;,]/.test(text) && digits.length > 11) return "g:" + digits;
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
  }

  function epoch(value) {
    const n = Number(String(value || "").trim());
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (n < 1e11) return Math.round(n * 1000);
    return Math.round(n);
  }

  function yieldUi() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function forEachTag(text, tag, visit) {
    const open = "<" + tag;
    let index = 0;
    let seen = 0;
    while ((index = text.indexOf(open, index)) !== -1) {
      const next = text[index + open.length];
      if (next && next !== " " && next !== "\n" && next !== "\r" && next !== "\t" && next !== ">" && next !== "/") {
        index += open.length;
        continue;
      }
      const tagEnd = text.indexOf(">", index);
      if (tagEnd < 0) break;
      const openTag = text.slice(index, tagEnd + 1);
      const selfClose = /\/\s*>$/.test(openTag);
      let inner = "";
      let end = tagEnd + 1;
      if (!selfClose) {
        const close = "</" + tag + ">";
        const closeAt = text.indexOf(close, tagEnd);
        if (closeAt < 0) break;
        inner = text.slice(tagEnd + 1, closeAt);
        end = closeAt + close.length;
      }
      if (end <= index) {
        index += open.length;
        continue;
      }
      await visit(openTag, inner);
      seen += 1;
      if (seen % 2500 === 0) await yieldUi();
      index = end;
    }
  }

  function partBody(inner) {
    const texts = [];
    let media = "";
    const re = /<part\b([^>]*?)\/?>/gi;
    let match;
    while ((match = re.exec(inner))) {
      const tag = match[1];
      const type = attr(tag, "ct").toLowerCase();
      const text = attr(tag, "text").trim();
      if (text && text !== "null" && (!type || type.includes("text"))) texts.push(text);
      else if (!media && type.startsWith("image/")) media = "Photo";
      else if (!media && type.startsWith("video/")) media = "Video";
      else if (!media && type.startsWith("audio/")) media = "Audio";
    }
    return (texts.filter((bit, i) => bit && bit !== texts[i - 1]).join("\n") || media).slice(0, 20000);
  }

  function mmsAddress(openTag, inner, direction) {
    const direct = cleanPhone(attr(openTag, "address"));
    if (direct && direct !== "insert-address-token") return direct;
    const wanted = direction === "in" ? "137" : "151";
    let fallback = "";
    const re = /<addr\b([^>]*?)\/?>/gi;
    let match;
    while ((match = re.exec(inner))) {
      const address = cleanPhone(attr(match[1], "address"));
      if (!address || address === "insert-address-token") continue;
      if (attr(match[1], "type") === wanted) return address;
      if (!fallback) fallback = address;
    }
    return fallback;
  }

  async function parseXml(text) {
    const messages = [];
    const calls = [];
    if (text.includes("<sms")) {
      await forEachTag(text, "sms", async (openTag) => {
        const type = attr(openTag, "type");
        if (type === "3") return;
        const body = attr(openTag, "body").trim().slice(0, 20000);
        const address = cleanPhone(attr(openTag, "address"));
        const date = epoch(attr(openTag, "date"));
        if (!body || !address || !date) return;
        messages.push({
          address,
          name: cleanName(attr(openTag, "contact_name")),
          body,
          date,
          direction: type === "1" ? "in" : "out",
          read: attr(openTag, "read") !== "0",
        });
      });
    }
    if (text.includes("<mms")) {
      await forEachTag(text, "mms", async (openTag, inner) => {
        const direction = attr(openTag, "msg_box") === "1" ? "in" : "out";
        const body = partBody(inner);
        const address = mmsAddress(openTag, inner, direction);
        const date = epoch(attr(openTag, "date"));
        if (!body || !address || !date) return;
        messages.push({
          address,
          name: cleanName(attr(openTag, "contact_name")),
          body,
          date,
          direction,
          read: attr(openTag, "read") !== "0",
        });
      });
    }
    if (text.includes("<call")) {
      await forEachTag(text, "call", async (openTag) => {
        const number = cleanPhone(attr(openTag, "number") || attr(openTag, "address"));
        const date = epoch(attr(openTag, "date"));
        if (!number || !date) return;
        const type = attr(openTag, "type");
        calls.push({
          number,
          name: cleanName(attr(openTag, "contact_name") || attr(openTag, "name")),
          date,
          duration: Math.max(0, Number(attr(openTag, "duration")) || 0),
          kind: type === "2" ? "out" : type === "1" ? "in" : "missed",
        });
      });
    }
    return { messages, calls, contacts: [] };
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const source = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (quoted) {
        if (char === '"') {
          if (source[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else quoted = false;
        } else cell += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (char !== "\r") cell += char;
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter((item) => item.some((value) => value.trim()));
  }

  function parseCsvContacts(text) {
    const rows = parseCsv(text);
    if (!rows.length) return [];
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const phoneCols = [];
    const emailCols = [];
    let nameCol = -1;
    let givenCol = -1;
    let familyCol = -1;
    headers.forEach((header, index) => {
      if (header === "name" || header === "full name") nameCol = index;
      else if (header === "given name" || header === "first name") givenCol = index;
      else if (header === "family name" || header === "last name") familyCol = index;
      else if ((header.includes("phone") || header === "mobile" || header === "tel") && !header.includes("type") && !header.includes("label")) phoneCols.push(index);
      else if ((header.includes("e-mail") || header.includes("email")) && !header.includes("type") && !header.includes("label")) emailCols.push(index);
    });
    const contacts = [];
    for (const row of rows.slice(1)) {
      const phones = phoneCols.map((index) => cleanPhone(row[index] || "")).filter(Boolean);
      const emails = emailCols.map((index) => (row[index] || "").trim()).filter(Boolean);
      let name = nameCol >= 0 ? (row[nameCol] || "").trim() : "";
      if (!name) {
        name = [givenCol >= 0 ? row[givenCol] : "", familyCol >= 0 ? row[familyCol] : ""].filter(Boolean).join(" ").trim();
      }
      name = cleanName(name);
      if (!name && !phones.length && !emails.length) continue;
      contacts.push({ name, phones, emails });
    }
    return contacts;
  }

  function parseVcards(text) {
    const unfolded = text.replace(/^\uFEFF/, "").replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
    const contacts = [];
    for (const block of unfolded.split(/BEGIN:VCARD/i).slice(1)) {
      const body = block.split(/END:VCARD/i)[0];
      let name = "";
      const phones = [];
      const emails = [];
      for (const line of body.split(/\r?\n/)) {
        const split = line.indexOf(":");
        if (split < 0) continue;
        const key = line.slice(0, split).split(";")[0].replace(/^item\d+\./i, "").toUpperCase();
        const value = line.slice(split + 1).trim();
        if (key === "FN") name = cleanName(value);
        else if (key === "TEL") {
          const phone = cleanPhone(value);
          if (phone) phones.push(phone);
        } else if (key === "EMAIL" && value) emails.push(value);
      }
      if (name || phones.length || emails.length) contacts.push({ name, phones, emails });
    }
    return contacts;
  }

  function detect(filename, text) {
    const name = String(filename || "").toLowerCase();
    if (name.endsWith(".zip") || text.startsWith("PK")) return "zip";
    const head = text.slice(0, 4000).toLowerCase();
    if (head.includes("<smses") || head.includes("<calls") || head.includes("<sms") || head.includes("<mms") || head.includes("<call") || name.endsWith(".xml")) return "xml";
    if (head.includes("begin:vcard") || name.endsWith(".vcf") || name.endsWith(".vcard")) return "vcard";
    if (name.endsWith(".csv") || head.includes(",")) return "csv";
    return "unknown";
  }

  async function parseBackup(filename, text) {
    const kind = detect(filename, text);
    if (kind === "xml") return { kind, ...(await parseXml(text)) };
    if (kind === "vcard") return { kind, messages: [], calls: [], contacts: parseVcards(text) };
    if (kind === "csv") return { kind, messages: [], calls: [], contacts: parseCsvContacts(text) };
    return { kind, messages: [], calls: [], contacts: [] };
  }

  root.LukeParse = {
    parseBackup,
    threadKey,
    cleanName,
    cleanPhone,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
