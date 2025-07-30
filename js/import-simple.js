// Simplified Import Manager for PHP version
class ImportManager {
  constructor() {
    this.currentData = null
    this.parsedTransactions = []
    this.columnMapping = {}
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupDragAndDrop()
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
      if (file && file.name.toLowerCase().endsWith(".csv")) {
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
        this.showError("PDF import is not yet implemented. Please use CSV files for now.")
        this.hideProcessing()
      }
    } catch (error) {
      this.showError("Error processing file: " + error.message)
      this.hideProcessing()
    }
  }

  async processCSV(file) {
    this.updateProgress(25, "Reading CSV file...")

    const text = await this.readFileAsText(file)
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row")
    }

    this.updateProgress(50, "Analyzing columns...")

    const headers = this.parseCSVLine(lines[0])
    const rows = lines.slice(1).map((line) => this.parseCSVLine(line))

    this.currentData = { headers, rows }

    this.updateProgress(75, "Preparing preview...")
    this.setupColumnMapping(headers)
    this.autoDetectColumns(headers)

    this.updateProgress(100, "Complete!")
    setTimeout(() => {
      this.hideProcessing()
      this.showPreview(this.currentData)
    }, 500)
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  parseCSVLine(line) {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
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
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase()

      if (lowerHeader.includes("date") || lowerHeader.includes("transaction date")) {
        document.getElementById("dateColumn").value = index
      } else if (
        lowerHeader.includes("description") ||
        lowerHeader.includes("memo") ||
        lowerHeader.includes("details") ||
        lowerHeader.includes("narration")
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
    // Nigerian bank templates
    const templates = {
      gtb: { dateColumn: 0, descriptionColumn: 1, amountColumn: 2 },
      firstbank: { dateColumn: 0, descriptionColumn: 1, amountColumn: 2 },
      zenith: { dateColumn: 0, descriptionColumn: 1, amountColumn: 2 },
      uba: { dateColumn: 0, descriptionColumn: 1, amountColumn: 2 },
      access: { dateColumn: 0, descriptionColumn: 1, amountColumn: 2 },
      fidelity: { dateColumn: 0, descriptionColumn: 1, amountColumn: 2 },
    }

    const template = templates[templateName]
    if (!template || !this.currentData) return

    document.getElementById("dateColumn").value = template.dateColumn
    document.getElementById("descriptionColumn").value = template.descriptionColumn
    document.getElementById("amountColumn").value = template.amountColumn

    this.updateColumnMapping()
    this.updatePreview()
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
          }
        } catch (error) {
          console.warn("Error parsing row:", row, error)
          return null
        }
      })
      .filter((transaction) => transaction !== null)

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
                    ${transaction.type === "income" ? "+" : ""}₦${Math.abs(transaction.amount).toLocaleString()}
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
    let cleanAmount = amountStr.toString().replace(/[₦$,\s]/g, "")

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

    // Nigerian student-focused categorization
    if (desc.includes("food") || desc.includes("restaurant") || desc.includes("eatery") || desc.includes("canteen")) {
      return "food"
    } else if (desc.includes("transport") || desc.includes("bus") || desc.includes("taxi") || desc.includes("keke")) {
      return "transportation"
    } else if (desc.includes("book") || desc.includes("material") || desc.includes("stationery")) {
      return "textbooks"
    } else if (desc.includes("allowance") || desc.includes("salary") || desc.includes("deposit")) {
      return "allowance"
    } else if (desc.includes("data") || desc.includes("internet") || desc.includes("airtime")) {
      return "internet"
    } else if (desc.includes("cloth") || desc.includes("fashion") || desc.includes("shoe")) {
      return "clothing"
    } else if (desc.includes("entertainment") || desc.includes("movie") || desc.includes("game")) {
      return "entertainment"
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
      const formData = new FormData()
      formData.append("action", "bulk_import")
      formData.append("transactions", JSON.stringify(this.parsedTransactions))

      const response = await fetch("api/import_transactions.php", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
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

  formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, " $1")
  }
}

// Initialize import manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ImportManager()
})
