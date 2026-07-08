import client from './client';
import type { CalendarEvent } from '../types';

const LS_PASSWORD_KEY = 'caldav_password';
const CONFIG_KEYS = {
  serverUrl: 'caldav.server_url',
  username: 'caldav.username',
};

export function getStoredPassword(): string {
  return localStorage.getItem(LS_PASSWORD_KEY) || '';
}

function setStoredPassword(password: string) {
  if (password) {
    localStorage.setItem(LS_PASSWORD_KEY, password);
  } else {
    localStorage.removeItem(LS_PASSWORD_KEY);
  }
}

export async function getCalDavConfig(): Promise<{ serverUrl: string; username: string; hasPassword: boolean }> {
  const res = await client.get('/app-config');
  const data = res.data?.data || {};
  return {
    serverUrl: data[CONFIG_KEYS.serverUrl] || '',
    username: data[CONFIG_KEYS.username] || '',
    hasPassword: !!getStoredPassword(),
  };
}

export async function updateCalDavConfig(config: { serverUrl: string; username: string; password?: string }): Promise<void> {
  const payload: Record<string, string> = {};
  payload[CONFIG_KEYS.serverUrl] = config.serverUrl;
  payload[CONFIG_KEYS.username] = config.username;
  await client.put('/app-config', payload);
  if (config.password !== undefined) {
    setStoredPassword(config.password);
  }
}

function unfoldICalLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (line.length > 0 && (line[0] === ' ' || line[0] === '\t')) {
      current += line.substring(1).trimEnd();
    } else {
      if (current) lines.push(current);
      current = line.trimEnd();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseICalDate(dateStr: string): string {
  const s = dateStr.replace(/[^0-9TZ]/g, '');
  if (s.length >= 15) {
    return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}T${s.substring(9, 11)}:${s.substring(11, 13)}:${s.substring(13, 15)}`;
  }
  if (s.length >= 8 && !s.includes('T')) {
    return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}T00:00:00`;
  }
  return dateStr;
}

function parseICalEvents(icalText: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = unfoldICalLines(icalText);

  let current: Partial<CalendarEvent> | null = null;
  let inEvent = false;

  for (const raw of lines) {
    if (!inEvent) {
      if (raw === 'BEGIN:VEVENT') {
        current = {};
        inEvent = true;
      }
      continue;
    }

    if (raw === 'END:VEVENT') {
      if (current?.uid) {
        current.summary = current.summary || '';
        current.allDay = current.allDay || false;
        events.push(current as CalendarEvent);
      }
      current = null;
      inEvent = false;
      continue;
    }

    const colonIdx = raw.indexOf(':');
    if (colonIdx <= 0) continue;
    const key = raw.substring(0, colonIdx).toUpperCase();
    const value = raw.substring(colonIdx + 1);

    if (key === 'UID') {
      current!.uid = value;
    } else if (key === 'SUMMARY') {
      current!.summary = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
    } else if (key === 'DESCRIPTION') {
      current!.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
    } else if (key === 'LOCATION') {
      current!.location = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
    } else if (key.startsWith('DTSTART')) {
      current!.allDay = key.includes('VALUE=DATE');
      current!.start = parseICalDate(value);
    } else if (key.startsWith('DTEND')) {
      current!.end = parseICalDate(value);
    }
  }

  return events;
}

function buildCalendarQueryXml(start: Date, end: Date): string {
  const fmt = (d: Date) => {
    const s = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return s;
  };
  return `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${fmt(start)}" end="${fmt(end)}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
}

function parseMultistatusXml(xmlText: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const calDataRegex = /<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/gi;
  let match;
  while ((match = calDataRegex.exec(xmlText)) !== null) {
    const icalText = match[1].trim();
    if (icalText) {
      const parsed = parseICalEvents(icalText);
      events.push(...parsed);
    }
  }
  return events;
}

export async function fetchCalendarEvents(
  serverUrl: string,
  username: string,
  password: string,
  start: Date,
  end: Date,
): Promise<CalendarEvent[]> {
  const auth = btoa(`${username}:${password}`);
  const xml = buildCalendarQueryXml(start, end);

  const res = await fetch(serverUrl, {
    method: 'REPORT',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1',
      Authorization: `Basic ${auth}`,
    },
    body: xml,
  });

  if (!res.ok) {
    throw new Error(`CalDAV 请求失败 (${res.status})`);
  }

  const text = await res.text();
  return parseMultistatusXml(text);
}
