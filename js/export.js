// Data Export functionality for Crawford University Students
class DataExporter {
  constructor() {
    this.data = this.loadFinancialData()
  }

  loadFinancialData() {
    const saved = localStorage.getItem("financialData")
    return saved ? JSON.parse(saved) : { income: [], expenses: [], budgets: [] }
  }

  exportToCSV(type = "all") {
    let csvContent = ""
    let filename = ""

    switch (type) {
      case "income":
        csvContent = this.generateIncomeCSV()
        filename = "crawford_student_income_export.csv"
        break
      case "expenses":
        csvContent = this.generateExpensesCSV()
        filename = "crawford_student_expenses_export.csv"
        break
      case "budgets":
        csvContent = this.generateBudgetsCSV()
        filename = "crawford_student_budgets_export.csv"
        break
      default:
        csvContent = this.generateAllDataCSV()
        filename = "crawford_student_financial_data_export.csv"
    }

    this.downloadFile(csvContent, filename, "text/csv")
  }

  exportToJSON() {
    const jsonContent = JSON.stringify(this.data, null, 2)
    this.downloadFile(jsonContent, "crawford_student_financial_data_export.json", "application/json")
  }

  exportToPDF() {
    // This would require a PDF library like jsPDF
    // For now, we'll create a simple HTML report that can be printed to PDF
    const htmlContent = this.generateStudentHTMLReport()
    const newWindow = window.open("", "_blank")
    newWindow.document.write(htmlContent)
    newWindow.document.close()
    newWindow.print()
  }

  generateIncomeCSV() {
    const headers = ["Date", "Description", "Category", "Amount (NGN)"]
    const rows = this.data.income.map((item) => [item.date, item.description, item.category, item.amount])

    return this.arrayToCSV([headers, ...rows])
  }

  generateExpensesCSV() {
    const headers = ["Date", "Description", "Category", "Amount (NGN)"]
    const rows = this.data.expenses.map((item) => [item.date, item.description, item.category, item.amount])

    return this.arrayToCSV([headers, ...rows])
  }

  generateBudgetsCSV() {
    const headers = ["Category", "Amount (NGN)", "Period", "Created Date"]
    const rows = this.data.budgets.map((item) => [item.category, item.amount, item.period, item.createdAt])

    return this.arrayToCSV([headers, ...rows])
  }

  generateAllDataCSV() {
    let csvContent = "CRAWFORD UNIVERSITY STUDENT FINANCIAL DATA\n\n"
    csvContent += "INCOME DATA\n"
    csvContent += this.generateIncomeCSV() + "\n\n"
    csvContent += "EXPENSE DATA\n"
    csvContent += this.generateExpensesCSV() + "\n\n"
    csvContent += "BUDGET DATA\n"
    csvContent += this.generateBudgetsCSV()

    return csvContent
  }

  generateStudentHTMLReport() {
    const totalIncome = this.data.income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = this.data.expenses.reduce((sum, item) => sum + item.amount, 0)
    const netBalance = totalIncome - totalExpenses

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Crawford University Student Financial Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .university-logo { color: #16a34a; font-size: 24px; font-weight: bold; }
          .summary { background: #f0fdf4; padding: 20px; margin-bottom: 30px; border-left: 4px solid #16a34a; }
          .section { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #16a34a; color: white; }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="university-logo">Crawford University</div>
          <h1>Student Financial Report</h1>
          <p>Generated on ${new Date().toLocaleDateString("en-NG")}</p>
        </div>
        
        <div class="summary">
          <h2>Financial Summary</h2>
          <p><strong>Total Income:</strong> <span class="positive">₦${totalIncome.toLocaleString("en-NG")}</span></p>
          <p><strong>Total Expenses:</strong> <span class="negative">₦${totalExpenses.toLocaleString("en-NG")}</span></p>
          <p><strong>Net Balance:</strong> <span class="${netBalance >= 0 ? "positive" : "negative"}">₦${netBalance.toLocaleString("en-NG")}</span></p>
          <p><strong>Savings Rate:</strong> ${totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0}%</p>
        </div>
        
        <div class="section">
          <h2>Recent Income</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount (₦)</th></tr>
            </thead>
            <tbody>
              ${this.data.income
                .slice(-10)
                .map(
                  (item) =>
                    `<tr><td>${new Date(item.date).toLocaleDateString("en-NG")}</td><td>${item.description}</td><td>${this.formatCategory(item.category)}</td><td>₦${item.amount.toLocaleString("en-NG")}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Recent Expenses</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount (₦)</th></tr>
            </thead>
            <tbody>
              ${this.data.expenses
                .slice(-10)
                .map(
                  (item) =>
                    `<tr><td>${new Date(item.date).toLocaleDateString("en-NG")}</td><td>${item.description}</td><td>${this.formatCategory(item.category)}</td><td>₦${item.amount.toLocaleString("en-NG")}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Crawford University Student Budget Tracker</p>
          <p>This report is for personal financial management purposes</p>
        </div>
      </body>
      </html>
    `
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

  arrayToCSV(data) {
    return data
      .map((row) =>
        row
          .map((field) => {
            if (typeof field === "string" && (field.includes(",") || field.includes('"') || field.includes("\n"))) {
              return `"${field.replace(/"/g, '""')}"`
            }
            return field
          })
          .join(","),
      )
      .join("\n")
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.style.display = "none"

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    window.URL.revokeObjectURL(url)
  }
}

// Make DataExporter available globally
window.DataExporter = DataExporter
