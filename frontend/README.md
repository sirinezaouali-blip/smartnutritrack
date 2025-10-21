# SmartNutritrack Frontend

A comprehensive React.js frontend for intelligent nutrition management with AI-powered features, mobile-first design, and real-time data integration.

## 🚀 Features

- **Authentication System**: Complete user registration, login, and email verification
- **7-Step Onboarding**: Personalized setup with health metrics calculation
- **AI-Powered Food Recognition**: Scan dishes, fruits/vegetables, and barcodes
- **Smart Meal Planning**: Single, daily, and multiple meal planners with AI recommendations
- **Real-time Analytics**: Progress tracking with interactive charts
- **Responsive Design**: Mobile-first approach with touch-friendly interface
- **Multi-language Support**: English, French, Arabic, German, Italian
- **Dark/Light Theme**: User preference with system detection
- **No Static Data**: All data retrieved from MongoDB via backend APIs

## 🛠️ Technology Stack

- **Framework**: React.js with React Router DOM
- **Styling**: CSS Modules with design system
- **State Management**: React Context API
- **HTTP Client**: Axios for API communication
- **Icons**: React Icons library
- **Form Handling**: Formik with Yup validation
- **Charts**: Chart.js for analytics visualization
- **Image Processing**: React Dropzone for file uploads
- **Internationalization**: React-i18next

## 📁 Project Structure

```
src/
├── components/                 # Reusable UI components
│   ├── common/                # Shared components
│   │   ├── Header/
│   │   ├── ProgressCard/
│   │   ├── MealItem/
│   │   └── LoadingSpinner/
│   └── layout/                # Layout components
├── pages/                     # Main application pages
│   ├── auth/                  # Authentication pages
│   ├── onboarding/            # 7-step onboarding process
│   ├── dashboard/             # Main dashboard
│   ├── meal-planner/          # Meal planning features
│   ├── scan-food/             # Food scanning features
│   ├── add-meal/              # Manual meal entry
│   ├── analytics/             # Progress tracking
│   ├── profile/               # User profile management
│   ├── social/                # Community features
│   ├── settings/              # App settings
│   └── meal-history/          # Meal tracking history
├── contexts/                  # React Contexts for state management
├── services/                  # API communication services
├── utils/                     # Helper functions and utilities
└── hooks/                     # Custom React hooks
```

## 🎨 Design System

### Color Palette
- **Primary Green**: #4CAF50
- **Secondary Green**: #388E3C
- **Light Green**: #E8F5E8
- **Dark Green**: #2E7D32
- **Error**: #F44336
- **Warning**: #FF9800
- **Success**: #4CAF50

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700
- **Responsive Scaling**: Fluid typography using clamp()

### Layout Breakpoints
- **Small**: 576px
- **Medium**: 768px
- **Large**: 992px
- **Extra Large**: 1200px

## 🔧 Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file in the root directory:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000
   REACT_APP_AI_BASE_URL=http://localhost:8000
   REACT_APP_ENVIRONMENT=development
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🔌 Backend Integration

The frontend integrates with two backend services:

1. **Node.js Backend** (Port 5000)
   - Main application server
   - User authentication and management
   - Meal database and planning
   - Analytics and progress tracking

2. **Python AI Backend** (Port 8000)
   - Food recognition using MobileNetV2
   - Barcode scanning with OpenCV
   - Nutrition data from USDA API
   - Meal recommendations with ChromaDB

## 📱 Key Features

### Authentication Flow
- User registration with comprehensive validation
- Email verification with 6-digit code
- Secure login with JWT tokens
- Password strength indicators
- Remember me functionality

### Onboarding Process
1. **Welcome**: App introduction and benefits
2. **Basic Info**: Age, height, weight, gender, goals
3. **Medical**: Conditions, allergies, dietary restrictions
4. **Preferences**: Diet type, disliked foods, cuisine preferences
5. **Lifestyle**: Activity level, sports, budget
6. **Review**: Summary with health metrics calculation
7. **Confirmation**: Success and redirect to dashboard

### Dashboard Features
- Real-time progress cards (calories, protein, carbs, fats)
- Quick action buttons for common tasks
- Today's meal history with edit/delete options
- Recent meals from the past week
- Dynamic data from MongoDB (no static data)

### Meal Planning
- **Single Meal Planner**: Get recommendations for one meal
- **Daily Meal Planner**: Complete day meal plan
- **Multiple Meal Planner**: 3 variation options
- AI-powered recommendations based on user preferences
- Dynamic calorie calculations

### Food Scanning
- **Dish Scanning**: Complex prepared meals with MobileNetV2
- **Fruits & Vegetables**: Produce items with custom CNN
- **Barcode Scanning**: Product lookup with Open Food Facts
- Real-time nutrition data integration
- Confirmation flow with meal addition

### Analytics & Tracking
- Interactive charts with Chart.js
- Daily, weekly, monthly views
- Progress towards goals
- Nutrient balance analysis
- Export functionality

## 🌐 Internationalization

Supported languages:
- English (en)
- French (fr)
- Arabic (ar)
- German (de)
- Italian (it)

Language switching with flag indicators and persistent storage.

## 🎯 Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Responsive images with multiple sizes
- **API Caching**: Intelligent data caching strategies
- **Bundle Optimization**: Tree shaking and minimal dependencies
- **PWA Ready**: Service worker and manifest configuration

## 🔒 Security Features

- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Sanitized inputs and outputs
- **CSRF Protection**: Token-based requests
- **Secure Storage**: Encrypted local storage
- **Password Security**: Bcrypt hashing with salt

## 📊 State Management

### Context Providers
- **AuthContext**: User authentication state
- **UserContext**: User profile and preferences
- **ThemeContext**: Application theme management
- **LanguageContext**: Internationalization support

### Data Flow
- Real-time API communication with Node.js backend
- Error handling with user-friendly messages
- Loading states with visual feedback
- Optimistic updates for better UX

## 🧪 Testing Strategy

- **Unit Tests**: Component functionality testing
- **Integration Tests**: API communication testing
- **E2E Tests**: User workflow testing
- **Accessibility Tests**: Screen reader and keyboard navigation

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```env
REACT_APP_API_BASE_URL=https://your-api-domain.com
REACT_APP_AI_BASE_URL=https://your-ai-api-domain.com
REACT_APP_ENVIRONMENT=production
```

### CDN Ready
- Minified and optimized assets
- Static asset optimization
- SEO optimization with meta tags

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Core functionality on all browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the backend integration guide
- Test with the provided API endpoints
- Ensure both backend services are running

---

**SmartNutritrack Frontend** - Built with ❤️ for healthy living




