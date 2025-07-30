// CSV Parser for bank statements
class CSVParser {
  constructor() {
    this.delimiter = ","
    this.quoteChar = '"'
  }

  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const csvText = e.target.result
          const parsed = this.parseCSV(csvText)
          resolve(parsed)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error("Failed to read file"))
      }

      reader.readAsText(file)
    })
  }

  parseCSV(csvText) {
    const lines = this.splitLines(csvText)
    if (lines.length === 0) {
      throw new Error("Empty CSV file")
    }

    // Auto-detect delimiter
    this.detectDelimiter(lines[0])

    // Parse header
    const headers = this.parseLine(lines[0])

    // Parse data rows
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        try {
          const row = this.parseLine(line)
          if (row.length === headers.length) {
            rows.push(row)
          }
        } catch (error) {
          console.warn(`Error parsing line ${i + 1}:`, line, error)
        }
      }
    }

    return {
      headers,
      rows,
      delimiter: this.delimiter,
    }
  }

  detectDelimiter(firstLine) {
    const delimiters = [",", ";", "\t", "|"]
    let maxCount = 0
    let bestDelimiter = ","

    delimiters.forEach((delimiter) => {
      const count = (firstLine.match(new RegExp("\\" + delimiter, "g")) || []).length
      if (count > maxCount) {
        maxCount = count
        bestDelimiter = delimiter
      }
    })

    this.delimiter = bestDelimiter
  }

  splitLines(text) {
    // Handle different line endings
    return text.split(/\r\n|\r|\n/)
  }

  parseLine(line) {
    const result = []
    let current = ""
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === this.quoteChar) {
        if (inQuotes && nextChar === this.quoteChar) {
          // Escaped quote
          current += this.quoteChar
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === this.delimiter && !inQuotes) {
        // Field separator
        result.push(current.trim())
        current = ""
        i++
      } else {
        current += char
        i++
      }
    }

    // Add the last field
    result.push(current.trim())

    // Remove quotes from fields
    return result.map((field) => {
      if (field.startsWith(this.quoteChar) && field.endsWith(this.quoteChar)) {
        return field.slice(1, -1)
      }
      return field
    })
  }

  // Bank-specific parsing methods
  parseChaseFormat(csvData) {
    // Chase: Transaction Date,Post Date,Description,Category,Type,Amount,Memo
    const dateIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("date"))
    const descriptionIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("description"))
    const amountIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("amount"))
    const categoryIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("category"))
    const typeIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("type"))

    return csvData.rows.map((row) => ({
      date: row[dateIndex],
      description: row[descriptionIndex],
      amount: this.cleanAmount(row[amountIndex]),
      category: row[categoryIndex],
      type: row[typeIndex],
    }))
  }

  parseBankOfAmericaFormat(csvData) {
    // BofA: Date,Description,Amount,Running Bal.
    const dateIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("date"))
    const descriptionIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("description"))
    const amountIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("amount"))
    const balanceIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("balance"))

    return csvData.rows.map((row) => ({
      date: row[dateIndex],
      description: row[descriptionIndex],
      amount: this.cleanAmount(row[amountIndex]),
      balance: this.cleanAmount(row[balanceIndex]),
    }))
  }

  parseWellsFargoFormat(csvData) {
    // Wells Fargo: Date,Amount,*,*,Description
    const dateIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("date"))
    const amountIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("amount"))
    const descriptionIndex = csvData.headers.findIndex((header) => header.toLowerCase().includes("description"))

    return csvData.rows.map((row) => ({
      date: row[dateIndex],
      amount: this.cleanAmount(row[amountIndex]),
      description: row[descriptionIndex],
    }))
  }

  // Validation methods
  validateCSVStructure(csvData) {
    if (!csvData.headers || csvData.headers.length === 0) {
      throw new Error("No headers found in CSV")
    }

    if (!csvData.rows || csvData.rows.length === 0) {
      throw new Error("No data rows found in CSV")
    }

    // Check for consistent column count
    const headerCount = csvData.headers.length
    const inconsistentRows = csvData.rows.filter((row) => row.length !== headerCount)

    if (inconsistentRows.length > csvData.rows.length * 0.1) {
      console.warn("More than 10% of rows have inconsistent column count")
    }

    return true
  }

  // Data cleaning methods
  cleanAmount(amountStr) {
    if (!amountStr) return 0

    // Remove currency symbols, spaces, and commas
    let cleaned = amountStr.toString().replace(/[$€£¥,\s]/g, "")

    // Handle parentheses for negative amounts
    if (cleaned.includes("(") && cleaned.includes(")")) {
      cleaned = "-" + cleaned.replace(/[()]/g, "")
    }

    // Handle different decimal separators
    if (cleaned.includes(",") && cleaned.includes(".")) {
      // European format: 1.234,56
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    } else if (cleaned.includes(",") && !cleaned.includes(".")) {
      // Check if comma is decimal separator
      const parts = cleaned.split(",")
      if (parts.length === 2 && parts[1].length <= 2) {
        cleaned = cleaned.replace(",", ".")
      } else {
        cleaned = cleaned.replace(/,/g, "")
      }
    }

    const amount = Number.parseFloat(cleaned)
    return isNaN(amount) ? 0 : amount
  }

  cleanDescription(description) {
    if (!description) return "Unknown Transaction"

    return description
      .trim()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[^\w\s\-.,()]/g, "") // Remove special characters except common ones
  }

  // Export methods
  exportToJSON(csvData) {
    return JSON.stringify(csvData, null, 2)
  }

  exportToCSV(data, filename = "export.csv") {
    const csvContent = [
      data.headers.join(","),
      ...data.rows.map((row) =>
        row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()

    window.URL.revokeObjectURL(url)
  }
}

// Make CSVParser available globally
window.CSVParser = CSVParser
