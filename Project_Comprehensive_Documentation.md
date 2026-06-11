# Comprehensive Project Documentation
**Project:** Early Detection of Social Isolation in Campus Life via Machine Learning
**Scope:** Full-stack ML Pipeline, FastAPI Backend, Next.js Frontend, Volunteer System, and Deep Support Analytics.

---

## 1. Core Concept & Motivation
The project aims to detect early signs of **social isolation** and potential mental health struggles among university students. Traditional counseling models are reactive—waiting until a student experiences a crisis to seek help. 

This framework operates **proactively**. It uses **non-invasive campus metadata** (e.g., dining hall frequency, library hours, society events, and friend group size) to evaluate a student's social health. Crucially, it respects privacy by analyzing behavioral trends without relying on continuous GPS or smartphone sensor tracking.

---

## 2. Machine Learning Architecture

### 2.1 The Data
The pipeline operates on an empirical dataset collected via peer surveys (N=563 records), capturing 25+ parameters including:
* **Academic:** CGPA, class attendance, daily study hours, assignments due.
* **Social:** Friend group size, weekly shared meals, society memberships, social outings.
* **Lifestyle:** Screen time, sleep hours, hours spent alone.
* **Psychological:** Perceived stress, loneliness score, mood rating.

### 2.2 Preprocessing & Feature Engineering
* **Data Sanitization:** Regex scripts clean formatting inconsistencies (e.g., mixed CGPA scales).
* **Imputation:** Missing data is handled via rolling median imputations grouped by residential status (Hostelite vs. Day Scholar).
* **Winsorization:** Extreme outliers (e.g., impossible screen-time values) are clipped using Z-score thresholding ($|Z| > 3$).
* **Social Density Score (SDS):** A custom continuous mathematical feature engineered to summarize physical peer integration. It mathematically balances communal interactions (meals, common room time, outings) against solitary time.

### 2.3 The Models
* **K-Means Clustering:** Segments the student body into 3 baseline clusters: *Highly Social*, *Academically Focused*, and *At-Risk*.
* **Isolation Forest (The Core Engine):** Since isolation is a "minority" class without explicit diagnostic labels, an unsupervised anomaly detection algorithm is used. The Isolation Forest maps dense normal data and flags extreme behavioral outliers (isolated students) requiring fewer splits in random partitioning trees.

### 2.4 The False-Positive Mitigation Filters
The system employs strict programmatic overrides to correct ML mistakes:
1. **High-Academic Exception Matrix:** Protects introverted overachievers. If a student is flagged as an anomaly with low social stats, but has a high CGPA (>3.0), high attendance (>80%), and high self-study hours (>6), they are re-classified from "At-Risk" to **Academically Focused Overachiever**.
2. **Healthy Override System:** Protects highly social students. If the model misclassifies someone, but their raw data shows $\ge 3$ friends, $\ge 2$ shared meals, and $\ge 1$ social outing per week, the system explicitly overrides the label to **Highly Social**.

---

## 3. Backend Implementation (FastAPI)

The backend (`main.py`, `router.py`, `ml_engine.py`) serves as the bridge between the ML models and the web frontend.
* **Inference API (`/predict`):** Receives JSON payloads of student behavior, computes the SDS, scales the features using `scaler.pkl`, predicts anomalies using `isolation_forest_model.pkl`, and applies the exception filters.
* **Dynamic Analytics:** Computes the student's values against the **Campus Baseline Average** (for radar charting) and generates personalized recommendation text and **Health Highlights**.
* **Volunteer System Database (`/volunteers`):** A fully functional REST API supporting GET and POST requests. Data is persisted in a local `volunteers.json` file, protected by thread locks to prevent data corruption during concurrent signups.

---

## 4. Frontend Application (Next.js & React)

The frontend (`page.tsx`) provides an aesthetic, highly interactive, and responsive dashboard designed to lower the barrier to seeking help.

### 4.1 The Assessment Form
* A sleek, multi-step wizard using sliding scales and select inputs to capture the student's data painlessly.
* Includes progress bars and categorized sections (Academic, Social, Lifestyle).

### 4.2 The Wellness Insights Dashboard
When a user submits their data, they receive an immediate, rich breakdown:
* **Risk Status Banner:** Displays their final category and cluster.
* **Social Health Gauge:** A circular donut chart showing their social density score mapped from 0 to 100%.
* **Comparative Radar Chart:** An overlapping web chart allowing the student to visually compare their Academic Focus, Screen Time, Wellbeing, and Social Activity against the campus average.

### 4.3 Deep Support Features for "At-Risk" Students
If a student is flagged as isolated or at-risk, the interface adapts to provide immediate, low-pressure support:
* **Risk Factors Breakdown ("Why Am I Here?"):** The system parses their specific input to tell them *why* they were flagged (e.g., "0 friends in immediate group", "High screen time of 8 hrs").
* **Interactive Goal Checklist:** A widget containing 4 small, achievable goals (e.g., "Say hi to one classmate today", "Spend 30 mins in the library") that the user can physically check off to build momentum.

### 4.4 Rich Interactive Modals (Quick Actions)
To bridge the gap between "knowing you are isolated" and "taking action", the system features contextual Quick Action modals:
* **Mental Health Counselors:** Displays a real/realistic directory of therapists in Rawalpindi/Islamabad (e.g., Umang Helpline) with clickable phone links and addresses.
* **Society Events:** Displays dummy events mapped dynamically to the exact university the user selected (e.g., NUTECH shows "Tech Talk", NUST shows "Debate Championship").
* **Activity Modals (Gym, Dining, Chai):** Displays facility hours and information.
* **Live Volunteer Matching:** Inside the Gym, Dining, Chai, and Study Group modals, the system queries the backend to show **Volunteers** who specifically indicated interest in that activity. 

### 4.5 The Peer Volunteer System
* **Seed Data:** Pre-populated with 29 realistic profiles across 12 major Pakistani universities (NUTECH, NUST, FAST, QAU, etc.).
* **Registration Form:** Allows new students to sign up, providing their name, gender, age, semester, university, Pakistani phone number, and specific interests (e.g., "Study Group", "Gym Buddy").
* **Volunteer Directory:** A searchable grid where students can filter volunteers by their university and click a button to immediately call them.

---

## 5. Novelty & Impact
By unifying machine learning anomaly detection with a highly empathetic, interactive UI and a peer-to-peer volunteer matching system, this project represents a complete, deployment-ready prototype. It solves the "cold start" problem of campus isolation not just by identifying the students who are falling behind, but by immediately placing actionable, localized resources and friendly peer contacts directly in front of them.
