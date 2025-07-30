// Budget Planning functionality
class BudgetManager {
  constructor() {
    this.budgets = this.loadBudgets()
    this.expenses = this.loadExpenses()
    this.init()
  }

  init() {
    // Check authentication
    if (!this.isLoggedIn()) {
      window.location.href = "login.html"
      return
    }

    this.setupEventListeners()
    this.updateBudgetDisplay()
  }

  isLoggedIn() {
    return localStorage.getItem("authToken") !== null
  }

  loadBudgets() {
    const data = localStorage.getItem("financialData")
    return data ? JSON.parse(data).budgets || [] : []
  }

  loadExpenses() {
    const data = localStorage.getItem("financialData")
    return data ? JSON.parse(data).expenses || [] : []
  }

  saveBudgets() {
    const data = JSON.parse(localStorage.getItem("financialData") || '{"income":[],"expenses":[],"budgets":[]}')
    data.budgets = this.budgets
    localStorage.setItem("financialData", JSON.stringify(data))
  }

  setupEventListeners() {
    // Add budget button
    document.getElementById("addBudgetBtn").addEventListener("click", () => {
      document.getElementById("budgetModal").classList.remove("hidden")
    })

    // Cancel budget button
    document.getElementById("cancelBudgetBtn").addEventListener("click", () => {
      document.getElementById("budgetModal").classList.add("hidden")
    })

    // Budget form submission
    document.getElementById("budgetForm").addEventListener("submit", (e) => {
      this.handleBudgetSubmit(e)
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("bg-opacity-50")) {
        document.getElementById("budgetModal").classList.add("hidden")
      }
    })
  }

  handleBudgetSubmit(e) {
    e.preventDefault()

    const category = document.getElementById("budgetCategory").value
    const amount = Number.parseFloat(document.getElementById("budgetAmount").value)
    const period = document.getElementById("budgetPeriod").value

    // Check if budget already exists for this category
    const existingIndex = this.budgets.findIndex((b) => b.category === category)

    const budget = {
      id: existingIndex >= 0 ? this.budgets[existingIndex].id : Date.now(),
      category,
      amount,
      period,
      createdAt: existingIndex >= 0 ? this.budgets[existingIndex].createdAt : new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      this.budgets[existingIndex] = budget
    } else {
      this.budgets.push(budget)
    }

    this.saveBudgets()
    this.updateBudgetDisplay()

    // Close modal and reset form
    document.getElementById("budgetModal").classList.add("hidden")
    document.getElementById("budgetForm").reset()
  }

  updateBudgetDisplay() {
    this.updateBudgetOverview()
    this.updateBudgetCategories()
  }

  updateBudgetOverview() {
    const totalBudget = this.budgets.reduce((sum, budget) => {
      return sum + this.convertToMonthly(budget.amount, budget.period)
    }, 0)

    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyExpenses = this.expenses
      .filter((expense) => expense.date.startsWith(currentMonth))
      .reduce((sum, expense) => sum + expense.amount, 0)

    const remaining = totalBudget - monthlyExpenses

    document.getElementById("totalBudget").textContent = this.formatCurrency(totalBudget)
    document.getElementById("totalSpent").textContent = this.formatCurrency(monthlyExpenses)
    document.getElementById("totalRemaining").textContent = this.formatCurrency(remaining)

    // Update remaining color
    const remainingEl = document.getElementById("totalRemaining")
    remainingEl.className = remaining >= 0 ? "text-2xl font-bold text-green-600" : "text-2xl font-bold text-red-600"
  }

  updateBudgetCategories() {
    const container = document.getElementById("budgetCategories")

    if (this.budgets.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-calculator text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-500">No budgets set yet. Add your first budget to get started!</p>
        </div>
      `
      return
    }

    const currentMonth = new Date().toISOString().slice(0, 7)

    container.innerHTML = this.budgets
      .map((budget) => {
        const monthlyBudget = this.convertToMonthly(budget.amount, budget.period)
        const spent = this.expenses
          .filter((expense) => expense.date.startsWith(currentMonth) && expense.category === budget.category)
          .reduce((sum, expense) => sum + expense.amount, 0)

        const remaining = monthlyBudget - spent
        const percentage = monthlyBudget > 0 ? Math.min((spent / monthlyBudget) * 100, 100) : 0
        const isOverBudget = spent > monthlyBudget

        return `
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-medium text-gray-900">${this.formatCategory(budget.category)}</h4>
              <p class="text-sm text-gray-500">${this.formatCurrency(monthlyBudget)} ${budget.period}</p>
            </div>
            <div class="flex space-x-2">
              <button onclick="budgetManager.editBudget(${budget.id})" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="budgetManager.deleteBudget(${budget.id})" class="text-gray-400 hover:text-red-600">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="mb-2">
            <div class="flex justify-between text-sm">
              <span>Spent: ${this.formatCurrency(spent)}</span>
              <span class="${isOverBudget ? "text-red-600" : "text-green-600"}">
                ${isOverBudget ? "Over by " : "Remaining: "}${this.formatCurrency(Math.abs(remaining))}
              </span>
            </div>
          </div>
          
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="h-2 rounded-full transition-all duration-300 ${isOverBudget ? "bg-red-500" : "bg-green-500"}" 
                 style="width: ${percentage}%"></div>
          </div>
          
          <div class="mt-2 text-xs text-gray-500">
            ${percentage.toFixed(1)}% of budget used
          </div>
        </div>
      `
      })
      .join("")
  }

  convertToMonthly(amount, period) {
    switch (period) {
      case "weekly":
        return amount * 4.33 // Average weeks per month
      case "yearly":
        return amount / 12
      case "monthly":
      default:
        return amount
    }
  }

  editBudget(budgetId) {
    const budget = this.budgets.find((b) => b.id === budgetId)
    if (!budget) return

    // Populate form with existing data
    document.getElementById("budgetCategory").value = budget.category
    document.getElementById("budgetAmount").value = budget.amount
    document.getElementById("budgetPeriod").value = budget.period

    // Show modal
    document.getElementById("budgetModal").classList.remove("hidden")
  }

  deleteBudget(budgetId) {
    if (confirm("Are you sure you want to delete this budget?")) {
      this.budgets = this.budgets.filter((b) => b.id !== budgetId)
      this.saveBudgets()
      this.updateBudgetDisplay()
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, " $1")
  }

  logout() {
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    window.location.href = "login.html"
  }
}

// Initialize budget manager when DOM is loaded
let budgetManager
document.addEventListener("DOMContentLoaded", () => {
  budgetManager = new BudgetManager()
})
