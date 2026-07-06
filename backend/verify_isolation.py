import sys
import httpx

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("LifeReel AI – Per-User Isolation Verification Script")
print("=" * 60)

# Clean up or prepare unique emails
import uuid
uid = str(uuid.uuid4())[:8]
email_a = f"usera_{uid}@test.com"
email_b = f"userb_{uid}@test.com"
password = "password123"

# 1. Register User A
print("\n1. Registering User A...")
reg_a_resp = httpx.post(f"{BASE_URL}/api/auth/register", json={
    "username": "User A",
    "email": email_a,
    "password": password
})
print(f"   Status: {reg_a_resp.status_code}")
assert reg_a_resp.status_code == 201
user_a = reg_a_resp.json()
print(f"   Registered: {user_a['username']} ({user_a['email']}) with ID: {user_a['id']}")

# 2. Register User B
print("\n2. Registering User B...")
reg_b_resp = httpx.post(f"{BASE_URL}/api/auth/register", json={
    "username": "User B",
    "email": email_b,
    "password": password
})
print(f"   Status: {reg_b_resp.status_code}")
assert reg_b_resp.status_code == 201
user_b = reg_b_resp.json()
print(f"   Registered: {user_b['username']} ({user_b['email']}) with ID: {user_b['id']}")

# 3. Login User A
print("\n3. Logging in User A...")
login_a_resp = httpx.post(f"{BASE_URL}/api/auth/login", json={
    "email": email_a,
    "password": password
})
print(f"   Status: {login_a_resp.status_code}")
assert login_a_resp.status_code == 200
token_a = login_a_resp.json()["access_token"]
headers_a = {"Authorization": f"Bearer {token_a}"}
print("   Token A successfully received.")

# 4. Login User B
print("\n4. Logging in User B...")
login_b_resp = httpx.post(f"{BASE_URL}/api/auth/login", json={
    "email": email_b,
    "password": password
})
print(f"   Status: {login_b_resp.status_code}")
assert login_b_resp.status_code == 200
token_b = login_b_resp.json()["access_token"]
headers_b = {"Authorization": f"Bearer {token_b}"}
print("   Token B successfully received.")

# 5. User A creates memory
print("\n5. User A creating a text memory...")
mem_a_resp = httpx.post(f"{BASE_URL}/api/entries/generate", headers=headers_a, json={
    "raw_text": "Today User A did some verification coding. It was very productive."
}, timeout=60.0)
print(f"   Status: {mem_a_resp.status_code}")
assert mem_a_resp.status_code == 201
entry_a = mem_a_resp.json()
entry_a_id = entry_a["id"]
print(f"   Created memory ID: {entry_a_id} (Title: {entry_a['title']})")

# 6. User B creates memory
print("\n6. User B creating a text memory...")
mem_b_resp = httpx.post(f"{BASE_URL}/api/entries/generate", headers=headers_b, json={
    "raw_text": "Today User B drank some delicious coffee. It was relaxing."
}, timeout=60.0)
print(f"   Status: {mem_b_resp.status_code}")
assert mem_b_resp.status_code == 201
entry_b = mem_b_resp.json()
entry_b_id = entry_b["id"]
print(f"   Created memory ID: {entry_b_id} (Title: {entry_b['title']})")

# 7. Check Timeline Isolation
print("\n7. Checking timeline isolation...")
timeline_a_resp = httpx.get(f"{BASE_URL}/api/entries/timeline", headers=headers_a)
assert timeline_a_resp.status_code == 200
timeline_a_ids = [e["id"] for e in timeline_a_resp.json()["timeline"]]
print(f"   User A Timeline Entry IDs: {timeline_a_ids}")
assert entry_a_id in timeline_a_ids
assert entry_b_id not in timeline_a_ids
print("   [OK] User A ONLY sees User A's memories.")

timeline_b_resp = httpx.get(f"{BASE_URL}/api/entries/timeline", headers=headers_b)
assert timeline_b_resp.status_code == 200
timeline_b_ids = [e["id"] for e in timeline_b_resp.json()["timeline"]]
print(f"   User B Timeline Entry IDs: {timeline_b_ids}")
assert entry_b_id in timeline_b_ids
assert entry_a_id not in timeline_b_ids
print("   [OK] User B ONLY sees User B's memories.")

# 8. Check Details Security (Cross-User Access)
print("\n8. Checking details security (cross-user access)...")
get_cross_resp = httpx.get(f"{BASE_URL}/api/entries/{entry_b_id}", headers=headers_a)
print(f"   User A trying to get User B memory details status: {get_cross_resp.status_code}")
assert get_cross_resp.status_code == 403
print("   [OK] Access Forbidden successfully returned (HTTP 403).")

get_own_resp = httpx.get(f"{BASE_URL}/api/entries/{entry_a_id}", headers=headers_a)
print(f"   User A getting User A memory details status: {get_own_resp.status_code}")
assert get_own_resp.status_code == 200
print("   [OK] Owner access permitted successfully (HTTP 200).")

# 9. Check Deletion Security (Cross-User Delete)
print("\n9. Checking deletion security (cross-user delete)...")
del_cross_resp = httpx.delete(f"{BASE_URL}/api/entries/{entry_b_id}", headers=headers_a)
print(f"   User A trying to delete User B memory status: {del_cross_resp.status_code}")
assert del_cross_resp.status_code == 403
print("   [OK] Deletion Forbidden successfully returned (HTTP 403).")

del_own_resp = httpx.delete(f"{BASE_URL}/api/entries/{entry_a_id}", headers=headers_a)
print(f"   User A deleting User A memory status: {del_own_resp.status_code}")
assert del_own_resp.status_code == 200
print("   [OK] Owner deletion permitted and completed successfully (HTTP 200).")

print("\n" + "=" * 60)
print("SUCCESS: ALL PER-USER ISOLATION TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
