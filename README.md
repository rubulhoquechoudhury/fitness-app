# NutriTracker - Personal Nutrition & Fitness Assistant

A comprehensive web application that helps users track their daily nutrition, physical activities, and calorie intake while providing personalized recommendations based on their health profile and goals.

## Features

### 🔐 User Authentication
- User registration with comprehensive health profile
- Secure login system
- Personal health information storage (age, weight, height, gender, activity level, health conditions)

### 📊 Dashboard & Analytics
- Real-time calorie tracking with visual progress bars
- Daily activity summary with calories burned
- Calorie balance analysis (deficit/surplus)
- Personalized recommendations based on health profile
- Visual representation of nutrition goals vs. actual intake

### 🏃‍♂️ Activity Tracking
- Log various physical activities (running, walking, cycling, swimming, strength training, yoga, dancing)
- Activity intensity levels (low, moderate, high)
- Automatic calorie burn calculation using METs (Metabolic Equivalent of Task) values
- Historical activity tracking

### 🍎 Food & Nutrition Tracking
- Comprehensive food database with nutritional information
- Smart food search with autocomplete suggestions
- Detailed nutritional breakdown (calories, protein, carbs, fat, fiber)
- Meal categorization (breakfast, lunch, dinner, snacks)
- Portion tracking in grams
- Visual meal history organized by meal type

### 🧮 Calorie Calculation Engine
- **BMR (Basal Metabolic Rate)** calculation using Mifflin-St Jeor Equation
- **TDEE (Total Daily Energy Expenditure)** based on activity level
- Dynamic calorie needs adjustment based on logged activities
- Real-time calorie balance tracking

### 💡 Smart Recommendations
- Personalized food recommendations based on calorie deficiency
- Activity suggestions for calorie surplus
- Health condition-specific dietary guidance
- Nutritional balance recommendations

### 📱 Modern UI/UX
- Responsive design for desktop and mobile devices
- Beautiful gradient backgrounds and smooth animations
- Interactive components with hover effects
- Toast notifications for user feedback
- Loading states and progress indicators

## Technology Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database storage
- **Werkzeug** - Password hashing and security

### Frontend
- **HTML5** - Structure and semantics
- **CSS3** - Styling with modern features (Grid, Flexbox, Animations)
- **JavaScript (ES6+)** - Dynamic functionality and API integration
- **Font Awesome** - Icon library
- **Google Fonts** - Typography (Poppins)

### Key Algorithms
- **Mifflin-St Jeor Equation** for BMR calculation
- **METs values** for activity calorie burn calculation
- **Nutritional database** with macro and micronutrient data

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Quick Start

1. **Clone or download the application files**
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Open your web browser and navigate to:**
   ```
   http://localhost:5000
   ```

## Usage Guide

### Getting Started

1. **Registration:**
   - Create a new account with username and email
   - Complete your health profile (age, weight, height, gender)
   - Select your activity level
   - Optionally specify any health conditions

2. **Dashboard Overview:**
   - View your daily calorie progress
   - Check activity summary
   - Monitor calorie balance
   - Review personalized recommendations

### Tracking Activities

1. Navigate to the **Activities** section
2. Select activity type from the dropdown
3. Enter duration in minutes
4. Choose intensity level
5. Click "Log Activity" to record

**Available Activities:**
- Walking, Running, Cycling
- Swimming, Strength Training
- Yoga, Dancing

### Logging Food Intake

1. Go to the **Food Log** section
2. Start typing in the food search box
3. Select from the suggested foods
4. Enter quantity in grams
5. Choose meal type
6. Click "Log Food" to record

**Food Database Includes:**
- Fruits (apple, banana, etc.)
- Proteins (chicken breast, salmon, eggs)
- Grains (brown rice, oatmeal)
- Vegetables (broccoli, spinach, sweet potato)
- Dairy (Greek yogurt)
- Nuts (almonds)

### Understanding Recommendations

The app provides intelligent recommendations based on:
- **Calorie Deficit (>200 cal):** Suggests nutritious high-calorie foods
- **Calorie Surplus (>200 cal):** Recommends light physical activities
- **Health Conditions:** Provides condition-specific dietary advice
  - Diabetes: Low glycemic foods
  - Heart Disease: Omega-3 rich foods

### Profile Management

View your complete profile including:
- Personal information
- BMR and TDEE calculations
- Total daily calorie needs
- Health conditions

## Calorie Calculation Details

### BMR (Basal Metabolic Rate)
- **Male:** BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
- **Female:** BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

### TDEE (Total Daily Energy Expenditure)
- **Sedentary:** BMR × 1.2
- **Lightly Active:** BMR × 1.375
- **Moderately Active:** BMR × 1.55
- **Very Active:** BMR × 1.725
- **Extremely Active:** BMR × 1.9

### Activity Calories
Calculated using METs formula:
```
Calories per minute = (METs × weight(kg) × 3.5) / 200
Total calories = Calories per minute × duration(minutes)
```

## Database Schema

### Users Table
- Personal information (username, email, password)
- Physical attributes (age, weight, height, gender)
- Activity level and health conditions

### Activities Table
- Activity type, duration, intensity
- Calculated calories burned
- Date and timestamp

### Food Intake Table
- Food name and quantity
- Nutritional breakdown
- Meal type and date
- Calculated total calories

## Security Features

- Password hashing using Werkzeug
- Session-based authentication
- Input validation and sanitization
- SQL injection prevention through ORM

## Future Enhancements

- Integration with fitness trackers
- Barcode scanning for food items
- Meal planning and recipe suggestions
- Social features and challenges
- Export data functionality
- Mobile app development
- Integration with external nutrition APIs

## Contributing

This application is designed to be easily extensible. Key areas for contribution:
- Expanding the food database
- Adding new activity types
- Improving recommendation algorithms
- Enhanced UI/UX features
- Performance optimizations

## License

This project is open source and available under the MIT License.

## Support

For questions or issues:
1. Check the console for any error messages
2. Ensure all dependencies are properly installed
3. Verify database permissions
4. Check network connectivity for external resources (fonts, icons)

---

**NutriTracker** - Taking the guesswork out of nutrition and fitness tracking! 🌟
