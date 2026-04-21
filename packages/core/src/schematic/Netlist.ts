import Graph from 'graphology'
import { NetlistGraph, ComponentNode, PinNode, NetNode } from '../types/net'
import { PinType } from '../types/pin'

export class Netlist {
  private graph: NetlistGraph = new Graph()

  // — write operations —
  addComponent(ref: string, symbolId: string, footprintId: string): void {
    if (!this.graph.hasNode(ref)) {
      this.graph.addNode(ref, { kind: 'component', ref, symbolId, footprintId })
    }
  }

  addPin(componentRef: string, pinNumber: string, pinName: string, type: PinType): void {
    // Normalize pinRef to include 'pin-' prefix to match UI interaction logic
    const pinNumberClean = pinNumber.replace('pin-', '')
    const pinRef = `${componentRef}.pin-${pinNumberClean}`
    
    if (!this.graph.hasNode(pinRef)) {
      this.graph.addNode(pinRef, {
        kind: 'pin', ref: pinRef, componentRef, pinNumber: pinNumberClean, pinName, type
      })
      if (!this.graph.hasNode(componentRef)) {
        // Lazy register component if missing
        this.addComponent(componentRef, 'unknown', '')
      }
      this.graph.addEdge(componentRef, pinRef, { kind: 'pin-to-component' })
    }
  }

  assignNet(pinRef: string, netId: string): void {
    // Normalize pinRef to ensure it uses .pin- prefix
    const normalizedPinRef = pinRef.includes('.pin-') ? pinRef : pinRef.replace('.', '.pin-')

    if (!this.graph.hasNode(netId)) {
      this.graph.addNode(netId, { kind: 'net', netId, name: netId })
    }

    if (!this.graph.hasNode(normalizedPinRef)) {
      console.warn(`Netlist: attempt to assign net to missing pin "${normalizedPinRef}". Adding dummy node.`)
      this.graph.addNode(normalizedPinRef, { 
        kind: 'pin', 
        ref: normalizedPinRef, 
        componentRef: 'unknown', 
        pinNumber: '?', 
        pinName: '?', 
        type: PinType.PASSIVE 
      })
    }

    // remove from old net first
    this.graph.edges(normalizedPinRef)
      .filter(e => this.graph.getEdgeAttribute(e, 'kind') === 'pin-to-net')
      .forEach(e => this.graph.dropEdge(e))

    this.graph.addEdge(normalizedPinRef, netId, { kind: 'pin-to-net' })
  }

  disconnectPin(pinRef: string): void {
    const normalizedPinRef = pinRef.includes('.pin-') ? pinRef : pinRef.replace('.', '.pin-')
    if (!this.graph.hasNode(normalizedPinRef)) return

    this.graph.edges(normalizedPinRef)
      .filter(e => this.graph.getEdgeAttribute(e, 'kind') === 'pin-to-net')
      .forEach(e => this.graph.dropEdge(e))
  }

  // — read operations (for ErcEngine to consume) —
  getNetIds(): string[] {
    return this.graph.nodes()
      .filter(n => this.graph.getNodeAttribute(n, 'kind') === 'net')
  }

  getNets(): Array<{ netId: string; pins: PinNode[] }> {
    return this.getNetIds().map(netId => ({
      netId,
      pins: this.getPinsOnNet(netId),
    }))
  }

  getComponents(): ComponentNode[] {
    return this.graph.nodes()
      .map(n => this.graph.getNodeAttributes(n))
      .filter((n: ComponentNode | PinNode | NetNode): n is ComponentNode => n.kind === 'component')
  }

  getPinsOnNet(netId: string): PinNode[] {
    return this.graph.neighbors(netId)
      .map(n => this.graph.getNodeAttributes(n) as PinNode)
      .filter(n => n.kind === 'pin')
  }

  getComponentPins(componentRef: string): PinNode[] {
    return this.graph.neighbors(componentRef)
      .map(n => this.graph.getNodeAttributes(n) as PinNode)
      .filter(n => n.kind === 'pin')
  }

  getPinNet(pinRef: string): string | null {
    const normalizedPinRef = pinRef.includes('.pin-') ? pinRef : pinRef.replace('.', '.pin-')
    if (!this.graph.hasNode(normalizedPinRef)) return null
    const netEdge = this.graph.edges(normalizedPinRef)
      .find(e => this.graph.getEdgeAttribute(e, 'kind') === 'pin-to-net')
    if (!netEdge) return null
    return this.graph.opposite(normalizedPinRef, netEdge)
  }

  getAllPins(): PinNode[] {
    return this.graph.nodes()
      .map(n => this.graph.getNodeAttributes(n))
      .filter((n): n is PinNode => n.kind === 'pin')
  }

  toJSON(): object {
    return this.graph.export()
  }
}
