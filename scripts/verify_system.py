import requests
import time
import sys

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_health():
    print("Testing Backend Health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✓ Backend is healthy")
            return True
        else:
            print(f"✗ Backend health check failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Backend unreachable: {e}")
    return False

def test_metrics():
    print("\nTesting Prometheus Metrics...")
    try:
        response = requests.get(f"{BASE_URL}/metrics")
        if response.status_code == 200 and "http_requests_total" in response.text:
            print("✓ Prometheus metrics are flowing")
            return True
        else:
            print("✗ Metrics endpoint returned invalid data")
    except Exception as e:
        print(f"✗ Metrics unreachable: {e}")
    return False

def test_caching():
    print("\nTesting Weather Caching (Integration)...")
    coords = {"lat": -17.82, "lon": 31.05} # Harare
    try:
        # First call (Miss)
        print("First call (expecting MISS)...")
        start_time = time.time()
        requests.get(f"{BASE_URL}/weather", params=coords)
        first_duration = time.time() - start_time
        
        # Second call (Hit)
        print("Second call (expecting HIT)...")
        start_time = time.time()
        requests.get(f"{BASE_URL}/weather", params=coords)
        second_duration = time.time() - start_time
        
        print(f"First duration: {first_duration:.4f}s, Second duration: {second_duration:.4f}s")
        if second_duration < first_duration:
            print("✓ Caching appears to be working (faster response)")
            return True
        else:
            print("! Caching inconclusive (durations similar)")
    except Exception as e:
        print(f"✗ Caching test failed: {e}")
    return False

def test_async_tasks():
    print("\nTesting Async Tasks (Report Generation)...")
    # Need to login first or use a testing token if auth is enabled
    # Assuming for this test we might need credentials
    auth_data = {"username": "test@example.com", "password": "password123"}
    try:
        # 1. Login
        login_res = requests.post(f"{BASE_URL}/api/v1/auth/login", data=auth_data)
        if login_res.status_code != 200:
            print("! Login failed, skipping auth-protected tests")
            return False
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Trigger Task
        print("Triggering mock report...")
        trigger_res = requests.post(f"{BASE_URL}/api/v1/tasks/mock-report", headers=headers)
        if trigger_res.status_code == 200:
            task_id = trigger_res.json()["task_id"]
            print(f"✓ Task triggered successfully. Task ID: {task_id}")
            return True
        else:
            print(f"✗ Task trigger failed: {trigger_res.text}")
    except Exception as e:
        print(f"✗ Async task test failed: {e}")
    return False

if __name__ == "__main__":
    print("=== MooMetrics Enterprise Stack Verification ===\n")
    if not test_health():
        print("\nVerification aborted: Stack is not running or unreachable.")
        sys.exit(1)
    
    test_metrics()
    test_caching()
    test_async_tasks()
    print("\n=== Verification Complete ===")
