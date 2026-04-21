import Graph from 'graphology';
import { AbstractGraph, SerializedGraph } from 'graphology-types';

export interface Connection {
  componentId: string;
  pinId: string;
}

export class Netlist {
  private graph: AbstractGraph;

  constructor() {
    // Interop for CJS/ESM discrepancy
    this.graph = new Graph();
  }

  /**
   * Adds a component to the netlist graph.
   * Each pin of the component becomes a node.
   */
  public addComponent(componentId: string, pinIds: string[]) {
    pinIds.forEach(pinId => {
      const nodeId = `${componentId}:${pinId}`;
      if (!this.graph.hasNode(nodeId)) {
        this.graph.addNode(nodeId, { componentId, pinId });
      }
    });
  }

  /**
   * Connects two component pins together.
   * This represents a physical wire/net.
   */
  public connect(a: Connection, b: Connection, netId: string) {
    const nodeA = `${a.componentId}:${a.pinId}`;
    const nodeB = `${b.componentId}:${b.pinId}`;

    // Auto-register nodes if missing — connectPins may be called before addComponent
    // (e.g. when the AI inserts a wire binding directly into the DB)
    if (!this.graph.hasNode(nodeA)) {
      this.graph.addNode(nodeA, { componentId: a.componentId, pinId: a.pinId });
    }
    if (!this.graph.hasNode(nodeB)) {
      this.graph.addNode(nodeB, { componentId: b.componentId, pinId: b.pinId });
    }

    if (!this.graph.hasEdge(nodeA, nodeB)) {
      this.graph.addEdge(nodeA, nodeB, { netId });
    }
  }

  /**
   * Returns all nodes (pins) connected to the same net.
   */
  public getNetConnections(netId: string): string[] {
    // Basic implementation: find all edges with this netId
    const connectedNodes = new Set<string>();
    this.graph.forEachEdge((edge, attributes, source, target) => {
      if (attributes.netId === netId) {
        connectedNodes.add(source);
        connectedNodes.add(target);
      }
    });
    return Array.from(connectedNodes);
  }

  findOrCreateNet(id: string): string {
    // Logic to find an existing net or create a new one
    return id
  }

  public serialize(): SerializedGraph {
    return this.graph.export();
  }
}
