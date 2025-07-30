// Bank Statement Import Manager
class ImportManager {
  constructor() {
    this.currentData = null
    this.parsedTransactions = []
    this.columnMapping = {}
    this.bankTemplates = {
      chase: {
        dateColumn: 0,
        descriptionColumn: 1,
        amountColumn: 2,
        dateFormat: "MM/DD/YYYY",
      },
      bofa: {
        dateColumn: 0,
        descriptionColumn: 1,
        amountColumn: 2,
        dateFormat: "MM/DD/YYYY",
      },
      wells: {
        dateColumn: 0,
        amountColumn: 1,
        descriptionColumn: 2,
        dateFormat: "MM/DD/YYYY",
      },
    }
    this.init()
  }

  init() {
    // Check authentication
    if (!this.isLoggedIn()) {
      window.location.href = "login.html"
      return
    }

    this.setupEventListeners()
    this.setupDragAndDrop()
  }

  isLoggedIn() {
    return localStorage.getItem("authToken") !== null
  }

  setupEventListeners() {
    // File input handlers
    document.getElementById("csvFileInput").addEventListener("change", (e) => {
      this.handleFileSelect(e.target.files[0], "csv")
    })

    document.getElementById("pdfFileInput").addEventListener("change", (e) => {
      this.handleFileSelect(e.target.files[0], "pdf")
    })

    // Column mapping handlers
    const mappingSelects = ["dateColumn", "descriptionColumn", "amountColumn", "categoryColumn"]
    mappingSelects.forEach((selectId) => {
      document.getElementById(selectId).addEventListener("change", () => {
        this.updateColumnMapping()
        this.updatePreview()
      })
    })

    // Action buttons
    document.getElementById("confirmImport").addEventListener("click", () => {
      this.importTransactions()
    })

    document.getElementById("cancelImport").addEventListener("click", () => {
      this.resetImport()
    })

    // Bank template buttons
    document.querySelectorAll(".bank-template").forEach((button) => {
      button.addEventListener("click", (e) => {
        const template = e.currentTarget.dataset.template
        this.applyBankTemplate(template)
      })
    })

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })
  }

  setupDragAndDrop() {
    // CSV Drop Zone
    const csvDropZone = document.getElementById("csvDropZone")
    csvDropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      csvDropZone.classList.add("border-green-400", "bg-green-50")
    })

    csvDropZone.addEventListener("dragleave", (e) => {
      e.preventDefault()
      csvDropZone.classList.remove("border-green-400", "bg-green-50")
    })

    csvDropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      csvDropZone.classList.remove("border-green-400", "bg-green-50")
      const file = e.dataTransfer.files[0]
      if (file && file.type === "text/csv") {
        this.handleFileSelect(file, "csv")
      }
    })

    // PDF Drop Zone
    const pdfDropZone = document.getElementById("pdfDropZone")
    pdfDropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      pdfDropZone.classList.add("border-red-400", "bg-red-50")
    })

    pdfDropZone.addEventListener("dragleave", (e) => {
      e.preventDefault()
      pdfDropZone.classList.remove("border-red-400", "bg-red-50")
    })

    pdfDropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      pdfDropZone.classList.remove("border-red-400", "bg-red-50")
      const file = e.dataTransfer.files[0]
      if (file && file.type === "application/pdf") {
        this.handleFileSelect(file, "pdf")
      }
    })
  }

  async handleFileSelect(file, type) {
    if (!file) return

    this.showProcessing(`Processing ${file.name}...`)

    try {
      if (type === "csv") {
        await this.processCSV(file)
      } else if (type === "pdf") {
        await this.processPDF(file)
      }
    } catch (error) {
      this.showError("Error processing file: " + error.message)
      this.hideProcessing()
    }
  }

  async processCSV(file) {
    const csvParser = new window.CSVParser() // Assuming CSVParser is a global object or imported correctly

    this.updateProgress(25, "Reading CSV file...")
    const csvData = await csvParser.parseFile(file)

    this.updateProgress(50, "Analyzing columns...")
    this.currentData = csvData

    this.updateProgress(75, "Preparing preview...")
    this.setupColumnMapping(csvData.headers)
    this.autoDetectColumns(csvData.headers)

    this.updateProgress(100, "Complete!")
    setTimeout(() => {
      this.hideProcessing()
      this.showPreview(csvData)
    }, 500)
  }

  async processPDF(file) {
    const pdfParser = new window.PDFParser() // Assuming PDFParser is a global object or imported correctly

    this.updateProgress(25, "Reading PDF file...")
    const pdfText = await pdfParser.extractText(file)

    this.updateProgress(50, "Extracting transactions...")
    const transactions = pdfParser.parseTransactions(pdfText)

    this.updateProgress(75, "Converting to CSV format...")
    const csvData = this.convertTransactionsToCSV(transactions)
    this.currentData = csvData

    this.updateProgress(100, "Complete!")
    setTimeout(() => {
      this.hideProcessing()
      this.showPreview(csvData)
    }, 500)
  }

  convertTransactionsToCSV(transactions) {
    const headers = ["Date", "Description", "Amount"]
    const rows = transactions.map((t) => [t.date, t.description, t.amount])

    return {
      headers,
      rows,
      rawData: transactions,
    }
  }

  setupColumnMapping(headers) {
    const selects = ["dateColumn", "descriptionColumn", "amountColumn", "categoryColumn"]

    selects.forEach((selectId) => {
      const select = document.getElementById(selectId)
      select.innerHTML = '<option value="">Select column...</option>'

      headers.forEach((header, index) => {
        const option = document.createElement("option")
        option.value = index
        option.textContent = header
        select.appendChild(option)
      })
    })
  }

  autoDetectColumns(headers) {
    // Auto-detect common column patterns
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase()

      if (lowerHeader.includes("date") || lowerHeader.includes("transaction date")) {
        document.getElementById("dateColumn").value = index
      } else if (
        lowerHeader.includes("description") ||
        lowerHeader.includes("memo") ||
        lowerHeader.includes("details")
      ) {
        document.getElementById("descriptionColumn").value = index
      } else if (lowerHeader.includes("amount") || lowerHeader.includes("debit") || lowerHeader.includes("credit")) {
        document.getElementById("amountColumn").value = index
      } else if (lowerHeader.includes("category") || lowerHeader.includes("type")) {
        document.getElementById("categoryColumn").value = index
      }
    })

    this.updateColumnMapping()
  }

  applyBankTemplate(templateName) {
    const template = this.bankTemplates[templateName]
    if (!template || !this.currentData) return

    document.getElementById("dateColumn").value = template.dateColumn
    document.getElementById("descriptionColumn").value = template.descriptionColumn
    document.getElementById("amountColumn").value = template.amountColumn

    this.updateColumnMapping()
    this.updatePreview()

    // Show success message
    this.showSuccess(`Applied ${templateName.toUpperCase()} template`)
  }

  updateColumnMapping() {
    this.columnMapping = {
      date: Number.parseInt(document.getElementById("dateColumn").value) || null,
      description: Number.parseInt(document.getElementById("descriptionColumn").value) || null,
      amount: Number.parseInt(document.getElementById("amountColumn").value) || null,
      category: Number.parseInt(document.getElementById("categoryColumn").value) || null,
    }
  }

  showPreview(data) {
    const previewSection = document.getElementById("previewSection")
    const previewHeader = document.getElementById("previewHeader")
    const previewBody = document.getElementById("previewBody")

    // Show preview section
    previewSection.classList.remove("hidden")

    // Populate header
    previewHeader.innerHTML = data.headers
      .map(
        (header) =>
          `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`,
      )
      .join("")

    // Populate preview rows (first 5 rows)
    const previewRows = data.rows.slice(0, 5)
    previewBody.innerHTML = previewRows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cell}</td>`).join("")}</tr>`,
      )
      .join("")

    // Update count
    document.getElementById("previewCount").textContent = data.rows.length

    this.updatePreview()
  }

  updatePreview() {
    if (
      !this.currentData ||
      !this.columnMapping.date ||
      !this.columnMapping.description ||
      !this.columnMapping.amount
    ) {
      return
    }

    // Parse transactions based on column mapping
    this.parsedTransactions = this.currentData.rows
      .map((row, index) => {
        try {
          const date = this.parseDate(row[this.columnMapping.date])
          const description = row[this.columnMapping.description] || "Unknown Transaction"
          const amount = this.parseAmount(row[this.columnMapping.amount])
          const category = this.columnMapping.category
            ? row[this.columnMapping.category]
            : this.categorizeTransaction(description)

          return {
            id: Date.now() + index,
            date: date,
            description: description.trim(),
            amount: amount,
            category: category || "other",
            type: amount >= 0 ? "income" : "expense",
            source: "import",
          }
        } catch (error) {
          console.warn("Error parsing row:", row, error)
          return null
        }
      })
      .filter((transaction) => transaction !== null)

    // Update preview with parsed data
    this.updateParsedPreview()
  }

  updateParsedPreview() {
    const previewBody = document.getElementById("previewBody")
    const previewRows = this.parsedTransactions.slice(0, 5)

    previewBody.innerHTML = previewRows
      .map(
        (transaction) => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.date}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.description}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}">
          ${transaction.type === "income" ? "+" : ""}${this.formatCurrency(Math.abs(transaction.amount))}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${this.formatCategory(transaction.category)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
            ${transaction.type}
          </span>
        </td>
      </tr>
    `,
      )
      .join("")

    // Update header for parsed view
    const previewHeader = document.getElementById("previewHeader")
    previewHeader.innerHTML = `
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
    `

    document.getElementById("previewCount").textContent = this.parsedTransactions.length
  }

  parseDate(dateStr) {
    if (!dateStr) throw new Error("Invalid date")

    // Try multiple date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
    ]

    let date
    if (formats[0].test(dateStr)) {
      date = new Date(dateStr)
    } else if (formats[1].test(dateStr) || formats[3].test(dateStr)) {
      const [month, day, year] = dateStr.split("/")
      date = new Date(year, month - 1, day)
    } else if (formats[2].test(dateStr)) {
      const [month, day, year] = dateStr.split("-")
      date = new Date(year, month - 1, day)
    } else {
      date = new Date(dateStr)
    }

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format")
    }

    return date.toISOString().split("T")[0]
  }

  parseAmount(amountStr) {
    if (!amountStr) throw new Error("Invalid amount")

    // Remove currency symbols and spaces
    let cleanAmount = amountStr.toString().replace(/[$,\s]/g, "")

    // Handle parentheses for negative amounts
    if (cleanAmount.includes("(") && cleanAmount.includes(")")) {
      cleanAmount = "-" + cleanAmount.replace(/[()]/g, "")
    }

    const amount = Number.parseFloat(cleanAmount)
    if (isNaN(amount)) {
      throw new Error("Invalid amount format")
    }

    return amount
  }

  categorizeTransaction(description) {
    const desc = description.toLowerCase()

    // Simple categorization rules
    if (desc.includes("grocery") || desc.includes("food") || desc.includes("restaurant")) {
      return "food"
    } else if (desc.includes("gas") || desc.includes("fuel") || desc.includes("transport")) {
      return "transportation"
    } else if (desc.includes("salary") || desc.includes("payroll") || desc.includes("deposit")) {
      return "salary"
    } else if (desc.includes("entertainment") || desc.includes("movie") || desc.includes("netflix")) {
      return "entertainment"
    } else if (desc.includes("shopping") || desc.includes("amazon") || desc.includes("store")) {
      return "shopping"
    } else if (desc.includes("bill") || desc.includes("utility") || desc.includes("electric")) {
      return "bills"
    }

    return "other"
  }

  async importTransactions() {
    if (!this.parsedTransactions.length) {
      this.showError("No transactions to import")
      return
    }

    this.showProcessing("Importing transactions...")

    try {
      const authToken = localStorage.getItem("authToken")

      const response = await fetch("api/transactions.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "bulk_import",
          transactions: this.parsedTransactions,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local storage with new data
        const existingData = this.loadFinancialData()

        this.parsedTransactions.forEach((transaction) => {
          if (transaction.type === "income") {
            existingData.income.push({
              ...transaction,
              amount: Math.abs(transaction.amount),
            })
          } else {
            existingData.expenses.push({
              ...transaction,
              amount: Math.abs(transaction.amount),
            })
          }
        })

        this.saveFinancialData(existingData)

        // Show results
        this.hideProcessing()
        this.showImportResults(result.imported, result.duplicates, result.errors)
      } else {
        throw new Error(result.message || "Import failed")
      }
    } catch (error) {
      this.hideProcessing()
      this.showError("Import failed: " + error.message)
    }
  }

  loadFinancialData() {
    const saved = localStorage.getItem("financialData")
    return saved ? JSON.parse(saved) : { income: [], expenses: [], budgets: [] }
  }

  saveFinancialData(data) {
    localStorage.setItem("financialData", JSON.stringify(data))
  }

  showImportResults(imported, duplicates, errors) {
    document.getElementById("previewSection").classList.add("hidden")

    const resultsSection = document.getElementById("importResults")
    document.getElementById("importedCount").textContent = imported
    document.getElementById("duplicateCount").textContent = duplicates
    document.getElementById("errorCount").textContent = errors

    resultsSection.classList.remove("hidden")
  }

  resetImport() {
    document.getElementById("previewSection").classList.add("hidden")
    document.getElementById("importResults").classList.add("hidden")
    this.currentData = null
    this.parsedTransactions = []
    this.columnMapping = {}
  }

  showProcessing(message) {
    document.getElementById("processingMessage").textContent = message
    document.getElementById("processingStatus").classList.remove("hidden")
  }

  hideProcessing() {
    document.getElementById("processingStatus").classList.add("hidden")
  }

  updateProgress(percent, message) {
    document.getElementById("progressBar").style.width = percent + "%"
    document.getElementById("processingMessage").textContent = message
  }

  showError(message) {
    // Create error notification
    const errorDiv = document.createElement("div")
    errorDiv.className = "fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50"
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        <span>${message}</span>
        <button class="ml-4 text-red-700 hover:text-red-900" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
    document.body.appendChild(errorDiv)

    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove()
      }
    }, 5000)
  }

  showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement("div")
    successDiv.className =
      "fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50"
    successDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        <span>${message}</span>
        <button class="ml-4 text-green-700 hover:text-green-900" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
    document.body.appendChild(successDiv)

    setTimeout(() => {
      if (successDiv.parentElement) {
        successDiv.remove()
      }
    }, 3000)
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

  generateAIInsights() {
    const aiAnalysis = new window.AIAnalysis(this.data) // Assuming AIAnalysis is a global object or imported correctly
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
}

// Initialize import manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ImportManager()
})
