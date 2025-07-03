from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date
import sqlite3
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nutrition_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    age = db.Column(db.Integer)
    weight = db.Column(db.Float)  # in kg
    height = db.Column(db.Float)  # in cm
    gender = db.Column(db.String(10))
    activity_level = db.Column(db.String(20))  # sedentary, lightly_active, moderately_active, very_active
    health_conditions = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # running, walking, cycling, etc.
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    intensity = db.Column(db.String(20))  # low, moderate, high
    calories_burned = db.Column(db.Float)
    date = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FoodIntake(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    food_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)  # in grams
    calories_per_100g = db.Column(db.Float, nullable=False)
    protein = db.Column(db.Float)  # per 100g
    carbs = db.Column(db.Float)   # per 100g
    fat = db.Column(db.Float)     # per 100g
    fiber = db.Column(db.Float)   # per 100g
    total_calories = db.Column(db.Float)
    meal_type = db.Column(db.String(20))  # breakfast, lunch, dinner, snack
    date = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Calorie calculation functions
def calculate_bmr(weight, height, age, gender):
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
    if gender.lower() == 'male':
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    return bmr

def calculate_tdee(bmr, activity_level):
    """Calculate Total Daily Energy Expenditure"""
    activity_multipliers = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extremely_active': 1.9
    }
    return bmr * activity_multipliers.get(activity_level, 1.2)

def calculate_activity_calories(activity_type, duration, weight, intensity='moderate'):
    """Calculate calories burned for specific activities"""
    # METs (Metabolic Equivalent of Task) values for different activities
    met_values = {
        'walking': {'low': 2.5, 'moderate': 3.5, 'high': 4.5},
        'running': {'low': 7.0, 'moderate': 10.0, 'high': 13.0},
        'cycling': {'low': 4.0, 'moderate': 8.0, 'high': 12.0},
        'swimming': {'low': 4.0, 'moderate': 8.0, 'high': 11.0},
        'strength_training': {'low': 3.0, 'moderate': 5.0, 'high': 8.0},
        'yoga': {'low': 2.0, 'moderate': 3.0, 'high': 4.0},
        'dancing': {'low': 3.0, 'moderate': 5.0, 'high': 7.0}
    }
    
    met = met_values.get(activity_type, {}).get(intensity, 3.5)
    calories_per_minute = (met * weight * 3.5) / 200
    return calories_per_minute * duration

# Food database
FOOD_DATABASE = {
    'apple': {'calories': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'fiber': 2.4},
    'banana': {'calories': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'fiber': 2.6},
    'chicken_breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0},
    'brown_rice': {'calories': 111, 'protein': 2.6, 'carbs': 23, 'fat': 0.9, 'fiber': 1.8},
    'broccoli': {'calories': 34, 'protein': 2.8, 'carbs': 7, 'fat': 0.4, 'fiber': 2.6},
    'salmon': {'calories': 208, 'protein': 22, 'carbs': 0, 'fat': 12, 'fiber': 0},
    'eggs': {'calories': 155, 'protein': 13, 'carbs': 1.1, 'fat': 11, 'fiber': 0},
    'oatmeal': {'calories': 68, 'protein': 2.4, 'carbs': 12, 'fat': 1.4, 'fiber': 1.7},
    'almonds': {'calories': 579, 'protein': 21, 'carbs': 22, 'fat': 50, 'fiber': 12},
    'greek_yogurt': {'calories': 59, 'protein': 10, 'carbs': 3.6, 'fat': 0.4, 'fiber': 0},
    'spinach': {'calories': 23, 'protein': 2.9, 'carbs': 3.6, 'fat': 0.4, 'fiber': 2.2},
    'sweet_potato': {'calories': 86, 'protein': 1.6, 'carbs': 20, 'fat': 0.1, 'fiber': 3.0}
}

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        age=data.get('age'),
        weight=data.get('weight'),
        height=data.get('height'),
        gender=data.get('gender'),
        activity_level=data.get('activity_level', 'moderately_active'),
        health_conditions=json.dumps(data.get('health_conditions', []))
    )
    
    db.session.add(user)
    db.session.commit()
    
    session['user_id'] = user.id
    return jsonify({'message': 'User registered successfully', 'user_id': user.id})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        session['user_id'] = user.id
        return jsonify({'message': 'Login successful', 'user_id': user.id})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/user/profile')
def get_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'age': user.age,
        'weight': user.weight,
        'height': user.height,
        'gender': user.gender,
        'activity_level': user.activity_level,
        'health_conditions': json.loads(user.health_conditions) if user.health_conditions else []
    })

@app.route('/api/calorie-needs')
def get_calorie_needs():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if not user or not all([user.weight, user.height, user.age, user.gender]):
        return jsonify({'error': 'Complete profile required'}), 400
    
    bmr = calculate_bmr(user.weight, user.height, user.age, user.gender)
    tdee = calculate_tdee(bmr, user.activity_level)
    
    # Get today's activities
    today_activities = Activity.query.filter_by(
        user_id=user.id, 
        date=date.today()
    ).all()
    
    activity_calories = sum(activity.calories_burned or 0 for activity in today_activities)
    total_needs = tdee + activity_calories
    
    return jsonify({
        'bmr': round(bmr, 2),
        'tdee': round(tdee, 2),
        'activity_calories': round(activity_calories, 2),
        'total_calorie_needs': round(total_needs, 2)
    })

@app.route('/api/activity', methods=['POST'])
def log_activity():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    user = User.query.get(session['user_id'])
    
    calories_burned = calculate_activity_calories(
        data['activity_type'],
        data['duration'],
        user.weight,
        data.get('intensity', 'moderate')
    )
    
    activity = Activity(
        user_id=user.id,
        activity_type=data['activity_type'],
        duration=data['duration'],
        intensity=data.get('intensity', 'moderate'),
        calories_burned=calories_burned,
        date=datetime.strptime(data.get('date', str(date.today())), '%Y-%m-%d').date()
    )
    
    db.session.add(activity)
    db.session.commit()
    
    return jsonify({
        'message': 'Activity logged successfully',
        'calories_burned': round(calories_burned, 2)
    })

@app.route('/api/food', methods=['POST'])
def log_food():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    food_name = data['food_name'].lower().replace(' ', '_')
    
    if food_name not in FOOD_DATABASE:
        return jsonify({'error': 'Food not found in database'}), 404
    
    food_info = FOOD_DATABASE[food_name]
    quantity_factor = data['quantity'] / 100  # Convert to per 100g basis
    
    total_calories = food_info['calories'] * quantity_factor
    
    food_intake = FoodIntake(
        user_id=session['user_id'],
        food_name=data['food_name'],
        quantity=data['quantity'],
        calories_per_100g=food_info['calories'],
        protein=food_info['protein'],
        carbs=food_info['carbs'],
        fat=food_info['fat'],
        fiber=food_info['fiber'],
        total_calories=total_calories,
        meal_type=data.get('meal_type', 'snack'),
        date=datetime.strptime(data.get('date', str(date.today())), '%Y-%m-%d').date()
    )
    
    db.session.add(food_intake)
    db.session.commit()
    
    return jsonify({
        'message': 'Food logged successfully',
        'total_calories': round(total_calories, 2)
    })

@app.route('/api/food-search/<query>')
def search_food(query):
    matching_foods = []
    query_lower = query.lower()
    
    for food_name, nutrition in FOOD_DATABASE.items():
        if query_lower in food_name.replace('_', ' '):
            matching_foods.append({
                'name': food_name.replace('_', ' ').title(),
                'key': food_name,
                'calories_per_100g': nutrition['calories'],
                'protein': nutrition['protein'],
                'carbs': nutrition['carbs'],
                'fat': nutrition['fat']
            })
    
    return jsonify(matching_foods)

@app.route('/api/daily-summary')
def daily_summary():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    today = date.today()
    
    # Get today's food intake
    food_intake = FoodIntake.query.filter_by(user_id=user_id, date=today).all()
    total_consumed = sum(food.total_calories for food in food_intake)
    
    # Get calorie needs
    user = User.query.get(user_id)
    if user and all([user.weight, user.height, user.age, user.gender]):
        bmr = calculate_bmr(user.weight, user.height, user.age, user.gender)
        tdee = calculate_tdee(bmr, user.activity_level)
        
        # Get today's activities
        activities = Activity.query.filter_by(user_id=user_id, date=today).all()
        activity_calories = sum(activity.calories_burned or 0 for activity in activities)
        total_needs = tdee + activity_calories
        
        deficit = total_needs - total_consumed
        
        return jsonify({
            'calories_consumed': round(total_consumed, 2),
            'calories_needed': round(total_needs, 2),
            'calorie_deficit': round(deficit, 2),
            'activities': [{
                'type': activity.activity_type,
                'duration': activity.duration,
                'calories_burned': round(activity.calories_burned, 2)
            } for activity in activities],
            'foods': [{
                'name': food.food_name,
                'quantity': food.quantity,
                'calories': round(food.total_calories, 2),
                'meal_type': food.meal_type
            } for food in food_intake]
        })
    
    return jsonify({'error': 'Complete profile required'}), 400

@app.route('/api/recommendations')
def get_recommendations():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    # Get daily summary
    today = date.today()
    food_intake = FoodIntake.query.filter_by(user_id=user_id, date=today).all()
    total_consumed = sum(food.total_calories for food in food_intake)
    
    bmr = calculate_bmr(user.weight, user.height, user.age, user.gender)
    tdee = calculate_tdee(bmr, user.activity_level)
    activities = Activity.query.filter_by(user_id=user_id, date=today).all()
    activity_calories = sum(activity.calories_burned or 0 for activity in activities)
    total_needs = tdee + activity_calories
    
    deficit = total_needs - total_consumed
    
    recommendations = []
    
    if deficit > 200:
        recommendations.append({
            'type': 'calorie_deficit',
            'message': f'You need {round(deficit, 0)} more calories today. Consider adding nutritious foods.',
            'foods': ['almonds', 'greek_yogurt', 'banana', 'oatmeal']
        })
    elif deficit < -200:
        recommendations.append({
            'type': 'calorie_surplus',
            'message': f'You\'ve consumed {round(abs(deficit), 0)} calories more than needed. Consider light exercise.',
            'activities': ['walking', 'yoga']
        })
    
    # Health condition based recommendations
    health_conditions = json.loads(user.health_conditions) if user.health_conditions else []
    
    if 'diabetes' in health_conditions:
        recommendations.append({
            'type': 'health',
            'message': 'Focus on low glycemic foods and regular exercise.',
            'foods': ['broccoli', 'chicken_breast', 'brown_rice']
        })
    
    if 'heart_disease' in health_conditions:
        recommendations.append({
            'type': 'health',
            'message': 'Include heart-healthy foods rich in omega-3.',
            'foods': ['salmon', 'almonds', 'spinach']
        })
    
    return jsonify({'recommendations': recommendations})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)