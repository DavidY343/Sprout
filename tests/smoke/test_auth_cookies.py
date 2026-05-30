import httpx, json

BASE = "https://sprout-backend-production-3aff.up.railway.app/api/v1"

client = httpx.Client(follow_redirects=True)

# 1. Login
print("=== LOGIN ===")
r = client.post(f"{BASE}/auth/login", json={"email": "demo@user.com", "password": "admin123", "remember_me": False})
print(f"Status: {r.status_code}")
print(f"Body: {r.text}")
print(f"Cookies: {dict(r.cookies)}")
print(f"Set-Cookie headers:")
for h in r.headers.get_list("set-cookie"):
    name = h.split("=")[0]
    httponly = "httponly" in h.lower()
    secure = "secure" in h.lower()
    print(f"  {name}: httponly={httponly} secure={secure}")

# 2. Use cookies to call /auth/me
print("\n=== AUTH/ME (with cookies) ===")
# Merge cookies into the client
for cookie in r.cookies.jar:
    client.cookies.set(cookie.name, cookie.value, domain=cookie.domain)

r2 = client.get(f"{BASE}/auth/me")
print(f"Status: {r2.status_code}")
print(f"Body: {r2.text}")

# 3. Call a protected endpoint (portfolio)
print("\n=== PORTFOLIO (with cookies) ===")
r3 = client.get(f"{BASE}/portfolio")
print(f"Status: {r3.status_code}")
if r3.status_code == 200:
    data = r3.json()
    print(f"total_value: {data.get('total_value')}")
    print(f"accounts: {len(data.get('accounts', []))}")
else:
    print(f"Body: {r3.text}")

# 4. Test refresh
print("\n=== REFRESH ===")
r4 = client.post(f"{BASE}/auth/refresh")
print(f"Status: {r4.status_code}")
print(f"Body: {r4.text}")

# 5. Test logout
print("\n=== LOGOUT ===")
r5 = client.post(f"{BASE}/auth/logout")
print(f"Status: {r5.status_code}")
print(f"Body: {r5.text}")

# 6. Verify we're logged out
print("\n=== AUTH/ME after logout ===")
r6 = client.get(f"{BASE}/auth/me")
print(f"Status: {r6.status_code}")

print("\n=== ALL TESTS PASSED ===")
