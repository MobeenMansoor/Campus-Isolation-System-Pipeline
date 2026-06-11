# Campus Isolation System Pipeline

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
* **Social Density Score (SDS):** A custom continuous mathematical feature engineered to summarize physical peer integration.

### 2.3 The Models
* **K-Means Clustering:** Segments the student body into 3 baseline clusters: *Highly Social*, *Academically Focused*, and *At-Risk*.
* **Isolation Forest (The Core Engine):** An unsupervised anomaly detection algorithm maps dense normal data and flags extreme behavioral outliers (isolated students).

### 2.4 The False-Positive Mitigation Filters
The system employs strict programmatic overrides to correct ML mistakes:
1. **High-Academic Exception Matrix:** Protects introverted overachievers. 
2. **Healthy Override System:** Protects highly social students.

---

## 3. Backend Implementation (FastAPI)

The backend serves as the bridge between the ML models and the web frontend.
* **Inference API (`/predict`):** Receives JSON payloads, computes the SDS, scales features, predicts anomalies, and applies exception filters.
* **Dynamic Analytics:** Computes values against the **Campus Baseline Average** (for radar charting) and generates personalized recommendation text.
* **Volunteer System Database (`/volunteers`):** A fully functional REST API supporting GET and POST requests. Data is persisted in a local `volunteers.json` file.

---

## 4. Frontend Application (Next.js & React)

The frontend provides an aesthetic, highly interactive, and responsive dashboard designed to lower the barrier to seeking help.

### 4.1 The Wellness Insights Dashboard
When a user submits their data, they receive an immediate, rich breakdown:
* **Risk Status Banner:** Displays final category and cluster.
* **Social Health Gauge:** A circular donut chart showing their social density score.
* **Comparative Radar Chart:** A chart allowing visual comparison against the campus average.

### 4.2 Deep Support Features for "At-Risk" Students
If flagged as isolated or at-risk, the interface adapts to provide immediate support:
* **Risk Factors Breakdown ("Why Am I Here?"):** The system parses specific input to tell the user *why* they were flagged.
* **Interactive Goal Checklist:** A widget containing 4 small, achievable goals.

### 4.3 Rich Interactive Modals (Quick Actions)
* **Mental Health Counselors:** Displays a realistic directory of therapists with clickable phone links.
* **Society Events:** Displays events mapped dynamically to the university.
* **Activity Modals:** Facility hours and info.
* **Live Volunteer Matching:** Queries the backend to show Volunteers interested in specific activities (Gym, Dining, Chai, Study Group).

### 4.4 The Peer Volunteer System
* **Registration Form:** Allows new students to sign up as a volunteer.
* **Volunteer Directory:** A searchable grid to filter volunteers by their university and contact them.

---

## 5. Novelty & Impact

By unifying machine learning anomaly detection with an empathetic, interactive UI and a peer-to-peer volunteer matching system, this project represents a complete, deployment-ready prototype. It solves the "cold start" problem of campus isolation by identifying students falling behind and immediately placing actionable, localized resources and friendly peer contacts directly in front of them.
