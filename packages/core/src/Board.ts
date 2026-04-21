import { Component } from './Component';

export class Board {
  public components: Map<string, Component> = new Map();

  constructor() {
    // Netlist connectivity is now managed by the schematic store/engine
  }

  public addComponent(component: Component) {
    this.components.set(component.id, component);
  }

  public getComponent(id: string): Component | undefined {
    return this.components.get(id);
  }

  public serialize(): { components: any[] } {
    return {
      components: Array.from(this.components.values()).map(c => c.serialize()),
    };
  }
  
  // Logic for DRC (Design Rule Check) will be integrated here later
}
