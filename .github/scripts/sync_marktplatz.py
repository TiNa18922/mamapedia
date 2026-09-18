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
    "Tauschen": "swap",
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
        
        listing_type = TYPE_MAP.get(row.get("Inseratstyp", "").strip(), "sell")
        item = {
            "id": str(i + 1),
            "type": listing_type,
            "emoji": get_emoji(row.get("Kategorie", "")),
            "name": row.get("Artikelname", "").strip(),
            "category": row.get("Kategorie", "").strip(),
            "condition": row.get("Zustand", "").strip(),
            "stadtteil": row.get("Stadtteil", "").strip(),
            "contactEmail": (row.get("E-Mail-Adresse") or row.get("Email") or "").strip(),
            "createdAt": row.get("时间戳记", "").strip(),
            "status": "active",
        }
        if listing_type == "sell":
            preis = row.get("Preis", "").strip().replace("€", "").replace(",", ".")
            try:
                item["priceEur"] = float(preis) if preis else None
            except ValueError:
                item["priceEur"] = None
        elif listing_type == "swap":
            item["swapWanted"] = (row.get("Tausch") or row.get("Suche im Tausch") or "").strip()
        elif listing_type == "free":
            item["pickup"] = row.get("Abholung", "").strip() or "Selbstabholung"
        required = [item.get("type"), item.get("name"), item.get("category"), item.get("condition"), item.get("stadtteil"), item.get("contactEmail")]
        if not all(required):
            continue
        if listing_type == "sell" and item.get("priceEur") is None:
            continue
        if listing_type == "swap" and not item.get("swapWanted"):
            continue
        if listing_type == "free" and not item.get("pickup"):
            continue
        items.append(item)
    
    with open("marktplatz_data.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Synced {len(items)} items to marktplatz_data.json")

if __name__ == "__main__":
    main()
