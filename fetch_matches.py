import os
import json
from datetime import datetime, timedelta
import requests

# Clé API football-data.org (définie dans les secrets GitHub ou en variable d'environnement local)
API_TOKEN = os.getenv("FOOTBALL_DATA_KEY", "TON_API_KEY_ICI")

BASE_URL = "https://api.football-data.org/v4"
HEADERS = {"X-Auth-Token": API_TOKEN}

# Codes des compétitions couvertes par l'offre gratuite
COMPETITIONS = ["PL", "PD", "BL1", "SA", "FL1", "DED", "PPL", "CL"]

def get_todays_matches():
    today = datetime.now().strftime("%Y-%m-%d")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    url = f"{BASE_URL}/matches?dateFrom={today}&dateTo={tomorrow}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Erreur d'accès à l'API: {response.status_code}")
        return []
    
    data = response.json()
    return data.get("matches", [])

def calculate_gg_confidence(home_team, away_team):
    """
    Algorithme de scoring basé sur les statistiques simples 
    Renvoie la confiance GG (%) et la tendance du score.
    """
    # Exemple de logique de scoring (remplaçable par tes métriques personnalisées)
    confidence = 68  # Valeur de base
    
    # Simulation d'ajustement dynamique
    if "Bayer" in home_team or "Leverkusen" in away_team:
        confidence += 10
    if "City" in home_team or "Real" in away_team:
        confidence += 8
        
    confidence = min(92, max(60, confidence))
    return confidence

def build_data_json():
    matches = get_todays_matches()
    formatted_matches = []

    for match in matches:
        home = match["homeTeam"]["name"]
        away = match["awayTeam"]["name"]
        league = match["competition"]["name"]
        utc_date = match["utcDate"]
        match_time = datetime.strptime(utc_date, "%Y-%m-%dT%H:%M:%SZ").strftime("%H:%M")

        confidence = calculate_gg_confidence(home, away)

        # Filtrage : On garde uniquement les prédictions avec une confiance >= 65%
        if confidence >= 65:
            formatted_matches.append({
                "id": match["id"],
                "time": match_time,
                "league": league,
                "homeTeam": home,
                "awayTeam": away,
                "prediction": "GG (BTTS)",
                "expectedScore": "2-1",
                "confidence": f"{confidence}%",
                "selected": True
            })

    # Export vers public/data.json pour être lu directement par React sur Vercel
    os.makedirs("public", exist_ok=True)
    with open("public/data.json", "w", encoding="utf-8") as f:
        json.dump({"lastUpdated": datetime.now().isoformat(), "matches": formatted_matches}, f, indent=2)

    print(f"✅ {len(formatted_matches)} matchs enregistrés dans public/data.json")

if __name__ == "__main__":
    build_data_json()
