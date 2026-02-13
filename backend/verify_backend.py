import requests
import sys
import time
import subprocess
import os

BASE_URL = "http://localhost:8000/api/v1"
HEALTH_URL = "http://localhost:8000/health"

def wait_for_server():
    print("Waiting for server to start...")
    for _ in range(10):
        try:
            response = requests.get(HEALTH_URL)
            if response.status_code == 200:
                print("Server is up!")
                return True
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
    print("Server failed to start.")
    return False

def run_tests():
    # 1. Register User
    email = f"test_{int(time.time())}@example.com"
    password = "securepassword123"
    print(f"Registering user: {email}")
    
    response = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if response.status_code != 200:
        print(f"Registration failed: {response.text}")
        return False
    user_id = response.json()["id"]
    print(f"User registered with ID: {user_id}")

    # 2. Login
    print("Logging in...")
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return False
    response_json = response.json()
    token = response_json["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful, token received.")

    # 3. Create Farm
    print("Creating Farm...")
    farm_data = {"name": "Test Farm"}
    response = requests.post(f"{BASE_URL}/farms/", json=farm_data, headers=headers)
    if response.status_code != 200:
        print(f"Create Farm failed: {response.text}")
        return False
    farm_id = response.json()["id"]
    print(f"Farm created with ID: {farm_id}")

    # 4. Get Farms
    print("Fetching Farms...")
    response = requests.get(f"{BASE_URL}/farms/", headers=headers)
    if response.status_code != 200:
        print(f"Get Farms failed: {response.text}")
        return False
    farms = response.json()
    if len(farms) == 0:
         print("No farms found!")
         return False
    print(f"Found {len(farms)} farms.")

    # 5. Create Animal
    print("Creating Animal...")
    animal_data = {
        "tag_number": "COW-001",
        "type": "Cow",
        "health_status": "Healthy",
        "vaccination_status": "Up to Date",
        "farm_id": farm_id
    }
    response = requests.post(f"{BASE_URL}/animals/", json=animal_data, headers=headers)
    if response.status_code != 200:
        print(f"Create Animal failed: {response.text}")
        return False
    animal_id = response.json()["id"]
    print(f"Animal created with ID: {animal_id}")

    # 6. Test Refresh Token
    print("Testing Refresh Token...")
    refresh_token = response_json["refresh_token"]
    response = requests.post(f"{BASE_URL}/auth/refresh?refresh_token={refresh_token}")
    if response.status_code != 200:
        print(f"Refresh Token failed: {response.text}")
        return False
    new_access_token = response.json()["access_token"]
    print("Refresh successful, new access token received.")
    headers["Authorization"] = f"Bearer {new_access_token}"

    # 7. Test Soft Delete
    print("Testing Soft Delete (Animal)...")
    response = requests.delete(f"{BASE_URL}/animals/{animal_id}", headers=headers)
    if response.status_code != 200:
        print(f"Delete Animal failed: {response.text}")
        return False
    # Validate it's gone from list
    response = requests.get(f"{BASE_URL}/animals/?farm_id={farm_id}", headers=headers)
    animals = response.json()
    if any(a["id"] == animal_id for a in animals):
        print("Soft delete failed: Animal still returned in list!")
        return False
    print("Soft delete successful: Animal removed from list.")
    
    print("Verification Successful!")
    return True

if __name__ == "__main__":
    if wait_for_server():
        success = run_tests()
        if not success:
            sys.exit(1)
        sys.exit(0)
    else:
        sys.exit(1)
