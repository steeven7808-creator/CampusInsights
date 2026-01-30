## CampusInsights

CampusInsights is a full-stack TypeScript application that ingests, processes, and queries large-scale campus course and classroom datasets to support fast, flexible analytical queries over real-world academic data.

The system is built around a custom data ingestion pipeline and query execution engine, with a strong emphasis on schema validation, correctness, and performance-aware backend design. A lightweight web-based frontend enables users to submit structured queries and explore query results through a clean API-driven interface.

---

## Key Features

### Data Ingestion Pipeline
- Ingests structured datasets from compressed ZIP archives
- Performs schema validation and data normalization to ensure correctness
- Persists processed data in a format optimized for repeated analytical queries

### Custom Query Engine
- Implements a custom JSON-based query language supporting filtering, comparisons, and logical operators
- Validates query structure and semantics prior to execution to prevent malformed queries
- Designed with extensibility and correctness as first-class concerns

### Backend Service
- Implemented in TypeScript with a modular, service-oriented architecture
- Exposes a well-defined API for dataset management and query execution
- Backed by comprehensive unit and integration tests to ensure reliability

### Frontend Interface
- Lightweight web-based UI for submitting queries and visualizing results
- Communicates with backend services through a defined REST API layer

---

## Query Engine Interface

The backend exposes a custom JSON-based query language that supports filtering,
logical operators, and projection over ingested datasets.

### Example Query

The following query returns all courses with an average grade greater than 85, projecting selected fields and ordering results by average grade.

```json
{
  "WHERE": {
    "GT": {
      "courses_avg": 85
    }
  },
  "OPTIONS": {
    "COLUMNS": ["courses_dept", "courses_id", "courses_avg"],
    "ORDER": "courses_avg"
  }
}
```

## Tech Stack

**Languages**
- TypeScript

**Backend**
- Node.js
- Express
- RESTful API design

**Frontend**
- Web-based UI (TypeScript / JavaScript)

**Tooling**
- Yarn
- ESLint
- Prettier

**Testing**
- Automated unit and integration tests (Mocha / Chai)


## Project Structure

```md
```text
CampusInsights/
├── src/                # Core backend logic and query engine
├── frontend/           # Lightweight web frontend
├── test/               # Integration tests
├── test-unit/          # Unit tests
├── test_template/      # Reference tests and sample resources
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md
```

## How to Run

```bash
yarn install
yarn build
yarn start


