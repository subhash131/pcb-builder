# 🗺️ PCB Builder Roadmap

Build an open-source, web-based PCB design suite with a focus on AI assistance and modern web technologies.

## 🏗️ Phase 1: Schematic Editor (Foundation)
- [ ] **Infrastructure Setup**
  - [ ] Scaffold `packages/core` for netlist logic
  - [ ] Scaffold `packages/kicad-parser` for symbol parsing
  - [ ] Configure Turborepo for new package dependencies
- [ ] **Schematic Canvas**
  - [ ] Integrate `@tldraw/tldraw` into `apps/web`
  - [ ] Implement custom shapes for symbols (Resistors, Caps, ICs)
  - [ ] Basic symbol placement and movement
- [ ] **Netlist Engine**
  - [ ] Implement `graphology` based netlist model in `packages/core`
  - [ ] Net assignment and wire drawing logic
  - [ ] Port management (Inputs, Outputs, Passive)
- [ ] **Basic ERC (Electrical Rule Check)**
  - [ ] Floating pins detection
  - [ ] Output conflict detection (Short circuits)
  - [ ] Missing power pins check

## 🎨 Phase 2: PCB Editor (Placement & Routing)
- [ ] **PCB Canvas**
  - [ ] Setup `Konva.js` with `react-konva` for high-performance rendering
  - [ ] Coordinate system mapping (mm-grid precision)
- [ ] **Forward Annotation**
  - [ ] Sync schematic netlist to PCB layout
  - [ ] Footprint loading from `kicad-parser`
- [ ] **Manual Routing**
  - [ ] Multi-layer trace drawing
  - [ ] Via placement logic
- [ ] **DRC (Design Rule Check)**
  - [ ] Spatial indexing with `rbush`
  - [ ] Clearance checks using `clipper-lib`
  - [ ] Connectivity validation (Is every net fully routed?)
- [ ] **3D View Foundation**
  - [ ] Three.js scene setup
  - [ ] Basic board extrusion (FR4 substrate)

## 🧠 Phase 3: Automation & Export
- [ ] **Autorouting**
  - [ ] Dockerize `freerouting`
  - [ ] API integration for .dsn export/import
- [ ] **Manufacturing Export**
  - [ ] Gerber file generation (`gerber-to-svg` / custom serializer)
  - [ ] BOM (Bill of Materials) export to `.xlsx`
  - [ ] PDF schematic export with `jsPDF`
- [ ] **Backend Persistence**
  - [ ] PostgreSQL + Prisma setup for project storage
  - [ ] BullMQ + Redis for background routing jobs

## 🧪 Phase 4: Advanced Features & Simulation
- [ ] **SPICE Simulation**
  - [ ] Integrate `ngspice-wasm` for in-browser simulations
  - [ ] Visual waveform viewer
- [ ] **AI Assistance (V2)**
  - [ ] LLM-powered component selection
  - [ ] Automatic footprint assignment
  - [ ] Natural language design commands (e.g., "Add an LED to pin 13")

## 🧊 Phase 5: 3D Board Visualization
- [ ] **Layer Geometry Generation**
  - [ ] F.Cu & B.Cu trace extrusions
  - [ ] Solder mask (translucent green layer)
  - [ ] Silkscreen (top-layer texture/geometry)
- [ ] **Component Rendering**
  - [ ] Support for STEP/glTF model loading
  - [ ] Interactive rotation and camera controls
- [ ] **Via Visualization**
  - [ ] Cylinder extrusions through the board

---

## 🛠️ Tech Stack Recap
- **Core:** Next.js, TypeScript, Pnpm, Turborepo
- **UI:** shadcn/ui, Tailwind CSS, Lucide Icons
- **Canvas:** tldraw (Schematic), Konva.js (PCB)
- **Logic:** graphology, rbush, clipper-lib, pathfinding.js
- **Backend:** ConvexDB
