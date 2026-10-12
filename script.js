const formTitle = document.querySelector('#form-title');
const descriptionInput = document.querySelector('#description');
const amountInput = document.querySelector('#amount');
const typeInput = document.querySelector('#type');
const categoryInput = document.querySelector('#category');
const dateInput = document.querySelector('#date');
const addButton = document.querySelector('#add-button');
const cancelButton = document.querySelector('#cancel-button');

const incomeTotal = document.querySelector('#income-total');
const expenseTotal = document.querySelector('#expense-total');
const balanceTotal = document.querySelector('#balance-total');

const transactionsList = document.querySelector('#transactions-list');

const searchInput = document.querySelector('#search-input');
const typeFilter = document.querySelector('#type-filter');
const categoryFilter = document.querySelector('#category-filter');
const sortFilter = document.querySelector('#sort-filter');

const clearAllButton = document.querySelector('#clear-all-button');
const exportButton = document.querySelector('#export-button');

const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

let editingIndex = null ;
cancelButton.style.display = 'none';


function updateSummary() {

    let income = 0 ;
    let expenses = 0 ;

    transactions.forEach((transaction) => {

        if(transaction.type === 'income')
            income += transaction.amount ;
        
        if(transaction.type === 'expense')
            expenses += transaction.amount ;

    });

    const balance = income - expenses ;

    incomeTotal.textContent = `₹${income}`;
    expenseTotal.textContent = `₹${expenses}`;
    balanceTotal.textContent = `₹${balance}`;

    if(balance < 0)
        balanceTotal.style.color = '#d93045' ;
    else if (balance > 0)
        balanceTotal.style.color = '#16803c';
    else
        balanceTotal.style.color = '#333333';

}

function displayTransactions() {

    transactionsList.innerHTML = '';

    const searchText = searchInput.value.toLowerCase();
    const selectedType = typeFilter.value ;
    const selectedCategory = categoryFilter.value ;

    const filteredTransactions = transactions
        .map((transaction , index) => ({ transaction , index}))
        .filter((item) => {

            const transaction = item.transaction ;

            const matchesSearch = 
                transaction.description.toLowerCase().includes(searchText) ||
                transaction.category.toLowerCase().includes(searchText);

            const matchesType = selectedType === 'all' ||
                              transaction.type === selectedType ;

            const matchesCategory = selectedCategory === 'all' || 
                                transaction.category === selectedCategory ;
            
            
            return matchesSearch && matchesType && matchesCategory ; 
        });

    filteredTransactions.sort((a , b) => {

                const sortValue = sortFilter.value ;

                if(sortValue === 'newest') {
                    return new Date(b.transaction.date) - new Date(a.transaction.date);
                }

                if(sortValue === 'oldest') {
                    return new Date(a.transaction.date) - new Date(b.transaction.date);
                }

                if(sortValue === 'highest') {
                    return b.transaction.amount - a.transaction.amount ;
                }

                if(sortValue === 'lowest') {
                    return a.transaction.amount - b.transaction.amount;
                }

    });

    filteredTransactions.forEach((item) => {

        const transaction = item.transaction ;
        const index = item.index ;

        const transactionElement = document.createElement('div');

        transactionElement.classList.add('transaction-card');

        const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN' , {
            day : '2-digit',
            month : 'short' ,
            year : 'numeric'
        });

        transactionElement.innerHTML = `
            <div>
                <strong class="transaction-description"></strong>
                <p class="transaction-category"></p>
                <small>${formattedDate}</small>
            </div>

            <div>
                <strong class="${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ₹${transaction.amount}
                </strong>

                <button onclick="editTransaction(${index})">
                    Edit
                </button>

                <button onclick="deleteTransaction(${index})">
                    Delete
                </button>
                
            </div>
        `;

        transactionElement.querySelector('.transaction-description').textContent = 
            transaction.description;
        
        transactionElement.querySelector('.transaction-category').textContent = 
            transaction.category ;

        transactionsList.appendChild(transactionElement);

    });
}

addButton.addEventListener('click' , () => {
    const description = descriptionInput.value.trim() ;
    const amount = Number(amountInput.value) ;
    const type = typeInput.value ;
    const category = categoryInput.value ;
    const date = dateInput.value ;

    if(description === '') {
        alert('Please enter a description');
        return ;
    }

    if(amount <= 0) {
        alert('Please enter an amount greater than 0');
        return;
    }

    if(date === ''){
        alert('Please select a date');
        return;
    }

    const transaction = {
        description : description ,
        amount : amount , 
        type : type , 
        category : category , 
        date : date
    };

    if (editingIndex === null)
        transactions.push(transaction);
    else
        transactions[editingIndex] = transaction ;

    localStorage.setItem('transactions' , JSON.stringify(transactions));

    updateSummary();

    displayTransactions();

    updateIncomeExpenseChart();

    updateCategoryChart();

    editingIndex = null ;
    addButton.textContent = 'Add';
    cancelButton.style.display = 'none';
    formTitle.textContent = 'Add transactions';

    descriptionInput.value = '';
    amountInput.value = '';
    typeInput.value = 'income';
    categoryInput.value = 'food';
    dateInput.value = '';

});

function deleteTransaction(index) {

    transactions.splice(index, 1);

    localStorage.setItem('transactions' , JSON.stringify(transactions));

    updateSummary();

    displayTransactions();
    
    updateIncomeExpenseChart();

    updateCategoryChart();
}

clearAllButton.addEventListener('click' , () => {

    const confirmDelete = confirm('Are you sure you want to delete all transaction?');

    if(!confirmDelete){
        return;
    }

    transactions.length = 0;

    localStorage.removeItem('transactions');

    editingIndex = null ;

    updateSummary();

    displayTransactions();

    updateIncomeExpenseChart();

    updateCategoryChart();
});

function escapeCSV(value) {
    return `"${String(value).replace(/"/g,'""')}"`;
}

exportButton.addEventListener('click' , () => {

    if(transactions.length === 0) {
        alert('There is no transacton to export.');
        return;
    }

    let csv = 'Description , Amount , Type , Category , Date\n';

    transactions.forEach((transaction) => {
        const row = [
            transaction.description,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.date,
        ].map(escapeCSV).join(',');
        
        csv += row + '\n' ;

    });

    const blob = new Blob([csv] , {
        type : 'text/csv'
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url ;
    link.download = 'expense-tracker.csv'

    link.click();

    URL.revokeObjectURL(url);

});


function editTransaction(index) {

    editingIndex = index ;

    const transaction = transactions[index];

    descriptionInput.value = transaction.description ;
    amountInput.value = transaction.amount ;
    typeInput.value = transaction.type ;
    categoryInput.value = transaction.category ;
    dateInput.value = transaction.date ;
    addButton.textContent = 'Update';
    cancelButton.style.display = 'inline-block';

    formTitle.textContent = 'Edit Tranasaction';

    document.querySelector('.transaction-form').scrollIntoView({
        behavior: 'smooth'
    });
}

cancelButton.addEventListener('click' , () => {
    editingIndex = null ;

    descriptionInput.value = '';
    amountInput.value = '';
    typeInput.value = 'income' ;
    categoryInput.value = 'food';
    dateInput.value = '' ;

    addButton.textContent = 'Add';
    cancelButton.style.display= 'none';
    formTitle.textContent = 'Add Transaction'
});

searchInput.addEventListener('input' , () => {
    displayTransactions();
});

typeFilter.addEventListener('change' , () => {
    displayTransactions();
})

categoryFilter.addEventListener('change' , () => {
    displayTransactions() ;
});

sortFilter.addEventListener('change' , () => {
    displayTransactions();
})


/* Chart Section */
const incomeExpenseCanvas = document.querySelector('#income-expense-chart');
const incomeChartEmpty = document.querySelector('#income-chart-empty');

const incomeExpenseChart = new Chart(incomeExpenseCanvas , {
    type : 'bar' ,

    data : {
        labels : ['Income' , 'Expenses'] ,

        datasets: [{
            label: 'Amount (₹)' ,
            data : [0 , 0] ,
            backgroundColor : [
                'rgb(46, 160, 67)' ,
                'rgb(217 , 83 , 95)'
            ],
            borderRadius: 8 
        }]
    },

    options : {
        responsive : true ,

        maintainAspectRatio : true , 

        plugins : {
            legend : {
                display : false  
            }
        },

        scales : {
            y : {
                beginAtZero : true , 
                ticks : {
                    precision : 0
                }
            }
        }
    }
});

/* Chart Section - Category */
const categoryCanvas = document.querySelector('#category-chart');
const categoryChartEmpty = document.querySelector('#category-chart-empty');

const categoryChart = new Chart(categoryCanvas , {
    type : 'doughnut' ,

    data : {
        labels : [] , 

        datasets : [{
            data : [] ,
            backgroundColor : [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ],
            borderWidth : 2
        }]
    } ,

    options : {
        responsive : true , 
        maintainAspectRatio : true ,

        plugins : {
            legend : { 
                    position : 'bottom' 
            }
        }
    }
});

function updateIncomeExpenseChart(){
    let income = 0 ;
    let expenses = 0 ;

    transactions.forEach((transaction) => {
        if(transaction.type === 'income') {
            income += transaction.amount ;
        }

        if(transaction.type === 'expense') {
            expenses += transaction.amount ;
        }
    });

    incomeExpenseChart.data.datasets[0].data = [
        income , 
        expenses
    ];

    incomeExpenseChart.update();

    const hasTransactions = transactions.length > 0 ;

    incomeChartEmpty.style.display = hasTransactions ? 'none' : 'block' ;
    incomeExpenseCanvas.style.display = hasTransactions ? 'block' : 'none' ;

}

function updateCategoryChart() {
    const categoryTotals = {};

    transactions.forEach((transaction) => {
        if(transaction.type === 'expense') {
            if(categoryTotals[transaction.category] === undefined) {
                categoryTotals[transaction.category] = 0 ;
            }

            categoryTotals[transaction.category] += transaction.amount ;
        }
    });

    categoryChart.data.labels = Object.keys(categoryTotals);

    categoryChart.data.datasets[0].data = Object.values(categoryTotals);

    categoryChart.update();

    const hasExpenses = Object.keys(categoryTotals).length > 0 ;

    categoryChartEmpty.style.display = hasExpenses ? 'none' : 'block' ;
    categoryCanvas.style.display = hasExpenses ? 'block' : 'none' ;

}






updateSummary();
displayTransactions();
updateIncomeExpenseChart();
updateCategoryChart();