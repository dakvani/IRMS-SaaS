import urllib.request
import json
import random

req = urllib.request.Request(
    'http://localhost:3000/api/sites', 
    headers={'Authorization': 'Bearer test'}
)

try:
    with urllib.request.urlopen(req) as res:
        sites = json.loads(res.read().decode())
        print(sites)
except Exception as e:
    print(e)
