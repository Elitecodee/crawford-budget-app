// Category Management functionality for Crawford University Students
class CategoryManager {
  constructor() {
    this.categories = this.loadCategories()
    this.transactions = this.loadTransactions()
    this.init()
  }

  init() {
    // Check authentication
    if (!this.isLoggedIn()) {
      window.location.href = "login.html"
      return
    }

    this.setupEventListeners()
    this.updateCategoryDisplay()
    this.updateCategoryStats()
  }

  isLoggedIn() {
    return localStorage.getItem("authToken") !== null
  }

  loadCategories() {
    const saved = localStorage.getItem("customCategories")
    return saved ? JSON.parse(saved) : this.getDefaultStudentCategories()
  }

  loadTransactions() {
    const data = localStorage.getItem("financialData")
    return data ? JSON.parse(data) : { income: [], expenses: [] }
  }

  getDefaultStudentCategories() {
    return {
      expense: [
        { id: 1, name: "Food & Meals", icon: "fas fa-utensils", color: "red", isDefault: true },
        { id: 2, name: "Transportation", icon: "fas fa-bus", color: "blue", isDefault: true },
        { id: 3, name: "Textbooks & Materials", icon: "fas fa-book", color: "green", isDefault: true },
        { id: 4, name: "Accommodation", icon: "fas fa-home", color: "purple", isDefault: true },
        { id: 5, name: "Internet & Data", icon: "fas fa-wifi", color: "yellow", isDefault: true },
        { id: 6, name: "Stationery", icon: "fas fa-pen", color: "pink", isDefault: true },
        { id: 7, name: "Laundry", icon: "fas fa-tshirt", color: "indigo", isDefault: true },
        { id: 8, name: "Entertainment", icon: "fas fa-film", color: "orange", isDefault: true },
        { id: 9, name: "Clothing", icon: "fas fa-shopping-bag", color: "teal", isDefault: true },
        { id: 10, name: "Healthcare", icon: "fas fa-heartbeat", color: "rose", isDefault: true },
        { id: 11, name: "Other", icon: "fas fa-question", color: "gray", isDefault: true },
      ],
      income: [
        { id: 1, name: "Monthly Allowance", icon: "fas fa-wallet", color: "green", isDefault: true },
        { id: 2, name: "Scholarship", icon: "fas fa-graduation-cap", color: "blue", isDefault: true },
        { id: 3, name: "Part-time Job", icon: "fas fa-briefcase", color: "purple", isDefault: true },
        { id: 4, name: "Gift/Support", icon: "fas fa-gift", color: "pink", isDefault: true },
        { id: 5, name: "Freelance Work", icon: "fas fa-laptop", color: "orange", isDefault: true },
        { id: 6, name: "Other", icon: "fas fa-hand-holding-usd", color: "yellow", isDefault: true },
      ],
    }
  }

  saveCategories() {
    localStorage.setItem("customCategories", JSON.stringify(this.categories))
  }

  setupEventListeners() {
    // Add category buttons
    document.getElementById("addExpenseCategoryBtn").addEventListener("click", () => {
      this.showCategoryModal("expense")
    })

    document.getElementById("addIncomeCategoryBtn").addEventListener("click", () => {
      this.showCategoryModal("income")
    })

    // Cancel button
    document.getElementById("cancelCategoryBtn").addEventListener("click", () => {
      this.hideCategoryModal()
    })

    // Category form submission
    document.getElementById("categoryForm").addEventListener("submit", (e) => {
      this.handleCategorySubmit(e)
    })

    // Color selection
    document.querySelectorAll(".color-option").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault()
        document.querySelectorAll(".color-option").forEach((btn) => btn.classList.remove("ring-2", "ring-gray-400"))
        button.classList.add("ring-2", "ring-gray-400")
        document.getElementById("categoryColor").value = button.dataset.color
      })
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("bg-opacity-50")) {
        this.hideCategoryModal()
      }
    })
  }

  showCategoryModal(type, category = null) {
    const modal = document.getElementById("categoryModal")
    const title = document.getElementById("modalTitle")
    const typeInput = document.getElementById("categoryType")

    typeInput.value = type
    title.textContent = category ? "Edit Category" : `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Category`

    if (category) {
      document.getElementById("categoryName").value = category.name
      document.getElementById("categoryIcon").value = category.icon
      document.getElementById("categoryColor").value = category.color
      document.getElementById("editingCategoryId").value = category.id

      // Update color selection
      document.querySelectorAll(".color-option").forEach((btn) => btn.classList.remove("ring-2", "ring-gray-400"))
      document.querySelector(`[data-color="${category.color}"]`).classList.add("ring-2", "ring-gray-400")
    } else {
      document.getElementById("categoryForm").reset()
      document.getElementById("editingCategoryId").value = ""
      document.getElementById("categoryColor").value = "blue"
      document.querySelector('[data-color="blue"]').classList.add("ring-2", "ring-gray-400")
    }

    modal.classList.remove("hidden")
  }

  hideCategoryModal() {
    document.getElementById("categoryModal").classList.add("hidden")
    document.getElementById("categoryForm").reset()
  }

  handleCategorySubmit(e) {
    e.preventDefault()

    const name = document.getElementById("categoryName").value
    const icon = document.getElementById("categoryIcon").value
    const color = document.getElementById("categoryColor").value
    const type = document.getElementById("categoryType").value
    const editingId = document.getElementById("editingCategoryId").value

    const category = {
      id: editingId ? Number.parseInt(editingId) : Date.now(),
      name,
      icon,
      color,
      isDefault: false,
    }

    if (editingId) {
      // Edit existing category
      const index = this.categories[type].findIndex((c) => c.id === Number.parseInt(editingId))
      if (index >= 0) {
        this.categories[type][index] = category
      }
    } else {
      // Add new category
      this.categories[type].push(category)
    }

    this.saveCategories()
    this.updateCategoryDisplay()
    this.updateCategoryStats()
    this.hideCategoryModal()
  }

  updateCategoryDisplay() {
    this.updateExpenseCategories()
    this.updateIncomeCategories()
  }

  updateExpenseCategories() {
    const container = document.getElementById("expenseCategories")
    container.innerHTML = this.categories.expense
      .map(
        (category) => `
        <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-${category.color}-100 rounded-full flex items-center justify-center mr-3">
              <i class="${category.icon} text-${category.color}-600"></i>
            </div>
            <span class="font-medium text-gray-900">${category.name}</span>
          </div>
          <div class="flex space-x-2">
            <button onclick="categoryManager.editCategory('expense', ${category.id})" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-edit"></i>
            </button>
            ${
              !category.isDefault
                ? `<button onclick="categoryManager.deleteCategory('expense', ${category.id})" class="text-gray-400 hover:text-red-600">
                <i class="fas fa-trash"></i>
              </button>`
                : ""
            }
          </div>
        </div>
      `,
      )
      .join("")
  }

  updateIncomeCategories() {
    const container = document.getElementById("incomeCategories")
    container.innerHTML = this.categories.income
      .map(
        (category) => `
        <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-${category.color}-100 rounded-full flex items-center justify-center mr-3">
              <i class="${category.icon} text-${category.color}-600"></i>
            </div>
            <span class="font-medium text-gray-900">${category.name}</span>
          </div>
          <div class="flex space-x-2">
            <button onclick="categoryManager.editCategory('income', ${category.id})" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-edit"></i>
            </button>
            ${
              !category.isDefault
                ? `<button onclick="categoryManager.deleteCategory('income', ${category.id})" class="text-gray-400 hover:text-red-600">
                <i class="fas fa-trash"></i>
              </button>`
                : ""
            }
          </div>
        </div>
      `,
      )
      .join("")
  }

  updateCategoryStats() {
    const container = document.getElementById("categoryStats")
    const stats = this.calculateCategoryStats()

    container.innerHTML = stats
      .map(
        (stat) => `
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 bg-${stat.color}-100 rounded-full flex items-center justify-center mr-2">
              <i class="${stat.icon} text-${stat.color}-600 text-sm"></i>
            </div>
            <span class="font-medium text-gray-900">${stat.name}</span>
          </div>
          <div class="text-2xl font-bold text-gray-900">${this.formatCurrency(stat.total)}</div>
          <div class="text-sm text-gray-500">${stat.count} transactions</div>
        </div>
      `,
      )
      .join("")
  }

  calculateCategoryStats() {
    const stats = []

    // Calculate expense category stats
    this.categories.expense.forEach((category) => {
      const categoryKey = category.name.toLowerCase().replace(/\s+/g, "").replace(/&/g, "")
      const categoryTransactions = this.transactions.expenses.filter(
        (t) => t.category === categoryKey || t.category === category.name.toLowerCase().replace(/\s+/g, ""),
      )
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)

      if (total > 0) {
        stats.push({
          name: category.name,
          icon: category.icon,
          color: category.color,
          total,
          count: categoryTransactions.length,
          type: "expense",
        })
      }
    })

    // Calculate income category stats
    this.categories.income.forEach((category) => {
      const categoryKey = category.name.toLowerCase().replace(/\s+/g, "").replace(/&/g, "")
      const categoryTransactions = this.transactions.income.filter(
        (t) => t.category === categoryKey || t.category === category.name.toLowerCase().replace(/\s+/g, ""),
      )
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)

      if (total > 0) {
        stats.push({
          name: category.name,
          icon: category.icon,
          color: category.color,
          total,
          count: categoryTransactions.length,
          type: "income",
        })
      }
    })

    return stats.sort((a, b) => b.total - a.total)
  }

  editCategory(type, categoryId) {
    const category = this.categories[type].find((c) => c.id === categoryId)
    if (category) {
      this.showCategoryModal(type, category)
    }
  }

  deleteCategory(type, categoryId) {
    const category = this.categories[type].find((c) => c.id === categoryId)
    if (category && !category.isDefault) {
      if (confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
        this.categories[type] = this.categories[type].filter((c) => c.id !== categoryId)
        this.saveCategories()
        this.updateCategoryDisplay()
        this.updateCategoryStats()
      }
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  logout() {
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    window.location.href = "login.html"
  }
}

// Initialize category manager when DOM is loaded
let categoryManager
document.addEventListener("DOMContentLoaded", () => {
  categoryManager = new CategoryManager()
})
