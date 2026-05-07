# Operating Systems Academy Laboratory

Welcome to the **Operating Systems Academy**, a high-fidelity, systems-engineering workstation designed to bridge the gap between high-level code and physical silicon.

## 🚀 Vision
This platform is not just a collection of educational pages; it is a **Systems Sandbox**. Every concept is backed by a state-driven simulator that allows you to observe, manipulate, and break the kernel-level mechanics of a modern operating system.

## 🛠️ Features
- **High-Fidelity Simulators**:
  - **CPU Scheduling**: FCFS, SJF, Priority, and Round Robin with context-switch penalties.
  - **Memory Observatory**: Address translation (VPN/Offset), TLB behavior, Page Faults, and Cache Physics (MESI).
  - **Storage Physics**: Mechanical HDD seek vs SSD NAND flash management.
  - **Concurrency Lab**: Race conditions, Semaphores, and Dining Philosophers.
  - **Deadlock Diagnostics**: Banker's Algorithm and Resource Allocation Graphs (RAG).
- **Engineering Aesthetics**: High-contrast, terminal-inspired UI with robust telemetry.
- **Linux Track**: Practical application of OS theory to the Linux kernel.

## 📂 Project Structure
- `assets/js/simulator-engine.js`: The central orchestrator for all state-driven simulations.
- `assets/js/core.js`: App initialization and performance monitoring.
- `assets/css/`: Modular CSS system using modern design tokens.
- `assets/data/concepts/`: Content definitions for all modules.

## 🌐 Deployment
The platform is production-ready and optimized for **Cloudflare Pages**.
1. Push this repository to GitHub.
2. Connect the repository to Cloudflare Pages.
3. Build Settings:
   - **Framework Preset**: None (Static Site)
   - **Build Command**: None
   - **Output Directory**: `.`

## 🛡️ Stability
The platform features:
- **Error Boundaries**: Prevents a single simulator crash from breaking the page.
- **FPS Monitoring**: Ensures smooth animations across all devices.
- **Responsive Design**: Engineering-grade experience on desktop and mobile.

---
*Built with passion for Systems Engineering.*
