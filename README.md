# Angular WebMCP QA Demo 🧪🤖

An experimental Angular standalone application demonstrating **WebMCP (Web Model Context Protocol)** integration. This project showcases how Angular services can be dynamically exposed as AI-agent-ready browser tools, declared via TOML configuration, and verified autonomously using both **local LLM models (via LM Studio)** and **Google Gemini API**.

> ⚠️ **DISCLAIMER: HIGHLY EXPERIMENTAL**  
> **WebMCP is an experimental W3C browser API standard proposal.** It is not yet natively supported in mainstream browser releases without experimental browser flags or developer extensions. This project uses [`ng-webmcp`](https://github.com/nicoavanzdev/ng-webmcp) and an in-memory testing polyfill (`installWebMcpPolyfill()`) to simulate native `navigator.modelContext` capabilities for client-side tool registration and automated AI testing.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture & Key Conventions](#architecture--key-conventions)
  - [1. Service-to-Tool Registration Strategies](#1-service-to-tool-registration-strategies)
  - [2. Naming Conventions](#2-naming-conventions)
  - [3. Declarative TOML Schema](#3-declarative-toml-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Automated AI QA Testing](#automated-ai-qa-testing)
  - [Option A: Local LLM via LM Studio](#option-a-local-llm-via-lm-studio)
  - [Option B: Cloud LLM via Google Gemini API](#option-b-cloud-llm-via-google-gemini-api)
- [Intentional Failure & Bug Detection Scenarios](#intentional-failure--bug-detection-scenarios)
- [License](#license)

---

## 🌟 Overview

The **Web Model Context Protocol (WebMCP)** allows web applications to expose native functions directly to AI assistants operating in or alongside the browser. 

This repository provides:
1. **Dynamic Service Ingestion**: An Angular `provideAppInitializer` (`provideWebMcpTomlLoader`) that reads `webmcp-tools.toml` and automatically registers Angular `@Injectable()` service methods into `navigator.modelContext`.
2. **Browser Polyfill Support**: Fallback handling for environments lacking native `navigator.modelContext`.
3. **Autonomous AI QA Test Runners**: Scripts (`runner.js` and `runner-gemini.js`) that fetch the declarative test plan, invoke WebMCP tools, analyze assertion matches, detect bugs, and automatically suggest TypeScript and TOML code fixes.

---

## 🏗️ Architecture & Key Conventions

### 1. Service-to-Tool Registration Strategies

WebMCP tools are declared in `src/webmcp-tools.toml` using two primary exposure modes:

- **Strategy A: Magic Class (`mode = "auto"`)**  
  Exposes **all public async/sync methods** on an Angular service automatically as WebMCP tools.  
  *Example:* `UserService` exposes `login`, `getprofile`, and `logout`.

- **Strategy B: Explicit Selection (`mode = "explicit"`)**  
  Exposes **only the explicitly listed methods** in the `methods` array, allowing custom description overrides.  
  *Example:* `PaymentService` exposes `processPayment`, `refund`, and `applyDiscount` while leaving internal methods like `getTransactionHistory` unexposed.

### 2. Naming Conventions

Tools registered in the WebMCP context follow a normalized **lowercase string identifier pattern**:

$$\text{Tool Name} = \text{lowercase}(\text{ClassName}) + \text{"\_"} + \text{lowercase}(\text{MethodName})$$

| Service Class | Method Name | Registered WebMCP Tool Name |
| :--- | :--- | :--- |
| `UserService` | `login` | `userservice_login` |
| `UserService` | `getprofile` | `userservice_getprofile` |
| `PaymentService` | `processPayment` | `paymentservice_processpayment` |
| `PaymentService` | `applyDiscount` | `paymentservice_applydiscount` |

### 3. Declarative TOML Schema

The application configuration resides in `src/webmcp-tools.toml` (copied to `public/assets/webmcp-tools.toml` at build time):

```toml
# Tool Declaration
[[tools]]
class = "UserService"
mode = "auto"

[[tools]]
class = "PaymentService"
mode = "explicit"
methods = ["processPayment", "refund", "applyDiscount"]
[tools.description_overrides]
processPayment = "Process a credit card payment securely"

# Test Plan Declaration
[[tests]]
name = "auth_flow_validation"
description = "Verify login success, profile retrieval, and logout cleanup."
steps = [
  { tool = "userservice_login", args = { user = "test@example.com", pass = "ValidPass123" }, assert = { success = true } },
  { tool = "userservice_getprofile", args = {}, assert = { name = "Test User" } },
  { tool = "userservice_logout", args = {}, assert = { success = true } }
]
```

---

## 📁 Project Structure

```
app/
├── public/
│   └── assets/
│       └── webmcp-tools.toml      # Served publicly at runtime
├── scripts/
│   ├── runner.js                  # LM Studio local LLM test runner
│   └── runner-gemini.js           # Google Gemini API test runner
├── src/
│   ├── app/
│   │   ├── app.config.ts          # Angular providers & WebMCP initialization
│   │   └── app.ts                 # Main component
│   ├── services/
│   │   ├── user.service.ts        # UserService implementation
│   │   └── payment.service.ts     # PaymentService implementation
│   ├── main.ts                    # Bootstrap & WebMCP testing polyfill setup
│   ├── webmcp-loader.ts           # Dynamic TOML tool loader & register factory
│   └── webmcp-tools.toml          # Primary TOML tool & test definitions
├── angular.json                   # Angular build & asset mapping config
└── package.json                   # Project dependencies & test scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

Clone the repository and install dependencies:

```bash
cd app
npm install
```

### Running the Application

Start the local development server:

```bash
npm start
```

This command executes `npm run mv:toml` (copying `webmcp-tools.toml` to `public/assets/`) and boots `ng serve`. Navigate to **`http://localhost:4200`** in your browser.

---

## 🤖 Automated AI QA Testing

The project includes two autonomous AI testing harnesses designed to evaluate registered WebMCP tools against declarative TOML test suites.

### Option A: Local LLM via LM Studio

Run QA evaluation against a locally hosted open-weights LLM (such as Qwen 2.5 Coder, Gemma 4, or Phi-3):

1. **Launch LM Studio** and start the Local Inference Server on default port `1234` (`http://localhost:1234/v1`).
2. Load any instruction-tuned model in LM Studio.
3. Run the test runner:

```bash
npm run test:lm-studio
```

*The script dynamically queries `http://localhost:1234/v1/models`, detects your active model, loads `http://localhost:4200/assets/webmcp-tools.toml`, and outputs QA analysis with suggested code fixes.*

---

### Option B: Cloud LLM via Google Gemini API

Run QA evaluation using Google's Gemini models (`gemini-3.5-flash`):

1. Set your Gemini API Key in your environment:

```bash
export GEMINI_API_KEY="your_api_key_here"
```

2. Run the Gemini test runner:

```bash
npm run test:gemini
```

---

## 💥 Intentional Failure & Bug Detection Scenarios

To demonstrate the AI agent's ability to detect flaws and suggest actionable code fixes, `webmcp-tools.toml` includes intentional failure cases:

1. **Buggy Math Function (`payment_buggy_discount_test`)**:
   - **Target**: `PaymentService.applyDiscount`
   - **Issue**: Subtracts discount value directly from price (`200 - 15 = 185`) instead of percentage calculation (`200 * (1 - 15/100) = 170`).
   - **AI Action**: Detects assertion mismatch and provides the correct percentage calculation formula for `payment.service.ts`.

2. **Missing / Unregistered Tool (`userservice_missing_tool_test`)**:
   - **Target**: `userservice_deleteaccount`
   - **Issue**: Tool `deleteAccount` is intentionally not implemented in `UserService`.
   - **AI Action**: Detects unhandled tool call and generates TypeScript code to implement `deleteAccount()` in `user.service.ts`.

3. **Input Validation Failures (`negative_payment_validation`, `missing_auth_param_validation`)**:
   - **Issue**: Missing boundary checks for negative amounts and missing required arguments.
   - **AI Action**: Identifies missing guard clauses and proposes input validation logic.

---

## 📄 License

This project is licensed under the MIT License.
