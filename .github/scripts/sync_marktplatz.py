import csv
import json
import urllib.request
from datetime import datetime

SHEET_URL = "https://docs.google.com/spreadsheets/d/1VGE1CKPBbf4HAzgeGEMCLT6KRt2Z3zPOFuwMLOZ8yEI/export?format=csv&gid=2121850440"

EMOJI_MAP = {
    "Kinderkleidung": "👕",
    "Schuhe": "👟",
    "Spielzeug": "🧸",
    "Bücher": "📚",
    "Möbel": "🪑",
    "Kinderwagen": "🍼",
    "Elektronik": "📱",
    "Sport": "⚽",
    "Sonstiges": "📦",
}

TYPE_MAP = {
    "Verkaufen": "sell",
    "Suchen": "search",
    "Verschenken": "free",
}

def get_emoji(kategorie):
    for key, emoji in EMOJI_MAP.items():
        if key.lower() in kategorie.lower():
            return emoji
    return "📦"

def parse_time(timestamp):
    try:
        dt = datetime.strptime(timestamp[:10], "%Y-%m-%d")
        days = (datetime.now() - dt).days
        if days == 0:
            return "neu"
        elif days == 1:
            return "gestern"
        elif days < 7:
            return f"vor {days} Tagen"
        else:
            return dt.strftime("%d.%m.%Y")
    except:
        return "neu"

def main():
    req = urllib.request.Request(SHEET_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as response:
        content = response.read().decode("utf-8")
    
    reader = csv.DictReader(content.splitlines())
    items = []
    
    for i, row in enumerate(reader):
        # Skip empty rows
        if not row.get("Artikelname", "").strip():
            continue
        
        preis = row.get("Preis", "").strip()
        if preis and not preis.startswith("€"):
            preis = f"€{preis}"
        
        item = {
            "id": str(i + 1),
            "type": TYPE_MAP.get(row.get("Inseratstyp", "").strip(), "sell"),
            "emoji": get_emoji(row.get("Kategorie", "")),
            "name": row.get("Artikelname", "").strip(),
            "kategorie": row.get("Kategorie", "").strip(),
            "zustand": row.get("Zustand", "").strip(),
            "preis": preis,
            "abholung": row.get("Abholung", "").strip(),
            "stadtteil": row.get("Stadtteil", "").strip(),
            "time": parse_time(row.get("时间戳记", "")),
        }
        items.append(item)
    
    with open("marktplatz_data.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Synced {len(items)} items to marktplatz_data.json")

if __name__ == "__main__":
    main()
