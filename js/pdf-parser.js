// PDF Parser for bank statements
class PDFParser {
  constructor() {
    this.pdfjsLib = window["pdfjs-dist/build/pdf"]
    this.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
  }

  async extractText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result
          const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise

          let fullText = ""

          // Extract text from all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()

            const pageText = textContent.items.map((item) => item.str).join(" ")

            fullText += pageText + "\n"
          }

          resolve(fullText)
        } catch (error) {
          reject(new Error("Failed to extract text from PDF: " + error.message))
        }
      }

      reader.onerror = () => {
        reject(new Error("Failed to read PDF file"))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  parseTransactions(pdfText) {
    const transactions = []

    // Try different bank statement formats
    const parsers = [
      this.parseChaseStatement.bind(this),
      this.parseBankOfAmericaStatement.bind(this),
      this.parseWellsFargoStatement.bind(this),
      this.parseGenericStatement.bind(this),
    ]

    for (const parser of parsers) {
      try {
        const result = parser(pdfText)
        if (result && result.length > 0) {
          return result
        }
      } catch (error) {
        console.warn("Parser failed:", error.message)
      }
    }

    throw new Error("Unable to parse PDF statement format")
  }

  parseChaseStatement(text) {
    const transactions = []
    const lines = text.split("\n")

    // Chase pattern: MM/DD/YY Description Amount
    const chasePattern = /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+([-+]?\$?[\d,]+\.?\d*)/g

    let match
    while ((match = chasePattern.exec(text)) !== null) {
      const [, date, description, amount] = match

      transactions.push({
        date: this.convertDate(date, "MM/DD/YY"),
        description: description.trim(),
        amount: this.parseAmount(amount),
      })
    }

    return transactions
  }

  parseBankOfAmericaStatement(text) {
    const transactions = []

    // Bank of America pattern: MM/DD/YYYY Description Amount Balance
    const boaPattern = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\$?[\d,]+\.?\d*)\s+([-+]?\$?[\d,]+\.?\d*)/g

    let match
    while ((match = boaPattern.exec(text)) !== null) {
      const [, date, description, amount] = match

      transactions.push({
        date: this.convertDate(date, "MM/DD/YYYY"),
        description: description.trim(),
        amount: this.parseAmount(amount),
      })
    }

    return transactions
  }

  parseWellsFargoStatement(text) {
    const transactions = []

    // Wells Fargo pattern varies, try multiple patterns
    const patterns = [
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\$?[\d,]+\.?\d*)/g,
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([-+]?\$?[\d,]+\.?\d*)/g,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const [, date, description, amount] = match

        transactions.push({
          date: this.convertDate(date, "MM/DD/YYYY"),
          description: description.trim(),
          amount: this.parseAmount(amount),
        })
      }

      if (transactions.length > 0) break
    }

    return transactions
  }

  parseGenericStatement(text) {
    const transactions = []
    const lines = text.split("\n")

    // Generic pattern: Look for date-like strings followed by text and amounts
    const genericPattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([-+]?\$?[\d,]+\.?\d*)/g

    let match
    while ((match = genericPattern.exec(text)) !== null) {
      const [, date, description, amount] = match

      try {
        transactions.push({
          date: this.convertDate(date),
          description: description.trim(),
          amount: this.parseAmount(amount),
        })
      } catch (error) {
        // Skip invalid entries
        continue
      }
    }

    return transactions
  }

  convertDate(dateStr, format = "auto") {
    if (!dateStr) throw new Error("Invalid date")

    let date

    if (format === "MM/DD/YY") {
      const [month, day, year] = dateStr.split("/")
      const fullYear = Number.parseInt(year) < 50 ? 2000 + Number.parseInt(year) : 1900 + Number.parseInt(year)
      date = new Date(fullYear, Number.parseInt(month) - 1, Number.parseInt(day))
    } else if (format === "MM/DD/YYYY") {
      const [month, day, year] = dateStr.split("/")
      date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    } else {
      // Auto-detect format
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/")
        if (parts[2].length === 2) {
          return this.convertDate(dateStr, "MM/DD/YY")
        } else {
          return this.convertDate(dateStr, "MM/DD/YYYY")
        }
      } else if (dateStr.includes("-")) {
        const parts = dateStr.split("-")
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          date = new Date(dateStr)
        } else {
          // MM-DD-YYYY
          const [month, day, year] = parts
          date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        }
      } else {
        date = new Date(dateStr)
      }
    }

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format")
    }

    return date.toISOString().split("T")[0]
  }

  parseAmount(amountStr) {
    if (!amountStr) throw new Error("Invalid amount")

    // Remove currency symbols and spaces
    let cleanAmount = amountStr.toString().replace(/[$€£¥,\s]/g, "")

    // Handle parentheses for negative amounts
    if (cleanAmount.includes("(") && cleanAmount.includes(")")) {
      cleanAmount = "-" + cleanAmount.replace(/[()]/g, "")
    }

    // Handle CR/DR indicators
    if (cleanAmount.includes("CR")) {
      cleanAmount = cleanAmount.replace("CR", "")
    } else if (cleanAmount.includes("DR")) {
      cleanAmount = "-" + cleanAmount.replace("DR", "")
    }

    const amount = Number.parseFloat(cleanAmount)
    if (isNaN(amount)) {
      throw new Error("Invalid amount format")
    }

    return amount
  }

  // Advanced PDF parsing methods
  async extractTabularData(file) {
    // Extract data that appears to be in table format
    const text = await this.extractText(file)
    const lines = text.split("\n")

    const tables = []
    let currentTable = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Detect table-like structures
      if (this.isTableRow(trimmedLine)) {
        currentTable.push(this.parseTableRow(trimmedLine))
      } else if (currentTable.length > 0) {
        // End of table
        if (currentTable.length > 1) {
          tables.push(currentTable)
        }
        currentTable = []
      }
    }

    return tables
  }

  isTableRow(line) {
    // Simple heuristic: line contains multiple numeric values or dates
    const datePattern = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/
    const amountPattern = /\$?[\d,]+\.?\d*/

    const dateMatches = (line.match(datePattern) || []).length
    const amountMatches = (line.match(amountPattern) || []).length

    return dateMatches >= 1 && amountMatches >= 1
  }

  parseTableRow(line) {
    // Split by multiple spaces or tabs
    return line
      .split(/\s{2,}|\t/)
      .map((cell) => cell.trim())
      .filter((cell) => cell)
  }

  // Quality assessment
  assessParsingQuality(transactions) {
    const quality = {
      totalTransactions: transactions.length,
      validDates: 0,
      validAmounts: 0,
      validDescriptions: 0,
      score: 0,
    }

    transactions.forEach((transaction) => {
      if (transaction.date && !isNaN(Date.parse(transaction.date))) {
        quality.validDates++
      }

      if (transaction.amount && !isNaN(transaction.amount)) {
        quality.validAmounts++
      }

      if (transaction.description && transaction.description.length > 3) {
        quality.validDescriptions++
      }
    })

    if (quality.totalTransactions > 0) {
      quality.score = Math.round(
        ((quality.validDates + quality.validAmounts + quality.validDescriptions) / (quality.totalTransactions * 3)) *
          100,
      )
    }

    return quality
  }
}

// Make PDFParser available globally
window.PDFParser = PDFParser
