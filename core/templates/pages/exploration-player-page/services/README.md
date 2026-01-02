# 🛠️ Shared Services

This folder contains all the **shared service files** essential for the functionality of both the current and new Lesson Players.

---

## 📌 Guidelines

When adding or modifying services, please follow these best practices:

- 📝 **Write proper JsDoc** for all new services or modified methods.
- ⚠️ These services are **shared across multiple components and pages**, so:
  - Make changes **cautiously**
  - Conduct **thorough testing**

---

## ✅ Testing Recommendations

To ensure safe and stable service updates, follow this process:

1. **Unit Tests**

   - Write or update unit tests for the service.
   - Cover **expected behaviors**, **edge cases**, and **error handling**.

2. **Run Dependent Component Tests**

   - Execute all tests for components that **depend on the service**.
   - This helps detect any unintended side effects.

3. **Manual Verification**
   - Navigate through the app and manually verify that all **features using the service** work as expected.
   - This is especially important for services shared across the current and new Lesson Players.
