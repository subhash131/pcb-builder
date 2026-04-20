import { SerializedGraph } from 'graphology-types';
import { Component } from './Component';
import { Netlist } from './Netlist';

export class Board {
  public components: Map<string, Component> = new Map();
  public netlist: Netlist;

  constructor() {
    this.netlist = new Netlist();
  }

  public addComponent(component: Component) {
    this.components.set(component.id, component);
    this.netlist.addComponent(component.id, component.pins.map(p => p.id));
  }

  public getComponent(id: string): Component | undefined {
    return this.components.get(id);
  }

  public connectPins(compA: string, pinA: string, compB: string, pinB: string, netId: string) {
    this.netlist.connect(
      { componentId: compA, pinId: pinA },
      { componentId: compB, pinId: pinB },
      netId
    );
  }

  public serialize(): { components: any[], netlist: SerializedGraph } {
    return {
      components: Array.from(this.components.values()).map(c => c.serialize()),
      netlist: this.netlist.serialize()
    };
  }
  
  // Logic for DRC/ERC will be integrated here later
}
