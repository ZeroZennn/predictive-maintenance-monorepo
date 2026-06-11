import requests

queries = [
    {"q": "Kapan saja M-01 dilakukan maintenance?", "m": ["M-01"]},
    {"q": "Apa saja emergency event yang pernah terjadi pada mesin M-01?", "m": ["M-01"]},
    {"q": "Berapa total downtime mesin M-01 pada bulan Agustus 2025?", "m": ["M-01"]},
    {"q": "Apa fungsi utama mesin M-01?", "m": ["M-01"]},
    {"q": "Berapa biaya maintenance mesin M-01 pada Juli 2025?", "m": ["M-01"]}
]

for item in queries:
    payload = {
        "query": item["q"],
        "use_reranker": True,
        "use_hybrid": True,
        "machine_ids": item["m"]
    }
    try:
        resp = requests.post("http://localhost:8001/nlp/query", json=payload)
        data = resp.json()
        print(f"Q: {item['q']}")
        print(f"A: {data.get('answer', data.get('answer_text'))}")
        print("-" * 50)
    except Exception as e:
        print(f"Error for {item['q']}: {e}")
