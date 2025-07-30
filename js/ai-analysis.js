// AI-powered financial analysis for Crawford University Students
class AIAnalysis {
  constructor(data) {
    this.data = data
    this.insights = []
  }

  generateInsights() {
    this.insights = []

    this.analyzeStudentSpendingPatterns()
    this.analyzeSavingsRate()
    this.analyzeAllowanceManagement()
    this.analyzeStudentBudgetRecommendations()
    this.analyzeExpenseCategories()
    this.analyzeAcademicExpenses()

    return this.insights
  }

  analyzeStudentSpendingPatterns() {
    const totalIncome = this.data.income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = this.data.expenses.reduce((sum, item) => sum + item.amount, 0)

    if (totalExpenses === 0) {
      this.insights.push({
        type: "info",
        icon: "info-circle",
        message: "Start tracking your allowances and expenses to get personalized financial advice for students!",
      })
      return
    }

    // Analyze spending vs income ratio for students
    const spendingRatio = totalExpenses / totalIncome

    if (spendingRatio > 0.95) {
      this.insights.push({
        type: "warning",
        icon: "exclamation-triangle",
        message: `You're spending ${(spendingRatio * 100).toFixed(1)}% of your income! As a student, try to save at least 10% for emergencies and unexpected school expenses.`,
      })
    } else if (spendingRatio < 0.6) {
      this.insights.push({
        type: "success",
        icon: "thumbs-up",
        message: `Excellent! You're only spending ${(spendingRatio * 100).toFixed(1)}% of your income. You're developing great financial habits as a student.`,
      })
    }

    // Analyze recent spending trends
    this.analyzeRecentTrends()
  }

  analyzeRecentTrends() {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentExpenses = this.data.expenses.filter((expense) => new Date(expense.date) >= last30Days)

    const previous30Days = new Date()
    previous30Days.setDate(previous30Days.getDate() - 60)

    const previousExpenses = this.data.expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= previous30Days && expenseDate < last30Days
    })

    if (recentExpenses.length > 0 && previousExpenses.length > 0) {
      const recentTotal = recentExpenses.reduce((sum, item) => sum + item.amount, 0)
      const previousTotal = previousExpenses.reduce((sum, item) => sum + item.amount, 0)

      const changePercent = ((recentTotal - previousTotal) / previousTotal) * 100

      if (changePercent > 25) {
        this.insights.push({
          type: "warning",
          icon: "arrow-up",
          message: `Your spending increased by ${changePercent.toFixed(1)}% this month. Check if this is due to school-related expenses or if you need to adjust your budget.`,
        })
      } else if (changePercent < -15) {
        this.insights.push({
          type: "success",
          icon: "arrow-down",
          message: `Great job! Your spending decreased by ${Math.abs(changePercent).toFixed(1)}% this month. You're improving your financial discipline.`,
        })
      }
    }
  }

  analyzeSavingsRate() {
    const totalIncome = this.data.income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = this.data.expenses.reduce((sum, item) => sum + item.amount, 0)

    if (totalIncome === 0) return

    const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100

    if (savingsRate < 5) {
      this.insights.push({
        type: "warning",
        icon: "piggy-bank",
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. As a student, try to save at least 10-15% of your allowance for emergencies and future needs.`,
      })
    } else if (savingsRate >= 15) {
      this.insights.push({
        type: "success",
        icon: "star",
        message: `Outstanding! Your savings rate of ${savingsRate.toFixed(1)}% is excellent for a student. You're building great financial habits for the future.`,
      })
    } else {
      this.insights.push({
        type: "info",
        icon: "chart-line",
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Try to reach 15% by reducing non-essential expenses like entertainment or snacks.`,
      })
    }
  }

  analyzeAllowanceManagement() {
    const allowanceIncome = this.data.income.filter((item) => item.category === "allowance")

    if (allowanceIncome.length > 0) {
      const totalAllowance = allowanceIncome.reduce((sum, item) => sum + item.amount, 0)
      const avgMonthlyAllowance = totalAllowance / Math.max(1, allowanceIncome.length)

      if (avgMonthlyAllowance > 0) {
        this.insights.push({
          type: "info",
          icon: "calendar-alt",
          message: `Your average monthly allowance is ₦${avgMonthlyAllowance.toFixed(0)}. Consider creating a monthly budget plan to make it last the entire month.`,
        })
      }
    }
  }

  analyzeStudentBudgetRecommendations() {
    const totalIncome = this.data.income.reduce((sum, item) => sum + item.amount, 0)

    if (totalIncome === 0) return

    // Student-specific 50/30/20 rule adaptation
    const essentials = totalIncome * 0.6 // Food, transport, accommodation
    const academic = totalIncome * 0.25 // Books, materials, academic needs
    const savings = totalIncome * 0.15 // Emergency fund and future needs

    this.insights.push({
      type: "info",
      icon: "calculator",
      message: `Student Budget Guide: Allocate ₦${essentials.toFixed(0)} for essentials (food, transport), ₦${academic.toFixed(0)} for academic needs, and ₦${savings.toFixed(0)} for savings.`,
    })
  }

  analyzeExpenseCategories() {
    if (this.data.expenses.length === 0) return

    const categoryTotals = {}
    this.data.expenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount
    })

    const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
    const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)

    // Identify top spending category
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0]
      const percentage = (topAmount / totalExpenses) * 100

      if (percentage > 40) {
        this.insights.push({
          type: "warning",
          icon: "exclamation-circle",
          message: `${this.formatCategory(topCategory)} accounts for ${percentage.toFixed(1)}% of your spending. Consider if this is appropriate for a student budget.`,
        })
      }
    }

    // Check for student-specific spending patterns
    this.checkStudentSpendingPatterns(categoryTotals, totalExpenses)
  }

  checkStudentSpendingPatterns(categoryTotals, totalExpenses) {
    // Food spending check
    const food = categoryTotals.food || 0
    const foodPercent = (food / totalExpenses) * 100

    if (foodPercent > 35) {
      this.insights.push({
        type: "info",
        icon: "utensils",
        message: `Food expenses are ${foodPercent.toFixed(1)}% of your spending. Consider cooking more often or eating at the school cafeteria to reduce costs.`,
      })
    }

    // Transportation spending check
    const transport = categoryTotals.transportation || 0
    const transportPercent = (transport / totalExpenses) * 100

    if (transportPercent > 20) {
      this.insights.push({
        type: "info",
        icon: "car",
        message: `Transportation is ${transportPercent.toFixed(1)}% of your expenses. Look for student discounts or consider carpooling with classmates.`,
      })
    }

    // Entertainment spending check
    const entertainment = categoryTotals.entertainment || 0
    const entertainmentPercent = (entertainment / totalExpenses) * 100

    if (entertainmentPercent > 15) {
      this.insights.push({
        type: "warning",
        icon: "film",
        message: `Entertainment spending is ${entertainmentPercent.toFixed(1)}% of your budget. As a student, consider free campus activities or group outings to reduce costs.`,
      })
    }

    // Internet/Data spending check
    const internet = categoryTotals.internet || 0
    const internetPercent = (internet / totalExpenses) * 100

    if (internetPercent > 10) {
      this.insights.push({
        type: "info",
        icon: "wifi",
        message: `Internet & data costs are ${internetPercent.toFixed(1)}% of your expenses. Use campus WiFi when possible and look for student data plans.`,
      })
    }
  }

  analyzeAcademicExpenses() {
    const academicCategories = ["textbooks", "stationery"]
    const academicExpenses = this.data.expenses.filter((expense) => academicCategories.includes(expense.category))

    if (academicExpenses.length > 0) {
      const totalAcademic = academicExpenses.reduce((sum, item) => sum + item.amount, 0)
      const totalExpenses = this.data.expenses.reduce((sum, item) => sum + item.amount, 0)
      const academicPercent = (totalAcademic / totalExpenses) * 100

      if (academicPercent < 10) {
        this.insights.push({
          type: "info",
          icon: "book",
          message: `Academic expenses are only ${academicPercent.toFixed(1)}% of your spending. Make sure you're budgeting enough for textbooks and materials.`,
        })
      } else if (academicPercent > 25) {
        this.insights.push({
          type: "info",
          icon: "book-open",
          message: `Academic expenses are ${academicPercent.toFixed(1)}% of your budget. Consider buying used textbooks or sharing with classmates to reduce costs.`,
        })
      }
    } else {
      this.insights.push({
        type: "info",
        icon: "graduation-cap",
        message:
          "Don't forget to budget for academic expenses like textbooks, stationery, and course materials each semester.",
      })
    }
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

  // Advanced AI features for future implementation
  predictStudentExpenses() {
    // Implement prediction for semester-based expenses
    // Account for exam periods, holidays, and academic calendar
  }

  detectUnusualStudentSpending() {
    // Detect spending patterns that might indicate financial stress
    // Alert for sudden increases in essential expenses
  }

  generateStudentTips() {
    // Generate tips specific to Nigerian university students
    // Include advice on managing allowances, finding student discounts, etc.
  }
}

// Make AIAnalysis available globally
window.AIAnalysis = AIAnalysis
