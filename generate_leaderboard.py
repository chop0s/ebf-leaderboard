import firebase_admin
from firebase_admin import credentials, db
import os

cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.environ["FIREBASE_PROJECT_ID"],
    "client_email": os.environ["FIREBASE_CLIENT_EMAIL"],
    "private_key": os.environ["FIREBASE_PRIVATE_KEY"].replace("\\n", "\n"),
    "token_uri": "https://oauth2.googleapis.com/token",
})

firebase_admin.initialize_app(cred, {
    'databaseURL': f'https://{os.environ["FIREBASE_PROJECT_ID"]}-default-rtdb.europe-west1.firebasedatabase.app/'
})

root = db.reference('/').get()
players = {}

if root:
    for auth_key, auth_data in root.items():
        if isinstance(auth_data, dict) and 'players' in auth_data:
            for steam_id, data in auth_data['players'].items():
                if isinstance(data, dict):
                    players[steam_id] = {
                        'mmr': data.get('mmr', 500),
                        'wins': data.get('wins', 0),
                        'plays': data.get('plays', 0),
                    }

# lb_1.txt — топ по MMR
by_mmr = sorted(players.items(), key=lambda x: x[1]['mmr'], reverse=True)[:100]
with open('leaderboard/lb_1.txt', 'w') as f:
    for steam_id, d in by_mmr:
        f.write(f"{steam_id},{d['mmr']},{d['plays']},{d['wins']}\n")

# lb_2.txt — топ по винрейту (минимум 5 игр)
by_wr = sorted(
    [(s, d) for s, d in players.items() if d['plays'] >= 5],
    key=lambda x: x[1]['wins'] / x[1]['plays'],
    reverse=True
)[:100]
with open('leaderboard/lb_2.txt', 'w') as f:
    for steam_id, d in by_wr:
        f.write(f"{steam_id},{d['mmr']},{d['plays']},{d['wins']}\n")

print(f"Done: {len(players)} players")
