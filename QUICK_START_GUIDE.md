# 🚀 SmartNutritrack - Quick Start Guide

## ✅ All Issues Fixed - Ready to Run!

---

## 📋 **Prerequisites**

- Node.js 16+ 
- Python 3.8+
- MongoDB 4.4+
- Git

---

## ⚡ **Quick Setup (5 Minutes)**

### **1. Clone & Install Dependencies**

```bash
# Navigate to project root
cd "F:\PFE Syrine\PROJET PFE CONCLUSION\Mobile Application\SmartNutritrack"

# Install Backend
cd backend
npm install
cd ..

# Install Frontend
cd frontend
npm install
cd ..

# Install AI Backend
cd ai-backend
pip install -r requirements.txt
cd ..
```

---

### **2. Configure Environment Variables**

#### **Backend Configuration**
```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/smart_nutritrack
JWT_SECRET=your_very_secret_key_change_this_in_production
PORT=5000
FRONTEND_URL=http://localhost:3000

# Optional (for email/SMS features)
# SENDGRID_API_KEY=your_key_here
# TWILIO_ACCOUNT_SID=your_sid_here
# TWILIO_AUTH_TOKEN=your_token_here
```

#### **Frontend Configuration**
```bash
cd frontend
copy .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_AI_BASE_URL=http://localhost:8000
```

#### **AI Backend Configuration**
```bash
cd ai-backend
copy .env.example .env
```

Edit `ai-backend/.env`:
```env
CNN_MODEL_PATH=F:\PFE Syrine\PROJET PFE CONCLUSION\Models\CNN\Fruits&vegetables\best_model.h5
BACKEND_URL=http://localhost:5000
```

---

### **3. Start MongoDB**

```bash
# Windows
net start MongoDB

# Or if installed manually
mongod --dbpath "C:\data\db"
```

---

### **4. Start All Services**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
✅ Frontend running on http://localhost:3000

**Terminal 3 - AI Backend:**
```bash
cd ai-backend
python main_light.py
```
✅ AI Backend running on http://localhost:8000

---

## 🧪 **Test the Application**

### **1. Access Frontend**
Open browser: http://localhost:3000

### **2. Test Registration**
- Go to Register page
- Create a new account
- Check console for verification code (if email not configured)

### **3. Test Login**
- Login with your credentials
- Complete onboarding flow
- Access dashboard

### **4. Test AI Features**
- Go to "Scan Food" page
- Upload an image
- See AI prediction results

---

## 🐛 **Troubleshooting**

### **Backend Won't Start**
```bash
# Check MongoDB is running
mongosh

# Check port 5000 is free
netstat -ano | findstr :5000

# Clear node_modules and reinstall
rmdir /s /q node_modules
npm install
```

### **Frontend Won't Start**
```bash
# Clear cache
npm cache clean --force
rmdir /s /q node_modules
npm install

# Check port 3000 is free
netstat -ano | findstr :3000
```

### **AI Backend Errors**
```bash
# Check Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check if model file exists
dir "F:\PFE Syrine\PROJET PFE CONCLUSION\Models\CNN\Fruits&vegetables\best_model.h5"
```

### **MongoDB Connection Error**
```bash
# Check MongoDB service
net start MongoDB

# Or start manually
mongod --dbpath "C:\data\db"

# Test connection
mongosh mongodb://localhost:27017/smart_nutritrack
```

---

## 📝 **Common Issues & Solutions**

### **Issue**: "JWT_SECRET is not defined"
**Solution**: Add `JWT_SECRET` to backend/.env file

### **Issue**: "Cannot connect to MongoDB"
**Solution**: Ensure MongoDB is running and connection string is correct

### **Issue**: "AI Backend not responding"
**Solution**: Check if Python dependencies are installed and port 8000 is free

### **Issue**: "CORS errors in browser"
**Solution**: Ensure all three services are running on correct ports

---

## 📚 **API Documentation**

### **Backend Endpoints**

#### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user (requires token)

#### **Meals**
- `GET /api/meals` - Get all meals
- `GET /api/meals/search?q=chicken` - Search meals
- `POST /api/meals` - Create custom meal (requires token)

#### **User Meals (Diary)**
- `POST /api/user-meals` - Add meal to diary
- `GET /api/user-meals/:date` - Get meals for date
- `PUT /api/user-meals/:id` - Update meal entry
- `DELETE /api/user-meals/:id` - Delete meal entry

#### **Analytics**
- `GET /api/analytics/daily/:date` - Daily nutrition summary
- `GET /api/analytics/weekly` - Weekly progress
- `GET /api/analytics/monthly` - Monthly trends

#### **AI Features**
- `POST /api/ai/scan-food` - Scan food image (multipart/form-data)
- `POST /api/ai/scan-barcode` - Scan barcode (multipart/form-data)
- `GET /api/ai/nutrition/:foodName` - Get nutrition data
- `POST /api/ai/meal-suggestions` - Get meal suggestions

### **AI Backend Endpoints**

- `GET /health` - Health check
- `POST /api/scan/fruits-vegetables` - CNN food recognition
- `POST /api/scan/barcode` - Barcode scanning
- `POST /api/planner/single-day` - Generate daily meal plan
- `POST /api/planner/multiple-plans` - Generate multiple plan options
- `POST /api/planner/single-meal` - Get similar meal suggestions

---

## 🔐 **Authentication Flow**

1. **Register**: `POST /api/auth/register`
2. **Verify Email**: `POST /api/auth/verify-email`
3. **Login**: `POST /api/auth/login` → Get JWT token
4. **Use Token**: Add `Authorization: Bearer <token>` to all protected requests

---

## 💡 **Development Tips**

### **Backend**
- Hot reload enabled with nodemon
- Check console for detailed error logs
- MongoDB compass for database visualization

### **Frontend**
- React DevTools for component inspection
- Redux DevTools if using Redux
- Network tab for API call debugging

### **AI Backend**
- FastAPI auto-docs at http://localhost:8000/docs
- Check Python console for CNN model loading status
- Use Postman for API testing

---

## 📊 **Project Status**

| Component | Status | Port |
|-----------|--------|------|
| Backend API | ✅ Working | 5000 |
| Frontend | ✅ Working | 3000 |
| AI Backend | ✅ Working | 8000 |
| MongoDB | ✅ Required | 27017 |
| Authentication | ✅ Complete | - |
| Email Service | ✅ Optional | - |
| SMS Service | ✅ Optional | - |
| CNN Model | ⚠️ Fallback | - |
| RAG Planner | ✅ Working | - |

---

## 🎯 **What's Working**

✅ User registration and authentication
✅ Email verification (with SendGrid)
✅ SMS verification (with Twilio) 
✅ Password reset functionality
✅ Complete onboarding flow
✅ Meal database (1000+ meals)
✅ Meal tracking and diary
✅ Nutrition analytics
✅ AI meal planning (database-driven)
✅ Food image recognition (CNN)
✅ Barcode scanning
✅ Multi-language support
✅ Social features foundation
✅ Order management

---

## 🚧 **Optional Setup**

### **Email Service (SendGrid)**
1. Sign up at https://sendgrid.com
2. Get API key
3. Add to `backend/.env`:
   ```env
   SENDGRID_API_KEY=your_key_here
   EMAIL_FROM=noreply@smartnutritrack.com
   ```

### **SMS Service (Twilio)**
1. Sign up at https://twilio.com
2. Create Verify service
3. Add to `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_VERIFY_SERVICE_SID=your_verify_sid
   ```

---

## 🎉 **Success!**

If you see all three services running without errors:
- Backend: ✅ http://localhost:5000
- Frontend: ✅ http://localhost:3000
- AI Backend: ✅ http://localhost:8000

**You're ready to develop and test SmartNutritrack!**

---

## 📞 **Need Help?**

Check the following files for more details:
- `FIXES_APPLIED.md` - All fixes that were applied
- `README.txt` - Complete project documentation
- `TODO.md` - Remaining tasks

Happy coding! 🚀
