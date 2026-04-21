import { Netlist } from '../schematic/Netlist';
import { FootprintResolver } from './FootprintResolver';

export interface FootprintPlacement {
  componentRef: string;
  footprintId: string;
  x: number;           // mm
  y: number;
  rotation: number;
  layer: 'F.Cu' | 'B.Cu';
}

export class ForwardAnnotator {
  constructor(private resolver: FootprintResolver) {}

  annotate(netlist: Netlist): FootprintPlacement[] {
    return netlist.getComponents().map(component => ({
      componentRef: component.ref,
      footprintId:  this.resolver.resolve(component),
      x: 0,             // stacked at origin for unplaced
      y: 0,
      rotation: 0,
      layer: 'F.Cu',
    }));
  }
}
