// Global variables
let currentUser = null;
let selectedFood = null;
let dashboardUpdateInterval = null;
let toastQueue = [];

// Animation and UI utilities
function addSparkleEffect(element) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-effect';
    sparkle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--primary-gradient);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: sparkle 0.6s ease-out forwards;
    `;
    
    const rect = element.getBoundingClientRect();
    sparkle.style.left = rect.left + Math.random() * rect.width + 'px';
    sparkle.style.top = rect.top + Math.random() * rect.height + 'px';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 600);
}

function addRippleEffect(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Enhanced utility functions
function showLoading(message = 'Processing...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = loadingOverlay.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
    loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showToast(message, type = 'success', duration = 5000) {
    const toast = {
        id: Date.now(),
        message,
        type,
        duration
    };
    
    toastQueue.push(toast);
    processToastQueue();
}

function processToastQueue() {
    if (toastQueue.length === 0) return;
    
    const toast = toastQueue.shift();
    const toastContainer = document.getElementById('toastContainer');
    const toastElement = document.createElement('div');
    toastElement.className = `toast ${toast.type}`;
    toastElement.setAttribute('data-toast-id', toast.id);
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const icon = icons[toast.type] || icons.info;
    
    toastElement.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${toast.message}</span>
        <button class="toast-close" onclick="dismissToast(${toast.id})">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toastElement);
    
    // Auto dismiss
    setTimeout(() => {
        dismissToast(toast.id);
        setTimeout(processToastQueue, 100); // Process next toast
    }, toast.duration);
}

function dismissToast(toastId) {
    const toast = document.querySelector(`[data-toast-id="${toastId}"]`);
    if (toast) {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
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

function animateNumber(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// Enhanced API functions
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
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
}

// Enhanced authentication functions
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => {
        form.style.display = 'none';
        form.style.opacity = '0';
    });
    
    const activeTab = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    const activeForm = document.getElementById(`${tabName}Form`);
    
    activeTab.classList.add('active');
    activeForm.style.display = 'block';
    
    // Smooth transition
    setTimeout(() => {
        activeForm.style.opacity = '1';
    }, 50);
}

async function login(username, password) {
    try {
        showLoading('Signing you in...');
        const result = await apiCall('/login', 'POST', { username, password });
        showToast('Welcome back! 🎉', 'success');
        await loadUserData();
        showMainApp();
        startDashboardUpdates();
    } catch (error) {
        showToast(error.message, 'error');
        // Add shake animation to form
        const form = document.getElementById('loginForm');
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => form.style.animation = '', 500);
    } finally {
        hideLoading();
    }
}

async function register(userData) {
    try {
        showLoading('Creating your account...');
        const result = await apiCall('/register', 'POST', userData);
        showToast('Account created successfully! Welcome to NutriTracker! 🌟', 'success', 6000);
        await loadUserData();
        showMainApp();
        startDashboardUpdates();
    } catch (error) {
        showToast(error.message, 'error');
        const form = document.getElementById('registerForm');
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => form.style.animation = '', 500);
    } finally {
        hideLoading();
    }
}

function logout() {
    currentUser = null;
    stopDashboardUpdates();
    
    // Smooth transition
    const mainApp = document.getElementById('mainApp');
    const navbar = document.querySelector('.navbar');
    const authSection = document.getElementById('authSection');
    
    mainApp.style.opacity = '0';
    navbar.style.opacity = '0';
    
    setTimeout(() => {
        mainApp.style.display = 'none';
        navbar.style.display = 'none';
        authSection.style.display = 'block';
        authSection.style.opacity = '1';
    }, 300);
    
    showToast('Successfully logged out. See you soon! 👋', 'info');
}

function showMainApp() {
    const authSection = document.getElementById('authSection');
    const mainApp = document.getElementById('mainApp');
    const navbar = document.querySelector('.navbar');
    
    authSection.style.opacity = '0';
    
    setTimeout(() => {
        authSection.style.display = 'none';
        mainApp.style.display = 'block';
        navbar.style.display = 'block';
        
        setTimeout(() => {
            mainApp.style.opacity = '1';
            navbar.style.opacity = '1';
        }, 50);
    }, 300);
    
    setTodaysDate();
    loadDashboard();
}

// Real-time dashboard updates
function startDashboardUpdates() {
    // Update dashboard every 30 seconds when active
    dashboardUpdateInterval = setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboard();
        }
    }, 30000);
}

function stopDashboardUpdates() {
    if (dashboardUpdateInterval) {
        clearInterval(dashboardUpdateInterval);
        dashboardUpdateInterval = null;
    }
}

// Enhanced data loading functions
async function loadUserData() {
    try {
        currentUser = await apiCall('/user/profile');
    } catch (error) {
        console.error('Failed to load user data:', error);
        showToast('Failed to load user profile', 'error');
    }
}

async function loadDashboard() {
    try {
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
    }
}

function updateDashboardStats(summary, calorieNeeds) {
    // Animate calorie numbers
    const caloriesConsumed = document.getElementById('caloriesConsumed');
    const caloriesNeeded = document.getElementById('caloriesNeeded');
    const currentConsumed = parseInt(caloriesConsumed.textContent) || 0;
    const currentNeeded = parseInt(caloriesNeeded.textContent) || 0;
    
    animateNumber(caloriesConsumed, currentConsumed, summary.calories_consumed || 0);
    animateNumber(caloriesNeeded, currentNeeded, Math.round(summary.calories_needed || 0));
    
    // Animate progress bar
    const progress = Math.min((summary.calories_consumed / summary.calories_needed) * 100, 100);
    const progressBar = document.getElementById('caloriesProgress');
    progressBar.style.width = `${progress}%`;
    
    // Update activities with animation
    const activitiesCount = document.getElementById('activitiesCount');
    const currentActivities = parseInt(activitiesCount.textContent) || 0;
    animateNumber(activitiesCount, currentActivities, summary.activities?.length || 0);
    
    const totalActivityCalories = summary.activities?.reduce((sum, activity) => sum + activity.calories_burned, 0) || 0;
    document.getElementById('activitiesCalories').textContent = `${Math.round(totalActivityCalories)} calories burned`;
    
    // Update calorie deficit with color coding
    const deficit = summary.calorie_deficit || 0;
    const deficitElement = document.getElementById('calorieDeficit');
    const currentDeficit = parseInt(deficitElement.textContent) || 0;
    animateNumber(deficitElement, currentDeficit, Math.round(Math.abs(deficit)));
    
    const deficitStatus = document.getElementById('deficitStatus');
    if (deficit > 200) {
        deficitStatus.textContent = 'Need more calories';
        deficitStatus.style.color = 'var(--danger-color)';
    } else if (deficit < -200) {
        deficitStatus.textContent = 'Calorie surplus';
        deficitStatus.style.color = 'var(--warning-color)';
    } else {
        deficitStatus.textContent = 'Perfect balance! 🎯';
        deficitStatus.style.color = 'var(--success-color)';
    }
}

function updateTodaysMeals(foods) {
    const mealsContainer = document.getElementById('todaysMeals');
    
    if (foods.length === 0) {
        mealsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-utensils" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>No meals logged today</p>
                <p style="font-size: 0.9rem;">Start by adding your first meal!</p>
            </div>
        `;
        return;
    }
    
    const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
    mealsContainer.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: var(--border-radius-md); text-align: center;">
            <strong style="color: var(--primary-color);">Total: ${Math.round(totalCalories)} calories</strong>
        </div>
        ${foods.map(food => `
            <div class="meal-item meal-${food.meal_type}" style="animation: slideIn 0.3s ease-out;">
                <div>
                    <strong>${food.name}</strong>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${food.quantity}g • ${food.meal_type} • ${formatTime(food.created_at || new Date())}
                    </div>
                </div>
                <div style="font-weight: 600; color: var(--text-primary);">
                    ${Math.round(food.calories)} cal
                </div>
            </div>
        `).join('')}
    `;
}

function updateRecommendations(recommendations) {
    const recommendationsContainer = document.getElementById('recommendations');
    
    if (recommendations.length === 0) {
        recommendationsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-lightbulb" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>No recommendations available</p>
                <p style="font-size: 0.9rem;">Keep logging your meals and activities!</p>
            </div>
        `;
        return;
    }
    
    recommendationsContainer.innerHTML = recommendations.map((rec, index) => `
        <div class="recommendation-item ${rec.type}" style="animation: slideIn 0.3s ease-out; animation-delay: ${index * 0.1}s;">
            <div>
                <div style="font-weight: 500; margin-bottom: 8px; color: var(--text-primary);">
                    ${rec.message}
                </div>
                ${rec.foods ? `<div style="font-size: 0.9rem; color: var(--text-secondary);">
                    💡 Try: ${rec.foods.map(food => `<span style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; margin-right: 4px;">${food.replace('_', ' ')}</span>`).join('')}
                </div>` : ''}
                ${rec.activities ? `<div style="font-size: 0.9rem; color: var(--text-secondary);">
                    🏃 Try: ${rec.activities.map(activity => `<span style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; margin-right: 4px;">${activity.replace('_', ' ')}</span>`).join('')}
                </div>` : ''}
            </div>
        </div>
    `).join('');
}

// Enhanced navigation functions
function showSection(sectionName) {
    // Update navigation with ripple effect
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNavItem = document.getElementById(`${sectionName}Btn`);
    activeNavItem.classList.add('active');
    
    // Update sections with smooth transition
    const currentSection = document.querySelector('.section.active');
    const newSection = document.getElementById(sectionName);
    
    if (currentSection && currentSection !== newSection) {
        currentSection.style.opacity = '0';
        setTimeout(() => {
            currentSection.classList.remove('active');
            newSection.classList.add('active');
            newSection.style.opacity = '1';
        }, 200);
    } else {
        newSection.classList.add('active');
        newSection.style.opacity = '1';
    }
    
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

// Enhanced activity functions
async function logActivity(activityData) {
    try {
        showLoading('Logging your activity...');
        const result = await apiCall('/activity', 'POST', activityData);
        showToast(`Great workout! You burned ${Math.round(result.calories_burned)} calories! 🔥`, 'success');
        
        // Add sparkle effect to the form
        addSparkleEffect(document.getElementById('activityForm'));
        
        document.getElementById('activityForm').reset();
        setTodaysDate();
        loadActivities();
        
        // Update dashboard if active
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
            activitiesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-running" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No activities logged today</p>
                    <p style="font-size: 0.9rem;">Time to get moving! 💪</p>
                </div>
            `;
            return;
        }
        
        const totalCaloriesBurned = activities.reduce((sum, activity) => sum + activity.calories_burned, 0);
        activitiesContainer.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: var(--border-radius-md); text-align: center;">
                <strong style="color: var(--success-color);">Total burned: ${Math.round(totalCaloriesBurned)} calories 🔥</strong>
            </div>
            ${activities.map((activity, index) => `
                <div class="activity-item" style="animation: slideIn 0.3s ease-out; animation-delay: ${index * 0.1}s;">
                    <div>
                        <strong>${activity.type.replace('_', ' ').toUpperCase()}</strong>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            ${activity.duration} minutes • ${formatTime(new Date())}
                        </div>
                    </div>
                    <div style="font-weight: 600; color: var(--success-color);">
                        ${Math.round(activity.calories_burned)} cal
                    </div>
                </div>
            `).join('')}
        `;
    } catch (error) {
        console.error('Failed to load activities:', error);
    }
}

// Enhanced food functions with better nutrition display
async function searchFood(query) {
    if (query.length < 2) {
        document.getElementById('foodSuggestions').style.display = 'none';
        return;
    }
    
    try {
        const foods = await apiCall(`/food-search/${encodeURIComponent(query)}`);
        const suggestionsContainer = document.getElementById('foodSuggestions');
        
        if (foods.length === 0) {
            suggestionsContainer.innerHTML = `
                <div style="padding: 15px; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-search" style="margin-bottom: 10px;"></i>
                    <p>No foods found for "${query}"</p>
                </div>
            `;
            suggestionsContainer.style.display = 'block';
            return;
        }
        
        suggestionsContainer.innerHTML = foods.map(food => `
            <div class="food-suggestion" onclick="selectFood('${food.key}', '${food.name}', ${food.calories_per_100g})" 
                 style="animation: slideIn 0.2s ease-out;">
                <div class="food-suggestion-name">${food.name}</div>
                <div class="food-suggestion-calories">${food.calories_per_100g} cal/100g</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                    <span style="margin-right: 10px;">🥩 ${food.protein}g</span>
                    <span style="margin-right: 10px;">🍞 ${food.carbs}g</span>
                    <span>🥑 ${food.fat}g</span>
                </div>
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
    } catch (error) {
        console.error('Food search error:', error);
        showToast('Error searching for foods', 'error');
    }
}

function selectFood(key, name, calories) {
    selectedFood = { key, name, calories };
    document.getElementById('foodSearch').value = name;
    document.getElementById('foodSuggestions').style.display = 'none';
    
    // Add visual feedback
    const searchInput = document.getElementById('foodSearch');
    searchInput.style.borderColor = 'var(--success-color)';
    setTimeout(() => {
        searchInput.style.borderColor = '';
    }, 1000);
}

async function logFood(foodData) {
    if (!selectedFood) {
        showToast('Please select a food from the suggestions', 'error');
        document.getElementById('foodSearch').style.borderColor = 'var(--danger-color)';
        setTimeout(() => {
            document.getElementById('foodSearch').style.borderColor = '';
        }, 1000);
        return;
    }
    
    try {
        showLoading('Adding food to your log...');
        const result = await apiCall('/food', 'POST', {
            ...foodData,
            food_name: selectedFood.name
        });
        
        showToast(`Added ${selectedFood.name}! ${Math.round(result.total_calories)} calories logged 🍽️`, 'success');
        
        // Add sparkle effect
        addSparkleEffect(document.getElementById('foodForm'));
        
        document.getElementById('foodForm').reset();
        selectedFood = null;
        setTodaysDate();
        loadFoodHistory();
        
        // Update dashboard if active
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
            foodsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-utensils" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No food logged today</p>
                    <p style="font-size: 0.9rem;">Start tracking your nutrition! 🥗</p>
                </div>
            `;
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
        const mealEmojis = {
            breakfast: '🌅',
            lunch: '☀️', 
            dinner: '🌙',
            snack: '🍎'
        };
        
        let html = '';
        
        mealOrder.forEach(mealType => {
            if (groupedFoods[mealType]) {
                const mealCalories = groupedFoods[mealType].reduce((sum, food) => sum + food.calories, 0);
                html += `
                    <div style="margin: 25px 0 15px 0;">
                        <h4 style="color: var(--text-primary); text-transform: capitalize; display: flex; align-items: center; gap: 10px;">
                            ${mealEmojis[mealType]} ${mealType} 
                            <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: normal;">
                                (${Math.round(mealCalories)} cal)
                            </span>
                        </h4>
                    </div>
                `;
                html += groupedFoods[mealType].map((food, index) => `
                    <div class="food-item meal-${food.meal_type}" style="animation: slideIn 0.3s ease-out; animation-delay: ${index * 0.1}s;">
                        <div>
                            <strong>${food.name}</strong>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${food.quantity}g • ${formatTime(food.created_at || new Date())}
                            </div>
                        </div>
                        <div style="font-weight: 600; color: var(--text-primary);">
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

// Enhanced profile functions
async function loadProfile() {
    if (!currentUser) {
        await loadUserData();
    }
    
    try {
        showLoading('Loading your profile...');
        const calorieNeeds = await apiCall('/calorie-needs');
        updateProfileDisplay(currentUser, calorieNeeds);
    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load profile data', 'error');
    } finally {
        hideLoading();
    }
}

function updateProfileDisplay(user, calorieData) {
    const profileContainer = document.getElementById('profileInfo');
    const calorieContainer = document.getElementById('calorieInfo');
    
    // Enhanced profile information with better formatting
    profileContainer.innerHTML = `
        <div class="profile-info">
            <div class="profile-item" style="animation: slideIn 0.3s ease-out;">
                <i class="fas fa-user"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Username</div>
                    <div class="profile-item-value">${user.username}</div>
                </div>
            </div>
            <div class="profile-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.1s;">
                <i class="fas fa-envelope"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Email</div>
                    <div class="profile-item-value">${user.email}</div>
                </div>
            </div>
            <div class="profile-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.2s;">
                <i class="fas fa-calendar"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Age</div>
                    <div class="profile-item-value">${user.age} years</div>
                </div>
            </div>
            <div class="profile-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.3s;">
                <i class="fas fa-weight"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Weight</div>
                    <div class="profile-item-value">${user.weight} kg</div>
                </div>
            </div>
            <div class="profile-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.4s;">
                <i class="fas fa-ruler-vertical"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Height</div>
                    <div class="profile-item-value">${user.height} cm</div>
                </div>
            </div>
            <div class="profile-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.5s;">
                <i class="fas fa-venus-mars"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Gender</div>
                    <div class="profile-item-value">${user.gender}</div>
                </div>
            </div>
            <div class="profile-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.6s;">
                <i class="fas fa-running"></i>
                <div class="profile-item-content">
                    <div class="profile-item-label">Activity Level</div>
                    <div class="profile-item-value">${user.activity_level.replace('_', ' ')}</div>
                </div>
            </div>
            ${user.health_conditions && user.health_conditions.length > 0 ? `
                <div class="profile-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.7s;">
                    <i class="fas fa-medkit"></i>
                    <div class="profile-item-content">
                        <div class="profile-item-label">Health Conditions</div>
                        <div class="profile-item-value">${user.health_conditions.join(', ')}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Enhanced calorie information with animations
    calorieContainer.innerHTML = `
        <div class="calorie-breakdown">
            <div class="calorie-item" style="animation: slideIn 0.3s ease-out;">
                <h4>BMR</h4>
                <div class="value">${Math.round(calorieData.bmr)}</div>
                <div class="unit">calories/day</div>
            </div>
            <div class="calorie-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.1s;">
                <h4>TDEE</h4>
                <div class="value">${Math.round(calorieData.tdee)}</div>
                <div class="unit">calories/day</div>
            </div>
            <div class="calorie-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.2s;">
                <h4>Activity Bonus</h4>
                <div class="value">${Math.round(calorieData.activity_calories)}</div>
                <div class="unit">calories</div>
            </div>
            <div class="calorie-item" style="animation: slideIn 0.3s ease-out; animation-delay: 0.3s;">
                <h4>Total Needs</h4>
                <div class="value">${Math.round(calorieData.total_calorie_needs)}</div>
                <div class="unit">calories/day</div>
            </div>
        </div>
    `;
}

// Enhanced event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS animations to the document
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        @keyframes sparkle {
            0% { opacity: 1; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0); }
        }
        
        @keyframes ripple {
            to { transform: scale(4); opacity: 0; }
        }
        
        .toast-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: var(--transition-fast);
        }
        
        .toast-close:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
    `;
    document.head.appendChild(style);
    
    // Set today's date for all date inputs
    setTodaysDate();
    
    // Add ripple effect to all buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('button, .btn, .nav-item')) {
            addRippleEffect(e);
        }
    });
    
    // Enhanced login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            showToast('Please enter both username and password', 'warning');
            return;
        }
        
        login(username, password);
    });
    
    // Enhanced register form
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const healthConditions = Array.from(document.querySelectorAll('#registerForm input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        const userData = {
            username: document.getElementById('regUsername').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            password: document.getElementById('regPassword').value,
            age: parseInt(document.getElementById('regAge').value),
            weight: parseFloat(document.getElementById('regWeight').value),
            height: parseFloat(document.getElementById('regHeight').value),
            gender: document.getElementById('regGender').value,
            activity_level: document.getElementById('regActivityLevel').value,
            health_conditions: healthConditions
        };
        
        // Validation
        if (!userData.username || !userData.email || !userData.password) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }
        
        if (userData.password.length < 6) {
            showToast('Password must be at least 6 characters long', 'warning');
            return;
        }
        
        register(userData);
    });
    
    // Enhanced activity form
    document.getElementById('activityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const activityData = {
            activity_type: document.getElementById('activityType').value,
            duration: parseInt(document.getElementById('activityDuration').value),
            intensity: document.getElementById('activityIntensity').value,
            date: document.getElementById('activityDate').value
        };
        
        if (!activityData.activity_type || !activityData.duration) {
            showToast('Please fill in all activity details', 'warning');
            return;
        }
        
        logActivity(activityData);
    });
    
    // Enhanced food form
    document.getElementById('foodForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const quantity = parseFloat(document.getElementById('foodQuantity').value);
        
        if (!quantity || quantity <= 0) {
            showToast('Please enter a valid quantity', 'warning');
            return;
        }
        
        const foodData = {
            quantity: quantity,
            meal_type: document.getElementById('mealType').value,
            date: document.getElementById('foodDate').value
        };
        
        logFood(foodData);
    });
    
    // Enhanced food search with debouncing
    let searchTimeout;
    document.getElementById('foodSearch').addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchFood(query);
        }, 300); // 300ms debounce
    });
    
    // Hide food suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#foodSearch') && !e.target.closest('#foodSuggestions')) {
            document.getElementById('foodSuggestions').style.display = 'none';
        }
    });
    
    // Initialize with dashboard
    showSection('dashboard');
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    showSection('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    showSection('activities');
                    break;
                case '3':
                    e.preventDefault();
                    showSection('food');
                    break;
                case '4':
                    e.preventDefault();
                    showSection('profile');
                    break;
            }
        }
    });
    
    // Add visibility change handler to pause/resume updates
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopDashboardUpdates();
        } else if (currentUser) {
            startDashboardUpdates();
        }
    });
});