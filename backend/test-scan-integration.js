const aiService = require('./src/utils/aiService');
const fs = require('fs');

async function testIntegration() {
    console.log('🧪 Testing Complete Food Recognition Integration...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing AI Service Health...');
        const health = await aiService.healthCheck();
        console.log('✅ Health Check:', health);
        
        if (!health.aiService === 'healthy') {
            throw new Error('AI Service is not healthy');
        }

        // Test 2: Nutrition API
        console.log('\n2. Testing Nutrition API...');
        const nutrition = await aiService.getNutrition('apple');
        console.log('✅ Nutrition Data:', nutrition);

        // Test 3: Meal Recommendations
        console.log('\n3. Testing Meal Recommendations...');
        const recommendations = await aiService.getMealRecommendations('lunch', 'healthy');
        console.log('✅ Meal Recommendations:', recommendations);

        console.log('\n🎉 ALL TESTS PASSED! Integration is working correctly.');
        console.log('\n📝 Next Steps:');
        console.log('   - Start your Python AI backend: cd ai-backend && python main_food_api.py');
        console.log('   - Start your Node.js backend: cd backend && npm start');
        console.log('   - Start your React frontend: cd frontend && npm start');
        console.log('   - Visit http://localhost:3000/scan-food to test the complete feature!');

    } catch (error) {
        console.error('\n❌ Integration Test Failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Make sure Python AI backend is running on port 8000');
        console.log('   - Check that all dependencies are installed');
        console.log('   - Verify the ports match in your configuration');
    }
}

testIntegration();