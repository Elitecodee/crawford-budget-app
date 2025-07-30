// Authentication handling
class AuthManager {
  constructor() {
    this.init()
  }

  init() {
    // Check if user is already logged in
    if (this.isLoggedIn() && window.location.pathname.includes("login.html")) {
      window.location.href = "dashboard.html"
    }

    // Set up form listeners
    const loginForm = document.getElementById("loginForm")
    const registerForm = document.getElementById("registerForm")

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e))
    }

    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e))
    }
  }

  async handleLogin(e) {
    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    try {
      // Simulate API call - replace with actual PHP backend call
      const response = await this.simulateLogin(email, password)

      if (response.success) {
        // Store user session
        localStorage.setItem("user", JSON.stringify(response.user))
        localStorage.setItem("authToken", response.token)

        // Redirect to dashboard
        window.location.href = "dashboard.html"
      } else {
        this.showError("Invalid email or password")
      }
    } catch (error) {
      this.showError("Login failed. Please try again.")
    }
  }

  async handleRegister(e) {
    e.preventDefault()

    const fullName = document.getElementById("fullName").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (password !== confirmPassword) {
      this.showError("Passwords do not match")
      return
    }

    try {
      // Simulate API call - replace with actual PHP backend call
      const response = await this.simulateRegister(fullName, email, password)

      if (response.success) {
        // Store user session
        localStorage.setItem("user", JSON.stringify(response.user))
        localStorage.setItem("authToken", response.token)

        // Redirect to dashboard
        window.location.href = "dashboard.html"
      } else {
        this.showError(response.message || "Registration failed")
      }
    } catch (error) {
      this.showError("Registration failed. Please try again.")
    }
  }

  // Simulate login - replace with actual PHP API call
  async simulateLogin(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple validation for demo
        if (email && password.length >= 6) {
          resolve({
            success: true,
            user: {
              id: 1,
              name: "Demo User",
              email: email,
            },
            token: "demo_token_" + Date.now(),
          })
        } else {
          resolve({
            success: false,
            message: "Invalid credentials",
          })
        }
      }, 1000)
    })
  }

  // Simulate registration - replace with actual PHP API call
  async simulateRegister(fullName, email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: 1,
            name: fullName,
            email: email,
          },
          token: "demo_token_" + Date.now(),
        })
      }, 1000)
    })
  }

  isLoggedIn() {
    return localStorage.getItem("authToken") !== null
  }

  logout() {
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    localStorage.removeItem("financialData")
    window.location.href = "login.html"
  }

  getCurrentUser() {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  }

  showError(message) {
    // Create error message element
    const errorDiv = document.createElement("div")
    errorDiv.className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    errorDiv.textContent = message

    // Insert at top of form
    const form = document.querySelector("form")
    form.insertBefore(errorDiv, form.firstChild)

    // Remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  }
}

// Initialize auth manager
const authManager = new AuthManager()
