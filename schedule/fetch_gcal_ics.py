import os
import json
import requests
import pytz
from icalendar import Calendar
from dotenv import load_dotenv

def to_local(dt_or_date, local_tz):
    if dt_or_date is None:
        return None

    value = getattr(dt_or_date, "dt", dt_or_date)

    # all-day event (date)
    if hasattr(value, "year") and not hasattr(value, "hour"):
        return value

    # datetime
    if value.tzinfo is None:
        # Treat naive datetime as local time
        return local_tz.localize(value)
    return value.astimezone(local_tz)

def main():
    # Load .env from current working directory (same folder is typical)
    load_dotenv()

    ics_url = os.getenv("GCAL_ICS_URL", "").strip()
    if not ics_url:
        raise SystemExit("❌ Missing GCAL_ICS_URL in .env")

    tz_name = os.getenv("LOCAL_TZ", "Asia/Taipei").strip() or "Asia/Taipei"
    local_tz = pytz.timezone(tz_name)

    r = requests.get(ics_url, timeout=30)
    r.raise_for_status()

    cal = Calendar.from_ical(r.content)

    events = []
    for e in cal.walk("VEVENT"):
        summary = str(e.get("SUMMARY", ""))
        description = str(e.get("DESCRIPTION", ""))
        location = str(e.get("LOCATION", ""))
        uid = str(e.get("UID", ""))

        dtstart = to_local(e.get("DTSTART"), local_tz)
        dtend = to_local(e.get("DTEND"), local_tz)

        events.append({
            "uid": uid,
            "summary": summary,
            "start": dtstart.isoformat() if hasattr(dtstart, "isoformat") else str(dtstart),
            "end": dtend.isoformat() if hasattr(dtend, "isoformat") else str(dtend),
            "location": location,
            "description": description,
        })

    events.sort(key=lambda x: x["start"])
    print(json.dumps(events, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
