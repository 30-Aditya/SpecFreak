import requests
import json

url = "http://127.0.0.1:5000/recommend"
payload = {"query": "Zelda"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        results = response.json().get('results', [])
        print(f"Number of results: {len(results)}")
        if results:
            print(f"First result: {results[0]['name']}")
    else:
        print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
