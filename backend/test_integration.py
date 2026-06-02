import requests
import time
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("🚀 Starting ELD Trip Planner API Tests...\n")
    
    # Wait for server to be ready
    for _ in range(5):
        try:
            requests.get("http://localhost:8000/health/")
            break
        except requests.ConnectionError:
            time.sleep(1)

    passed = 0
    failed = 0

    # 1. Test Chatbot Endpoint
    print("Testing 1: AI Chatbot Endpoint (RAG Pipeline + OpenRouter)")
    try:
        resp = requests.post(
            f"{BASE_URL}/ai/chat/",
            json={"message": "What is the 30-minute break rule?", "session_id": "test-session-1"}
        )
        if resp.status_code == 200:
            data = resp.json()
            if "response" in data and len(data["response"]) > 10:
                print("✅ PASSED: Chatbot answered successfully.")
                print(f"   🤖 AI Reply snippet: {data['response'][:100]}...\n")
                passed += 1
            else:
                print("❌ FAILED: Invalid response format from chatbot.\n")
                failed += 1
        else:
            print(f"❌ FAILED: Chatbot returned HTTP {resp.status_code}\n")
            failed += 1
    except Exception as e:
        print(f"❌ FAILED: Exception testing chatbot: {e}\n")
        failed += 1

    # 2. Test Trip Calculation
    print("Testing 2: Route & HOS Calculation Endpoint")
    try:
        resp = requests.post(
            f"{BASE_URL}/trips/calculate/",
            json={
                "current_location": "Chicago, IL",
                "pickup_location": "Detroit, MI",
                "dropoff_location": "Toledo, OH",
                "current_cycle_used": 60.0,
                "driver_name": "Test Driver"
            }
        )
        if resp.status_code == 200:
            data = resp.json()
            if "route" in data and "compliance" in data and "eld_logs" in data:
                print("✅ PASSED: Trip calculated successfully.")
                print(f"   🗺️ Distance: {data['route']['distance_mi']:.1f} miles")
                print(f"   ⏱️ Drive Time: {data['route']['duration_hr']:.1f} hours")
                print(f"   🛡️ Compliant: {data['compliance']['is_compliant']}")
                print(f"   📄 ELD Logs Generated: {len(data['eld_logs'])} day(s)\n")
                passed += 1
            else:
                print("❌ FAILED: Missing required data in trip response.\n")
                failed += 1
        else:
            print(f"❌ FAILED: Trip calculate returned HTTP {resp.status_code}\n")
            failed += 1
    except Exception as e:
        print(f"❌ FAILED: Exception testing trip calculation: {e}\n")
        failed += 1

    # 3. Test Trip List (MongoDB fallback logic)
    print("Testing 3: Trip History List Endpoint")
    try:
        resp = requests.get(f"{BASE_URL}/trips/list/")
        if resp.status_code == 200:
            data = resp.json()
            if "trips" in data:
                print("✅ PASSED: Trip history retrieved successfully.")
                print(f"   📚 Found {len(data['trips'])} trips in history.\n")
                passed += 1
            else:
                print("❌ FAILED: Invalid response format from history.\n")
                failed += 1
        else:
            print(f"❌ FAILED: Trip history returned HTTP {resp.status_code}\n")
            failed += 1
    except Exception as e:
        print(f"❌ FAILED: Exception testing trip history: {e}\n")
        failed += 1

    print("========================================")
    print(f"🏁 Test Summary: {passed} Passed, {failed} Failed")
    print("========================================")

if __name__ == "__main__":
    test_api()
