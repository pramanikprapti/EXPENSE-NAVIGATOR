document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('transaction-form');
    const elements = {
        description: document.getElementById('description'),
        amount: document.getElementById('amount'),
        date: document.getElementById('date'),
        category: document.getElementById('category'),
        idInput: document.getElementById('transaction-id'),
        formTitle: document.getElementById('form-title'),
        submitBtn: document.getElementById('form-submit-btn'),
        cancelBtn: document.getElementById('form-cancel-btn'),
        expenseList: document.getElementById('expense-list'),
        incomeList: document.getElementById('income-list'),
        totalIncome: document.getElementById('total-income'),
        totalExpenses: document.getElementById('total-expenses'),
        balance: document.getElementById('balance'),
        tabExpense: document.getElementById('tab-expense'),
        tabIncome: document.getElementById('tab-income'),
        expenseSection: document.getElementById('expense-section'),
        incomeSection: document.getElementById('income-section'),
        categoryBudgets: document.getElementById('category-budgets-list'),
        toast: document.getElementById('toast-notification'),
        toastMsg: document.getElementById('toast-message'),
    };

    let expenseChart;
    
    // --- APP STATE ---
    let state = {
        transactions: JSON.parse(localStorage.getItem('transactions')) || [],
        expenseCategories: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Housing', 'Healthcare', 'Other'],
        incomeCategories: ['Salary', 'Bonus', 'Freelance', 'Investment', 'Gift'],
        categoryBudgets: JSON.parse(localStorage.getItem('categoryBudgets')) || {},
    };

    // --- UTILITY & STORAGE ---
    const generateID = () => Math.floor(Math.random() * 1000000);
    const showToast = (message) => {
        elements.toastMsg.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => elements.toast.classList.remove('show'), 3000);
    };
    const updateLocalStorage = () => {
        localStorage.setItem('transactions', JSON.stringify(state.transactions));
        // We no longer save categories as they are hardcoded
        localStorage.setItem('categoryBudgets', JSON.stringify(state.categoryBudgets));
    };

    // --- UI RENDERING ---
    const renderTransactionItem = (t) => {
        const sign = t.type === 'income' ? '+' : '-';
        const colorClass = t.type === 'income' ? 'bg-green-50' : 'bg-red-50';
        const textColor = t.type === 'income' ? 'text-green-600' : 'text-red-600';
        const item = document.createElement('li');
        item.className = `flex justify-between items-center p-4 rounded-lg transition-all ${colorClass}`;
        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-center w-12 flex-shrink-0">
                    <p class="font-bold text-slate-700">${new Date(t.date).getDate()}</p>
                    <p class="text-xs text-slate-500">${new Date(t.date).toLocaleString('default', { month: 'short' })}</p>
                </div>
                <div>
                    <span class="font-bold text-slate-800">${t.description}</span>
                    <span class="block text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full inline-block mt-1">${t.category}</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-semibold ${textColor}">${sign}₹${Math.abs(t.amount).toFixed(2)}</span>
                <button onclick="window.app.editTransaction(${t.id})" class="text-slate-400 hover:text-blue-500 text-lg">✏️</button>
                <button onclick="window.app.removeTransaction(${t.id})" class="text-slate-400 hover:text-red-500 text-xl">&times;</button>
            </div>`;
        return item;
    };

    const renderLists = () => {
        elements.expenseList.innerHTML = '';
        elements.incomeList.innerHTML = '';
        const expenses = state.transactions.filter(t => t.type === 'expense').sort((a,b) => new Date(b.date) - new Date(a.date));
        const income = state.transactions.filter(t => t.type === 'income').sort((a,b) => new Date(b.date) - new Date(a.date));
        
        if (expenses.length === 0) elements.expenseList.innerHTML = `<li class="text-center text-slate-500 pt-4">No expenses yet.</li>`;
        else expenses.forEach(t => elements.expenseList.appendChild(renderTransactionItem(t)));
        
        if (income.length === 0) elements.incomeList.innerHTML = `<li class="text-center text-slate-500 pt-4">No income yet.</li>`;
        else income.forEach(t => elements.incomeList.appendChild(renderTransactionItem(t)));
    };

    const updateDashboard = () => {
        const amounts = state.transactions.map(t => t.amount);
        const income = amounts.filter(i => i > 0).reduce((a, i) => a + i, 0);
        const expenses = amounts.filter(i => i < 0).reduce((a, i) => a + i, 0) * -1;
        elements.totalIncome.innerText = `₹${income.toFixed(2)}`;
        elements.totalExpenses.innerText = `₹${expenses.toFixed(2)}`;
        elements.balance.innerText = `₹${(income - expenses).toFixed(2)}`;
    };

    const updateCategoryDropdown = (type) => {
        const categories = type === 'expense' ? state.expenseCategories : state.incomeCategories;
        elements.category.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    };
    
    const renderCategoryBudgets = () => {
        elements.categoryBudgets.innerHTML = '';
        if (state.expenseCategories.length === 0) {
            elements.categoryBudgets.innerHTML = `<p class="text-center text-slate-500">No expense categories available.</p>`;
            return;
        }
        state.expenseCategories.forEach(category => {
            const budget = state.categoryBudgets[category] || 0;
            const spent = state.transactions.filter(t => t.type === 'expense' && t.category === category).reduce((s, t) => s + Math.abs(t.amount), 0);
            const remaining = budget - spent;
            const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            
            let pColor = 'bg-indigo-500';
            if (progress > 80) pColor = 'bg-yellow-500';
            if (progress >= 100) pColor = 'bg-red-500';

            const budgetEl = document.createElement('div');
            budgetEl.innerHTML = `
                <div class="mb-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-semibold">${category}</span>
                        <input type="number" data-category="${category}" value="${budget > 0 ? budget : ''}" placeholder="Set Budget" class="budget-input text-right w-28 p-1 border-b-2 rounded-sm border-slate-200 focus:outline-none focus:border-indigo-500">
                    </div>
                    <div class="flex justify-between text-xs text-slate-500">
                        <span>Spent: ₹${spent.toFixed(2)}</span>
                        <span class="${remaining < 0 ? 'text-red-500 font-bold' : ''}">Remaining: ₹${remaining.toFixed(2)}</span>
                    </div>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2.5"><div class="${pColor} h-2.5 rounded-full" style="width: ${progress}%"></div></div>
            `;
            elements.categoryBudgets.appendChild(budgetEl);
        });
    };

    const updateChart = () => {
        const expenseTxs = state.transactions.filter(t => t.type === 'expense');
        const cats = [...new Set(expenseTxs.map(t => t.category))];
        const totals = cats.map(c => expenseTxs.filter(t => t.category === c).reduce((s, t) => s + Math.abs(t.amount), 0));

        if (expenseChart) expenseChart.destroy();
        const ctx = document.getElementById('expense-chart').getContext('2d');
        if (cats.length > 0) {
            expenseChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: cats,
                    datasets: [{ data: totals, backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6'], borderWidth: 2 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20 } } } }
            });
        } else {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.textAlign = 'center';
            ctx.font = '16px Inter';
            ctx.fillStyle = '#64748b';
            ctx.fillText('No expense data to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    };

    // --- CORE LOGIC ---
    const switchTab = (type) => {
        form.dataset.currentType = type;
        const isExpense = type === 'expense';
        
        elements.tabIncome.classList.toggle('tab-active', !isExpense);
        elements.tabExpense.classList.toggle('tab-active', isExpense);

        elements.incomeSection.classList.toggle('hidden', isExpense);
        elements.expenseSection.classList.toggle('hidden', !isExpense);

        elements.formTitle.textContent = isExpense ? 'Add New Expense' : 'Add New Income';
        elements.submitBtn.textContent = isExpense ? 'Add Expense' : 'Add Income';
        elements.description.placeholder = isExpense ? 'e.g., Groceries' : 'e.g., Monthly Salary';
        updateCategoryDropdown(type);
        resetFormState();
    };
    
    const resetFormState = () => {
        form.reset();
        elements.idInput.value = '';
        const type = form.dataset.currentType;
        elements.formTitle.textContent = type === 'expense' ? 'Add New Expense' : 'Add New Income';
        elements.submitBtn.textContent = type === 'expense' ? 'Add Expense' : 'Add Income';
        elements.cancelBtn.classList.add('hidden');
        elements.date.valueAsDate = new Date();
    };
    
    const init = () => {
        renderLists();
        updateDashboard();
        renderCategoryBudgets();
        updateChart();
        switchTab('income'); // Set default tab to income
    };

    // --- GLOBAL HANDLERS for inline onclick ---
    window.app = {
        removeTransaction: (id) => {
            state.transactions = state.transactions.filter(t => t.id !== id);
            updateLocalStorage();
            init();
            showToast('Transaction removed.');
        },
        editTransaction: (id) => {
            const tx = state.transactions.find(t => t.id === id);
            switchTab(tx.type);
            elements.idInput.value = id;
            elements.description.value = tx.description;
            elements.amount.value = Math.abs(tx.amount);
            elements.date.value = tx.date;
            elements.category.value = tx.category;

            elements.formTitle.textContent = `Edit ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}`;
            elements.submitBtn.textContent = 'Update';
            elements.cancelBtn.classList.remove('hidden');
            elements.description.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // --- EVENT LISTENERS ---
    elements.tabIncome.addEventListener('click', () => switchTab('income'));
    elements.tabExpense.addEventListener('click', () => switchTab('expense'));

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (elements.description.value.trim() === '' || elements.amount.value.trim() === '') return;

        const type = form.dataset.currentType;
        const amount = parseFloat(elements.amount.value);
        const transactionData = {
            description: elements.description.value,
            amount: type === 'expense' ? -amount : amount,
            date: elements.date.value,
            type: type,
            category: elements.category.value
        };
        
        const id = elements.idInput.value;
        if (id) {
            const index = state.transactions.findIndex(t => t.id == id);
            state.transactions[index] = { id: parseInt(id), ...transactionData };
            showToast('Transaction updated!');
        } else {
            state.transactions.push({ id: generateID(), ...transactionData });
            showToast('Transaction added!');
        }
        updateLocalStorage();
        init();
        resetFormState();
    });
    
    elements.cancelBtn.addEventListener('click', resetFormState);

    elements.categoryBudgets.addEventListener('change', e => {
        if(e.target.classList.contains('budget-input')) {
            const category = e.target.dataset.category;
            const amount = parseFloat(e.target.value) || 0;
            if (amount >= 0) state.categoryBudgets[category] = amount;
            else delete state.categoryBudgets[category];
            updateLocalStorage();
            renderCategoryBudgets();
            showToast(`Budget for ${category} updated.`);
        }
    });

    init();
});