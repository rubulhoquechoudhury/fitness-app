// Global variables
let currentUser = null;
let selectedFood = null;

// Utility functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function setTodaysDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// API functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`/api${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication functions
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => form.style.display = 'none');
    
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Form`).style.display = 'block';
}

async function login(username, password) {
    try {
        showLoading();
        const result = await apiCall('/login', 'POST', { username, password });
        showToast('Login successful!');
        await loadUserData();
        showMainApp();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function register(userData) {
    try {
        showLoading();
        const result = await apiCall('/register', 'POST', userData);
        showToast('Registration successful!');
        await loadUserData();
        showMainApp();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    currentUser = null;
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
    showToast('Logged out successfully');
}

function showMainApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.querySelector('.navbar').style.display = 'block';
    setTodaysDate();
    loadDashboard();
}

// Data loading functions
async function loadUserData() {
    try {
        currentUser = await apiCall('/user/profile');
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

async function loadDashboard() {
    try {
        showLoading();
        const [summary, recommendations, calorieNeeds] = await Promise.all([
            apiCall('/daily-summary'),
            apiCall('/recommendations'),
            apiCall('/calorie-needs')
        ]);
        
        updateDashboardStats(summary, calorieNeeds);
        updateTodaysMeals(summary.foods || []);
        updateRecommendations(recommendations.recommendations || []);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

function updateDashboardStats(summary, calorieNeeds) {
    // Update calorie stats
    document.getElementById('caloriesConsumed').textContent = summary.calories_consumed || 0;
    document.getElementById('caloriesNeeded').textContent = Math.round(summary.calories_needed || 0);
    
    const progress = Math.min((summary.calories_consumed / summary.calories_needed) * 100, 100);
    document.getElementById('caloriesProgress').style.width = `${progress}%`;
    
    // Update activities stats
    document.getElementById('activitiesCount').textContent = summary.activities?.length || 0;
    const totalActivityCalories = summary.activities?.reduce((sum, activity) => sum + activity.calories_burned, 0) || 0;
    document.getElementById('activitiesCalories').textContent = `${Math.round(totalActivityCalories)} calories burned`;
    
    // Update calorie deficit
    const deficit = summary.calorie_deficit || 0;
    document.getElementById('calorieDeficit').textContent = Math.round(Math.abs(deficit));
    
    const deficitStatus = document.getElementById('deficitStatus');
    if (deficit > 200) {
        deficitStatus.textContent = 'Need more calories';
        deficitStatus.style.color = '#ff6b6b';
    } else if (deficit < -200) {
        deficitStatus.textContent = 'Calorie surplus';
        deficitStatus.style.color = '#ffa726';
    } else {
        deficitStatus.textContent = 'Great balance!';
        deficitStatus.style.color = '#4ecdc4';
    }
}

function updateTodaysMeals(foods) {
    const mealsContainer = document.getElementById('todaysMeals');
    
    if (foods.length === 0) {
        mealsContainer.innerHTML = '<p style="color: #666; text-align: center;">No meals logged today</p>';
        return;
    }
    
    mealsContainer.innerHTML = foods.map(food => `
        <div class="meal-item meal-${food.meal_type}">
            <div>
                <strong>${food.name}</strong>
                <div style="color: #666; font-size: 0.9rem;">
                    ${food.quantity}g • ${food.meal_type}
                </div>
            </div>
            <div style="font-weight: 600; color: #333;">
                ${Math.round(food.calories)} cal
            </div>
        </div>
    `).join('');
}

function updateRecommendations(recommendations) {
    const recommendationsContainer = document.getElementById('recommendations');
    
    if (recommendations.length === 0) {
        recommendationsContainer.innerHTML = '<p style="color: #666; text-align: center;">No recommendations available</p>';
        return;
    }
    
    recommendationsContainer.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item ${rec.type}">
            <div>
                <div style="font-weight: 500; margin-bottom: 5px;">${rec.message}</div>
                ${rec.foods ? `<div style="font-size: 0.9rem; color: #666;">Try: ${rec.foods.join(', ')}</div>` : ''}
                ${rec.activities ? `<div style="font-size: 0.9rem; color: #666;">Try: ${rec.activities.join(', ')}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Navigation functions
function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`${sectionName}Btn`).classList.add('active');
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'food':
            loadFoodHistory();
            break;
        case 'activities':
            loadActivities();
            break;
    }
}

// Activity functions
async function logActivity(activityData) {
    try {
        showLoading();
        const result = await apiCall('/activity', 'POST', activityData);
        showToast(`Activity logged! ${result.calories_burned} calories burned`);
        document.getElementById('activityForm').reset();
        setTodaysDate();
        loadActivities();
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboard();
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadActivities() {
    try {
        const summary = await apiCall('/daily-summary');
        const activitiesContainer = document.getElementById('activitiesList');
        
        const activities = summary.activities || [];
        
        if (activities.length === 0) {
            activitiesContainer.innerHTML = '<p style="color: #666; text-align: center;">No activities logged today</p>';
            return;
        }
        
        activitiesContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div>
                    <strong>${activity.type.replace('_', ' ').toUpperCase()}</strong>
                    <div style="color: #666; font-size: 0.9rem;">
                        ${activity.duration} minutes
                    </div>
                </div>
                <div style="font-weight: 600; color: #333;">
                    ${Math.round(activity.calories_burned)} cal
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load activities:', error);
    }
}

// Food functions
async function searchFood(query) {
    if (query.length < 2) {
        document.getElementById('foodSuggestions').style.display = 'none';
        return;
    }
    
    try {
        const foods = await apiCall(`/food-search/${encodeURIComponent(query)}`);
        const suggestionsContainer = document.getElementById('foodSuggestions');
        
        if (foods.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = foods.map(food => `
            <div class="food-suggestion" onclick="selectFood('${food.key}', '${food.name}', ${food.calories_per_100g})">
                <strong>${food.name}</strong>
                <div style="font-size: 0.9rem; color: #666;">
                    ${food.calories_per_100g} cal/100g • P: ${food.protein}g • C: ${food.carbs}g • F: ${food.fat}g
                </div>
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
    } catch (error) {
        console.error('Food search error:', error);
    }
}

function selectFood(key, name, calories) {
    selectedFood = { key, name, calories };
    document.getElementById('foodSearch').value = name;
    document.getElementById('foodSuggestions').style.display = 'none';
}

async function logFood(foodData) {
    if (!selectedFood) {
        showToast('Please select a food from the suggestions', 'error');
        return;
    }
    
    try {
        showLoading();
        const result = await apiCall('/food', 'POST', {
            ...foodData,
            food_name: selectedFood.name
        });
        showToast(`Food logged! ${result.total_calories} calories added`);
        document.getElementById('foodForm').reset();
        selectedFood = null;
        setTodaysDate();
        loadFoodHistory();
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboard();
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadFoodHistory() {
    try {
        const summary = await apiCall('/daily-summary');
        const foodsContainer = document.getElementById('foodsList');
        
        const foods = summary.foods || [];
        
        if (foods.length === 0) {
            foodsContainer.innerHTML = '<p style="color: #666; text-align: center;">No food logged today</p>';
            return;
        }
        
        // Group foods by meal type
        const groupedFoods = foods.reduce((groups, food) => {
            const mealType = food.meal_type || 'snack';
            if (!groups[mealType]) {
                groups[mealType] = [];
            }
            groups[mealType].push(food);
            return groups;
        }, {});
        
        const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
        let html = '';
        
        mealOrder.forEach(mealType => {
            if (groupedFoods[mealType]) {
                html += `<h4 style="margin: 20px 0 10px 0; color: #333; text-transform: capitalize;">${mealType}</h4>`;
                html += groupedFoods[mealType].map(food => `
                    <div class="food-item meal-${food.meal_type}">
                        <div>
                            <strong>${food.name}</strong>
                            <div style="color: #666; font-size: 0.9rem;">
                                ${food.quantity}g
                            </div>
                        </div>
                        <div style="font-weight: 600; color: #333;">
                            ${Math.round(food.calories)} cal
                        </div>
                    </div>
                `).join('');
            }
        });
        
        foodsContainer.innerHTML = html;
    } catch (error) {
        console.error('Failed to load food history:', error);
    }
}

// Profile functions
async function loadProfile() {
    if (!currentUser) {
        await loadUserData();
    }
    
    try {
        const calorieNeeds = await apiCall('/calorie-needs');
        updateProfileDisplay(currentUser, calorieNeeds);
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

function updateProfileDisplay(user, calorieData) {
    const profileContainer = document.getElementById('profileInfo');
    const calorieContainer = document.getElementById('calorieInfo');
    
    // Profile information
    profileContainer.innerHTML = `
        <div class="profile-info">
            <div class="profile-item">
                <i class="fas fa-user"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Username</div>
                    <div class="profile-item-value">${user.username}</div>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-envelope"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Email</div>
                    <div class="profile-item-value">${user.email}</div>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-calendar"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Age</div>
                    <div class="profile-item-value">${user.age} years</div>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-weight"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Weight</div>
                    <div class="profile-item-value">${user.weight} kg</div>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-ruler-vertical"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Height</div>
                    <div class="profile-item-value">${user.height} cm</div>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-venus-mars"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Gender</div>
                    <div class="profile-item-value">${user.gender}</div>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-running"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Activity Level</div>
                    <div class="profile-item-value">${user.activity_level.replace('_', ' ')}</div>
                </div>
            </div>
            ${user.health_conditions && user.health_conditions.length > 0 ? `
                <div class="profile-item">
                    <i class="fas fa-medkit"></i>
                    <div class="profile-item-content">
                        <div class="profile-item-label">Health Conditions</div>
                        <div class="profile-item-value">${user.health_conditions.join(', ')}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Calorie information
    calorieContainer.innerHTML = `
        <div class="calorie-breakdown">
            <div class="calorie-item">
                <h4>BMR</h4>
                <div class="value">${Math.round(calorieData.bmr)}</div>
                <div class="unit">calories</div>
            </div>
            <div class="calorie-item">
                <h4>TDEE</h4>
                <div class="value">${Math.round(calorieData.tdee)}</div>
                <div class="unit">calories</div>
            </div>
            <div class="calorie-item">
                <h4>Activity Bonus</h4>
                <div class="value">${Math.round(calorieData.activity_calories)}</div>
                <div class="unit">calories</div>
            </div>
            <div class="calorie-item">
                <h4>Total Needs</h4>
                <div class="value">${Math.round(calorieData.total_calorie_needs)}</div>
                <div class="unit">calories</div>
            </div>
        </div>
    `;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date for all date inputs
    setTodaysDate();
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        login(username, password);
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const healthConditions = Array.from(document.querySelectorAll('#registerForm input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        const userData = {
            username: document.getElementById('regUsername').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            age: parseInt(document.getElementById('regAge').value),
            weight: parseFloat(document.getElementById('regWeight').value),
            height: parseFloat(document.getElementById('regHeight').value),
            gender: document.getElementById('regGender').value,
            activity_level: document.getElementById('regActivityLevel').value,
            health_conditions: healthConditions
        };
        
        register(userData);
    });
    
    // Activity form
    document.getElementById('activityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const activityData = {
            activity_type: document.getElementById('activityType').value,
            duration: parseInt(document.getElementById('activityDuration').value),
            intensity: document.getElementById('activityIntensity').value,
            date: document.getElementById('activityDate').value
        };
        
        logActivity(activityData);
    });
    
    // Food form
    document.getElementById('foodForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const foodData = {
            quantity: parseFloat(document.getElementById('foodQuantity').value),
            meal_type: document.getElementById('mealType').value,
            date: document.getElementById('foodDate').value
        };
        
        logFood(foodData);
    });
    
    // Food search
    document.getElementById('foodSearch').addEventListener('input', function(e) {
        const query = e.target.value.trim();
        searchFood(query);
    });
    
    // Hide food suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#foodSearch') && !e.target.closest('#foodSuggestions')) {
            document.getElementById('foodSuggestions').style.display = 'none';
        }
    });
    
    // Initialize with dashboard
    showSection('dashboard');
});