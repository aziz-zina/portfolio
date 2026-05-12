---
title: Tech Professionals Survey Analytics
slug: tech-professionals-survey
type: Big Data - Analytics
description: A Big Data end-of-semester project analyzing a real-world survey of computer science and data science professionals, covering the full data lifecycle — from raw acquisition and cleaning to interactive Power BI dashboards and Python visualizations.
coverImage: projects/data_survery.png
images:
  - projects/data_survery.png
techs:
  - Python
  - Power BI
  - Pandas
  - Matplotlib
  - Seaborn
  - Excel
website: https://github.com/aziz-zina/Tech-Professionals-Survey-Analytics
github: https://github.com/aziz-zina/Tech-Professionals-Survey-Analytics
highlights:
  - Real-world survey data acquisition and cleaning
  - Interactive multi-page Power BI dashboards
  - Python visualizations with Matplotlib & Seaborn
  - Full data lifecycle from raw Excel to polished insights
draft: false
---

## Overview

This end-of-semester **Big Data** project delivers a full-lifecycle analysis of a real survey dataset collected from professionals working in the computer science and data science fields. Rather than a toy dataset, this project tackles authentic, messy data — with all the inconsistencies, gaps, and noise that come with it — and transforms it into a coherent analytical story.

The project spans four major phases: **data acquisition**, **data cleaning**, **exploratory analysis**, and **interactive visualization** through both Power BI dashboards and Python-generated charts.

## Project Steps

### 1. Data Acquisition

The project started with a raw Excel file capturing survey responses from data and tech professionals across various roles, countries, and experience levels. The spreadsheet served as the single source of truth for all downstream processing.

### 2. Data Cleaning

Raw survey data is never clean — this project was no exception. The cleaning phase involved:

- **Handling missing values** — Imputation strategies tailored to each column's distribution
- **Outlier detection** — Removing extreme salary values and inconsistent entries that would skew results
- **Standardization** — Normalizing free-text fields (job titles, country names) into consistent categorical values
- **Deduplication** — Identifying and eliminating duplicate responses

The result was a clean, analysis-ready dataset that formed the backbone of all visualizations and findings.

### 3. Data Analysis & Visualization

#### 3.1 Power BI Dashboards

Power BI was used to build **interactive, stakeholder-friendly dashboards** that allow users to filter and drill down into the data by role, country, experience level, and more. Key report pages included:

```
Report Pages:
├── Overview          → High-level KPIs and summary statistics
├── Salary Analysis   → Compensation breakdown by role, country, and seniority
├── Tool Adoption     → Most-used languages, frameworks, and platforms
├── Job Satisfaction  → Satisfaction scores segmented by role and location
└── Career Paths      → Role distribution and career progression patterns
```

#### 3.2 Python Visualizations

Python was used in parallel for deeper, code-driven analysis. The stack included **Pandas** for data manipulation, **Matplotlib** for chart rendering, and **Seaborn** for statistical visualizations. A sample of the analysis pipeline:

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def clean_survey_data(df: pd.DataFrame) -> pd.DataFrame:
    # Standardize salary to a consistent numeric format
    df['salary'] = pd.to_numeric(df['salary'], errors='coerce')

    # Normalize free-text country names
    df['country'] = df['country'].str.strip().str.title()

    # Drop nulls and outliers
    df = df.dropna(subset=['salary', 'country', 'role'])
    q_low, q_high = df['salary'].quantile([0.01, 0.99])
    df = df[df['salary'].between(q_low, q_high)]

    return df.reset_index(drop=True)

def plot_salary_by_role(df: pd.DataFrame):
    plt.figure(figsize=(12, 6))
    sns.boxplot(data=df, x='role', y='salary', palette='coolwarm')
    plt.xticks(rotation=30, ha='right')
    plt.title('Salary Distribution by Role')
    plt.tight_layout()
    plt.savefig('salary_by_role.png', dpi=150)
```

### 4. Results & Findings

The analysis surfaced several clear, data-backed insights about the tech and data science workforce — from compensation trends and tool preferences to satisfaction drivers and career patterns.

## Key Insights

- 🐍 **Python** dominates the toolkit across all roles and experience levels
- 💰 **Role and country** are the strongest predictors of compensation
- 📊 **Job satisfaction** varies significantly by work environment and role type
- 🌍 **Geographic salary gaps** are stark — the same role can command vastly different pay across regions
- 🎓 **Education level** shows a measurable positive correlation with salary

## Project Files

| File | Description |
|---|---|
| `Data Professionals Survey.xlsx` | Raw survey data (source of truth) |
| `pfs.pbix` | Power BI file with all interactive dashboards and embedded Python visuals |
| `Data Visualization.odp` | Presentation slides summarizing the project |
| `README.md` | Project documentation |
