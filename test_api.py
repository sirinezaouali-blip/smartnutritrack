import requests
import json

# Test the API with fallback logic
url = 'http://localhost:5001/api/meal-plan'
headers = {'Content-Type': 'application/json'}

test_cases = [
    {'user_input': 'already had breakfast, need lunch and dinner ideas', 'user_profile': {'target_calories': 2000}},
    {'user_input': 'I want chicken for lunch and salad for dinner', 'user_profile': {'target_calories': 2000}},
    {'user_input': 'want something healthy for dinner', 'user_profile': {'target_calories': 2000}}
]

for i, data in enumerate(test_cases, 1):
    print(f'\n🧪 API TEST {i}: {data["user_input"]}')
    print('=' * 50)
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=120)
        print(f'Status Code: {response.status_code}')
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                print('✅ SUCCESS!')
                parsed = result['data']['parsed_input']
                caloric = result['data']['caloric_plan']
                plan = result['data']['meal_plan']
                
                print(f'📝 Intent: {parsed["user_intent"]}')
                print(f'🍽️  Meals to plan: {parsed["meals_to_plan"]}')
                print(f'📊 Remaining calories: {caloric["remaining_target"]}')
                print(f'📋 Plan preview: {plan[:300]}...' if len(plan) > 300 else f'📋 Plan: {plan}')
            else:
                print(f'❌ API Error: {result.get("message", "Unknown error")}')
        else:
            print(f'❌ HTTP Error: {response.status_code}')
            print(f'Response: {response.text}')
            
    except Exception as e:
        print(f'❌ Request failed: {e}')