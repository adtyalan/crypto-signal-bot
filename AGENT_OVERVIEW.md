# 🧠 Project Evolution: From Signal Bot → Trading Decision System

The system is no longer just a signal notifier. It evolves into a **Trading Decision Support System** with performance awareness.

---

## 🎯 Core Objective (Updated)

To provide:
* **High-quality, low-frequency signals**
* **Actionable trade plans (Entry, SL, TP)**
* **Performance feedback (winrate, trade outcome)**

---

## 🔄 Enhanced Workflow (V2)

### 1. Observe Phase
* Monitor selected assets (1–3 pairs max)
* Focus on higher timeframe (15m–1h)
* Avoid noisy micro movements

### 2. Analyze Phase
Indicators used:
* RSI → momentum
* MACD → confirmation
* EMA 50 → trend filter

### 3. Decide Phase (Improved Logic)
Signal is generated ONLY if:
* **BUY:**
  * RSI < threshold (e.g. 30)
  * MACD bullish crossover
  * Price above EMA 50 (trend filter)
* **SELL:**
  * RSI > threshold (e.g. 70)
  * MACD bearish crossover
  * Price below EMA 50

### 4. Trade Construction Phase (NEW)
Each signal must include:
* Entry Price
* Stop Loss (SL)
* Take Profit (TP)
* Risk Reward Ratio (min 1:2)

### 5. State Awareness (NEW)
System tracks:
* Previous signal state
* Open positions

Only sends notification if:
* Signal changes (HOLD → BUY, BUY → SELL)

### 6. Trade Tracking Phase (NEW)
Each generated signal becomes a **tracked trade**:
* Status: **OPEN**, **WIN**, **LOSS**

### 7. Evaluation Phase (NEW)
System evaluates:
* Did TP hit?
* Did SL hit?
* Updates: Trade result & Winrate

---

## 🧱 Key Conceptual Upgrades
* From stateless → **state-aware system**
* From signal → **trade lifecycle**
* From output → **performance feedback loop**

---

## 🎯 Philosophy Shift
> The system is not trying to predict perfectly, but to operate with **controlled risk and measurable performance**.
