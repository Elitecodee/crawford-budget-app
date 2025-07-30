import { Chart } from "@/components/ui/chart"
// Dashboard functionality for Crawford University Students
class FinancialTracker {
  constructor() {
    this.data = this.loadData()
    this.charts = {}
    this.init()
  }

  init() {
    // Check authentication
    if (!this.isLoggedIn()) {
      window.location.href = "login.html"
      return
    }

    this.setupEventListeners()
    this.updateDashboard()
    this.initCharts()
    this.setDefaultDates()
  }

  isLoggedIn() {
    return localStorage.getItem("authToken") !== null
  }

  loadData() {
    const saved = localStorage.getItem("financialData")
    return saved
      ? JSON.parse(saved)
      : {
          income: [],
          expenses: [],
          budgets: [],
        }
  }

  saveData() {
    localStorage.setItem("financialData", JSON.stringify(this.data))
  }

  setupEventListeners() {
    // Modal controls
    document.getElementById("addIncomeBtn").addEventListener("click", () => {
      document.getElementById("incomeModal").classList.remove("hidden")
    })

    document.getElementById("addExpenseBtn").addEventListener("click", () => {
      document.getElementById("expenseModal").classList.remove("hidden")
    })

    document.getElementById("cancelIncomeBtn").addEventListener("click", () => {
      document.getElementById("incomeModal").classList.add("hidden")
    })

    document.getElementById("cancelExpenseBtn").addEventListener("click", () => {
      document.getElementById("expenseModal").classList.add("hidden")
    })

    // Form submissions
    document.getElementById("incomeForm").addEventListener("submit", (e) => {
      this.handleIncomeSubmit(e)
    })

    document.getElementById("expenseForm").addEventListener("submit", (e) => {
      this.handleExpenseSubmit(e)
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("bg-opacity-50")) {
        document.getElementById("incomeModal").classList.add("hidden")
        document.getElementById("expenseModal").classList.add("hidden")
      }
    })

    // Import button
    document.getElementById("importBtn").addEventListener("click", () => {
      window.location.href = "import.html"
    })

    // Export button
    document.getElementById("exportBtn").addEventListener("click", () => {
      this.showExportOptions()
    })
  }

  setDefaultDates() {
    const today = new Date().toISOString().split("T")[0]
    document.getElementById("incomeDate").value = today
    document.getElementById("expenseDate").value = today
  }

  handleIncomeSubmit(e) {
    e.preventDefault()

    const income = {
      id: Date.now(),
      amount: Number.parseFloat(document.getElementById("incomeAmount").value),
      description: document.getElementById("incomeDescription").value,
      category: document.getElementById("incomeCategory").value,
      date: document.getElementById("incomeDate").value,
      type: "income",
    }

    this.data.income.push(income)
    this.saveData()
    this.updateDashboard()

    // Close modal and reset form
    document.getElementById("incomeModal").classList.add("hidden")
    document.getElementById("incomeForm").reset()
    this.setDefaultDates()
  }

  handleExpenseSubmit(e) {
    e.preventDefault()

    const expense = {
      id: Date.now(),
      amount: Number.parseFloat(document.getElementById("expenseAmount").value),
      description: document.getElementById("expenseDescription").value,
      category: document.getElementById("expenseCategory").value,
      date: document.getElementById("expenseDate").value,
      type: "expense",
    }

    this.data.expenses.push(expense)
    this.saveData()
    this.updateDashboard()

    // Close modal and reset form
    document.getElementById("expenseModal").classList.add("hidden")
    document.getElementById("expenseForm").reset()
    this.setDefaultDates()
  }

  updateDashboard() {
    this.updateStats()
    this.updateTransactionsList()
    this.updateCharts()
    this.generateAIInsights()
  }

  updateStats() {
    const totalIncome = this.data.income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = this.data.expenses.reduce((sum, item) => sum + item.amount, 0)
    const netBalance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

    document.getElementById("totalIncome").textContent = this.formatCurrency(totalIncome)
    document.getElementById("totalExpenses").textContent = this.formatCurrency(totalExpenses)
    document.getElementById("netBalance").textContent = this.formatCurrency(netBalance)
    document.getElementById("savingsRate").textContent = savingsRate.toFixed(1) + "%"

    // Update net balance color
    const netBalanceEl = document.getElementById("netBalance")
    netBalanceEl.className =
      netBalance >= 0 ? "text-sm md:text-lg font-medium text-green-600" : "text-sm md:text-lg font-medium text-red-600"
  }

  updateTransactionsList() {
    const tbody = document.getElementById("transactionsList")
    const allTransactions = [...this.data.income, ...this.data.expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10) // Show last 10 transactions

    if (allTransactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No transactions yet</td></tr>'
      return
    }

    tbody.innerHTML = allTransactions
      .map(
        (transaction) => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatDate(transaction.date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.description}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${this.formatCategory(transaction.category)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}">
                    ${transaction.type === "income" ? "+" : "-"}${this.formatCurrency(transaction.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                        ${transaction.type}
                    </span>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  initCharts() {
    // Category Chart
    const categoryCtx = document.getElementById("categoryChart").getContext("2d")
    this.charts.category = new Chart(categoryCtx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })

    // Trend Chart
    const trendCtx = document.getElementById("trendChart").getContext("2d")
    this.charts.trend = new Chart(trendCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Income",
            data: [],
            borderColor: "#22C55E",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            tension: 0.4,
          },
          {
            label: "Expenses",
            data: [],
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "₦" + value.toLocaleString(),
            },
          },
        },
      },
    })
  }

  updateCharts() {
    this.updateCategoryChart()
    this.updateTrendChart()
  }

  updateCategoryChart() {
    const categoryData = {}

    this.data.expenses.forEach((expense) => {
      categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount
    })

    const labels = Object.keys(categoryData)
    const data = Object.values(categoryData)

    this.charts.category.data.labels = labels.map((label) => this.formatCategory(label))
    this.charts.category.data.datasets[0].data = data
    this.charts.category.update()
  }

  updateTrendChart() {
    // Get last 6 months of data
    const months = []
    const incomeData = []
    const expenseData = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format

      months.push(date.toLocaleDateString("en-US", { month: "short", year: "numeric" }))

      const monthIncome = this.data.income
        .filter((item) => item.date.startsWith(monthKey))
        .reduce((sum, item) => sum + item.amount, 0)

      const monthExpenses = this.data.expenses
        .filter((item) => item.date.startsWith(monthKey))
        .reduce((sum, item) => sum + item.amount, 0)

      incomeData.push(monthIncome)
      expenseData.push(monthExpenses)
    }

    this.charts.trend.data.labels = months
    this.charts.trend.data.datasets[0].data = incomeData
    this.charts.trend.data.datasets[1].data = expenseData
    this.charts.trend.update()
  }

  generateAIInsights() {
    const aiAnalysis = new window.AIAnalysis(this.data)
    const insights = aiAnalysis.generateInsights()

    const insightsContainer = document.getElementById("aiInsights")
    insightsContainer.innerHTML = insights
      .map(
        (insight) => `
          <div class="bg-${insight.type === "warning" ? "yellow" : insight.type === "success" ? "green" : "blue"}-50 border-l-4 border-${insight.type === "warning" ? "yellow" : insight.type === "success" ? "green" : "blue"}-400 p-4">
              <div class="flex">
                  <div class="flex-shrink-0">
                      <i class="fas fa-${insight.icon} text-${insight.type === "warning" ? "yellow" : insight.type === "success" ? "green" : "blue"}-400"></i>
                  </div>
                  <div class="ml-3">
                      <p class="text-sm text-${insight.type === "warning" ? "yellow" : insight.type === "success" ? "green" : "blue"}-700">${insight.message}</p>
                  </div>
              </div>
          </div>
      `,
      )
      .join("")
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-NG")
  }

  formatCategory(category) {
    const categoryMap = {
      allowance: "Monthly Allowance",
      scholarship: "Scholarship",
      parttime: "Part-time Job",
      gift: "Gift/Support",
      freelance: "Freelance Work",
      food: "Food & Meals",
      transportation: "Transportation",
      textbooks: "Textbooks & Materials",
      accommodation: "Accommodation",
      entertainment: "Entertainment",
      clothing: "Clothing",
      healthcare: "Healthcare",
      internet: "Internet & Data",
      laundry: "Laundry",
      stationery: "Stationery",
      other: "Other",
    }

    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, " $1")
  }

  logout() {
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    window.location.href = "login.html"
  }

  showExportOptions() {
    const options = [
      { label: "Export All Data (CSV)", action: () => this.exportData("csv", "all") },
      { label: "Export Income (CSV)", action: () => this.exportData("csv", "income") },
      { label: "Export Expenses (CSV)", action: () => this.exportData("csv", "expenses") },
      { label: "Export as JSON", action: () => this.exportData("json") },
      { label: "Generate PDF Report", action: () => this.exportData("pdf") },
    ]

    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    modal.innerHTML = `
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
        <div class="space-y-2">
          ${options
            .map(
              (option, index) => `
            <button class="export-option w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 transition-colors" data-index="${index}">
              ${option.label}
            </button>
          `,
            )
            .join("")}
        </div>
        <div class="flex justify-end mt-6">
          <button class="cancel-export px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    </div>
  `

    document.body.appendChild(modal)

    // Add event listeners
    modal.querySelectorAll(".export-option").forEach((btn, index) => {
      btn.addEventListener("click", () => {
        options[index].action()
        document.body.removeChild(modal)
      })
    })

    modal.querySelector(".cancel-export").addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  exportData(format, type = "all") {
    const exporter = new window.DataExporter()

    switch (format) {
      case "csv":
        exporter.exportToCSV(type)
        break
      case "json":
        exporter.exportToJSON()
        break
      case "pdf":
        exporter.exportToPDF()
        break
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new FinancialTracker()
})
