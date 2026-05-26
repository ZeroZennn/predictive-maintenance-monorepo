import { io, Socket } from 'socket.io-client'
import type { WsConnectionState } from './ws-events'
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || 'http://localhost:3000'

class WebSocketManager {
  private socket: Socket | null = null
  private static instance: WebSocketManager

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  connect(): void {
    if (this.socket?.connected) return

    this.socket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    })

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason)
    })

    this.socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message)
    })
  }

  joinMachine(machineId: string): void {
    this.socket?.emit('join:machine', machineId)
  }

  leaveMachine(machineId: string): void {
    this.socket?.emit('leave:machine', machineId)
  }

  joinGlobal(): void {
    this.socket?.emit('join:global')
  }

  joinSimulator(): void {
    this.socket?.emit('join:simulator')
  }

  on(event: string, callback: (data: unknown) => void): void {
    this.socket?.on(event, callback)
  }

  off(event: string, callback?: (data: unknown) => void): void {
    this.socket?.off(event, callback)
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  getConnectionState(): WsConnectionState {
    if (!this.socket) return "DISCONNECTED"
    if (this.socket.connected) return "CONNECTED"
    if (this.socket.active) return "CONNECTING"
    return "DISCONNECTED"
  }
}

export const wsManager = WebSocketManager.getInstance()
export default wsManager
