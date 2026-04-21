import { ComponentNode } from '../types/net';

interface FootprintRule {
  match: (component: ComponentNode) => boolean;
  footprintId: string;
}

const FOOTPRINT_RULES: FootprintRule[] = [
  // Resistors
  { 
    match: c => c.symbolId?.toLowerCase().includes('resistor') || c.ref?.startsWith('R'), 
    footprintId: 'Resistor_SMD:R_0805_2012Metric' 
  },
  // Capacitors
  { 
    match: c => c.symbolId?.toLowerCase().includes('capacitor') || c.ref?.startsWith('C'), 
    footprintId: 'Capacitor_SMD:C_0805_2012Metric' 
  },
  // Inductors
  { 
    match: c => c.symbolId?.toLowerCase().includes('inductor') || c.ref?.startsWith('L'), 
    footprintId: 'Inductor_SMD:L_0805_2012Metric' 
  },
  // LEDs
  { 
    match: c => c.symbolId?.toLowerCase().includes('led') || c.ref?.startsWith('D'), 
    footprintId: 'LED_SMD:LED_0805_2012Metric' 
  },
];

export class FootprintResolver {
  resolve(component: ComponentNode): string {
    // 1. Explicit footprint field in netlist node (from schematic properties) wins
    if (component.footprintId && component.footprintId !== 'unknown' && component.footprintId !== '') {
      return component.footprintId;
    }

    // 2. Match rules
    const rule = FOOTPRINT_RULES.find(r => r.match(component));
    if (rule) return rule.footprintId;

    // 3. Generic fallback
    return `Generic:HOUSING_DIP_8_W7.62mm`;
  }
}
