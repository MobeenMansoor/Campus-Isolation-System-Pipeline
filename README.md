# 🎓 Campus Isolation System Pipeline

A proactive, full-stack machine learning pipeline built with **FastAPI** and **Next.js** that detects early signs of **social isolation** among university students using non-invasive campus metadata.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Machine Learning Architecture](#machine-learning-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Application Routes](#application-routes)
- [Privacy Model](#privacy-model)
- [Screenshots](#screenshots)
- [Contributors](#contributors)
- [License](#license)

---

## Overview

This project simulates an early detection framework where non-invasive campus metadata (e.g., dining hall frequency, library hours, society events) is used to evaluate a student's social health. An intuitive dashboard provides personalized insights, while a built-in peer volunteer matching system instantly connects at-risk students with localized campus resources.

The system is designed as a proactive intervention tool that bridges **Machine Learning**, **Web Development**, and **Mental Health Support** by applying clustering and anomaly detection to real-world behavioral data.

---

## Features

### 🧠 Machine Learning Features
| Feature | Description |
|---|---|
| **Anomaly Detection** | Uses Isolation Forest to flag extreme behavioral outliers |
| **Student Segmentation** | K-Means clustering segments students into Highly Social, Academically Focused, or At-Risk |
| **Social Density Score** | A custom metric mathematically summarizing physical peer integration |
| **False-Positive Mitigation** | Programmatic overrides to protect introverted overachievers and highly social students |

### 🖥️ Frontend Features
| Feature | Description |
|---|---|
| **Wellness Dashboard** | Immediate rich breakdown with risk status, social health gauge, and radar charts |
| **Assessment Form** | Sleek, multi-step wizard capturing student data painlessly |
| **Deep Support** | Interactive goal checklists and risk factor breakdowns for at-risk students |
| **Quick Actions** | Contextual modals for mental health counselors, society events, and campus activities |
| **Volunteer System** | Live matching with peers interested in specific activities (Gym, Dining, Study Groups) |

### ⚙️ Backend Features
| Feature | Description |
|---|---|
| **Inference API** | Endpoints to compute SDS, scale features, and predict anomalies |
| **Dynamic Analytics** | Computes values against campus baselines to generate personalized text |
| **REST API** | Fully functional endpoints for managing the volunteer database |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, FastAPI |
| **Frontend** | React, Next.js |
| **Machine Learning** | Scikit-learn, Pandas, Numpy |
| **Data Storage** | JSON (`volunteers.json`) |
| **Styling** | Tailwind CSS / Custom CSS |

---

## Project Structure

```
Campus-Isolation-System-Pipeline/
│
├── social_isolation_pipeline.py   # Core ML pipeline script for training models
├── Project_Comprehensive_Documentation.md # Detailed project documentation
│
├── backend/                       # FastAPI application
│   ├── main.py                    # App entry point
│   ├── router.py                  # API routing
│   ├── ml_engine.py               # Machine learning inference logic
│   ├── models.py                  # Pydantic data models
│   ├── privacy.py                 # Data sanitization and privacy controls
│   ├── requirements.txt           # Python dependencies
│   ├── training_data.csv          # Training dataset
│   └── volunteers.json            # Volunteer database
│
├── frontend/                      # Next.js web application
│   ├── package.json               # Node.js dependencies
│   ├── src/app/                   # Next.js App Router
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Dashboard and assessment form
│   │   └── globals.css            # Global styles
│   └── public/                    # Static assets
│
└── outputs/                       # ML generated visualizations and results
    ├── final_results.csv          # Predictions on the dataset
    ├── pipeline_summary.txt       # Model performance summary
    └── *.png                      # ROC, PR, UMAP, and silhouette charts
```

---

## Machine Learning Architecture

### 🌲 Isolation Forest (Anomaly Detection)
Since isolation is a "minority" class without explicit diagnostic labels, an unsupervised anomaly detection algorithm is used to map dense normal data and flag extreme behavioral outliers.

### 🎯 Custom Overrides
To ensure fairness and accuracy:
1. **High-Academic Exception:** Re-classifies isolated but high-performing students as "Academically Focused Overachiever".
2. **Healthy Override:** Explicitly overrides false alarms for highly social students with high friend counts and social outings.

---

## Installation

### Prerequisites
- **Python 3.8+**
- **Node.js 18+**

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/MobeenMansoor/Campus-Isolation-System-Pipeline.git
   cd Campus-Isolation-System-Pipeline
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## Usage

### Workflow

```
Student inputs data via Wizard ──► Frontend sends JSON to Backend (/predict)
                                          │
                             ┌────────────┴────────────┐
                             │                         │
                    Computes Social               Predicts Anomaly
                    Density Score (SDS)           (Isolation Forest)
                             │                         │
                             └────────────┬────────────┘
                                          │
                                 Applies Exception Filters
                                 (False-Positive Mitigation)
                                          │
Student receives personalized ◄───────────┘
Dashboard & Volunteer Matches
```

---

## Application Routes

### API Endpoints
| Route | Method | Description |
|---|---|---|
| `/predict` | POST | Receives student data, runs ML inference, and returns risk status |
| `/volunteers` | GET | Fetches available peer volunteers |
| `/volunteers` | POST | Registers a new student as a volunteer |

---

## Privacy Model

- **Non-Invasive Data:** Evaluates behavior through standard campus routines rather than tracking GPS or smartphone sensors.
- **Anonymized Processing:** Identifiable features are isolated from ML inference to protect student privacy.
- **Opt-In System:** All volunteer matching requires explicit student consent and sign-up.

---

## Screenshots

> *Add screenshots of your application here to showcase the UI.*
>
> Suggested screenshots:
> - Assessment Wizard
> - Wellness Insights Dashboard (Gauges and Radar Charts)
> - Volunteer Directory
> - ML Visualizations (UMAP, ROC curve)

---

## Contributors

| Name | Role |
|---|---|
| Mobeen Mansoor | Developer |

---

## License

This project was developed as a university course project focusing on Machine Learning and proactive mental health intervention systems.

---

<p align="center">
  Built with ❤️ using FastAPI & Next.js
</p>
