// Global variables
let currentUser = null;
let expenses = [];
let pieChart = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setMinDate();
});

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    document.getElementById('expenseDate').min = today;
}

// Authentication functions
function register() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }
    
    const user = { email, password, expenses: [] };
    localStorage.setItem('currentUser', JSON.stringify(user));
    alert('Registration successful!');
    showDashboard();
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user || user.email !== email || user.password !== password) {
        alert('Invalid credentials');
        return;
    }
    
    currentUser = user;
    expenses = user.expenses || [];
    showDashboard();
}

function logout() {
    currentUser = null;
    expenses = [];
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    clearForms();
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function checkAuth() {
    // Always show login page first
}

function showDashboard() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    renderExpenses();
    updateChart();
}

function clearForms() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
}

// Expense functions
function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDesc').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const expense = { id: Date.now(), date, category, amount, description };
    expenses.unshift(expense);
    
    if (currentUser) {
        currentUser.expenses = expenses;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    renderExpenses();
    updateChart();
    clearExpenseForm();
}

function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    
    if (currentUser) {
        currentUser.expenses = expenses;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    renderExpenses();
    updateChart();
}

function renderExpenses() {
    const tbody = document.getElementById('expenseTbody');
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    document.getElementById('totalExpense').textContent = `Total: $${total.toFixed(2)}`;
    
    tbody.innerHTML = expenses.map(exp =>
        `<tr>
            <td>${exp.date}</td>
            <td>${exp.category}</td>
            <td>$${exp.amount.toFixed(2)}</td>
            <td>${exp.description}</td>
            <td><button class="delete-btn" onclick="deleteExpense(${exp.id})">Delete</button></td>
        </tr>`
    ).join('');
}

function clearExpenseForm() {
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDesc').value = '';
    setMinDate();
}

function updateChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const categoryTotals = {};
    
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    const categoryColors = {
        'Food': '#FF9F43',
        'Travel': '#54A0FF',
        'Shopping': '#5F27CD',
        'Bills': '#1DD1A1',
        'Other': '#FF6B6B'
    };
    
    const labels = Object.keys(categoryTotals);
    const data = labels.map(cat => categoryTotals[cat]);
    const colors = labels.map(cat => categoryColors[cat]);
    
    if (pieChart) {
        pieChart.destroy();
    }
    
    Chart.register(ChartDataLabels);
    
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#000000',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value/total)*100).toFixed(1) + '%';
                        return context.chart.data.labels[context.dataIndex] + '\n' + percentage;
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
    
    updateLegend(categoryTotals, categoryColors);
}

function updateLegend(categoryTotals, categoryColors) {
    const legend = document.getElementById('chartLegend');
    const allCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];
    
    legend.innerHTML = allCategories.map(cat => {
        const amount = categoryTotals[cat] || 0;
        if (amount === 0) return '';
        return `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${categoryColors[cat]};"></div>
                ${cat}: $${amount.toFixed(2)}
            </div>
        `;
    }).filter(item => item !== '').join('');
}
