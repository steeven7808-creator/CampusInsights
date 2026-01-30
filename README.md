# CampusInsights

CampusInsights is a full-stack TypeScript project that ingests, processes, and queries large-scale structured datasets to support fast, flexible analytical queries over real-world data.

The system is designed with a strong emphasis on data modeling, query validation, and performance-aware execution, providing a robust backend service and a simple frontend interface for interacting with the data.

---

## Key Features

- **Data Ingestion Pipeline**
  - Supports importing structured datasets from compressed archives (ZIP)
  - Performs schema validation and data normalization during ingestion
  - Persists processed datasets for efficient querying

- **Custom Query Engine**
  - Supports complex query expressions including filtering, comparisons, and logical operators
  - Validates query structure and semantics before execution
  - Designed for extensibility and correctness over malformed inputs

- **Backend Service**
  - Implemented in TypeScript with a modular architecture
  - Exposes a service interface for dataset management and querying
  - Includes comprehensive unit and integration tests

- **Frontend Interface**
  - Lightweight frontend for submitting queries and visualizing results
  - Communicates with backend services through a defined API layer

---

## Tech Stack

- **Languages:** TypeScript
- **Backend:** Node.js
- **Frontend:** Web-based UI (TypeScript / JavaScript)
- **Tooling:** Yarn, ESLint, Prettier
- **Testing:** Automated unit and integration tests

---

## Project Structure

