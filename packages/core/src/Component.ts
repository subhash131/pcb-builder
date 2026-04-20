export interface Pin {
  id: string;
  name: string;
  number: string;
  type: 'input' | 'output' | 'passive' | 'power_in' | 'power_out';
}

export class Component {
  public id: string;
  public designator: string; // e.g., R1, U1
  public value: string; // e.g., 10k, STM32
  public footprint: string; // reference to footprint id
  public pins: Pin[] = [];

  constructor(id: string, designator: string, value: string, footprint: string) {
    this.id = id;
    this.designator = designator;
    this.value = value;
    this.footprint = footprint;
  }

  public addPin(pin: Pin) {
    this.pins.push(pin);
  }

  public getPin(pinId: string): Pin | undefined {
    return this.pins.find(p => p.id === pinId);
  }

  public serialize() {
    return {
      id: this.id,
      designator: this.designator,
      value: this.value,
      footprint: this.footprint,
      pins: this.pins
    };
  }
}
