import { NCEngine, AreaCode, LogLevel, ConnectionStatusHandler, MessageHandler, DirectChannelIdentifier, SendTextMessageParams } from '@nexconn/chat';
import { NCChatUIApplication } from '@nexconn/chatui';
import type { ServiceHooks } from '@nexconn/chatui';

export interface LabTelemetryData {
  type: 'TELEMETRY' | 'ANNOUNCEMENT' | 'ROOM_SYNC' | 'USER_JOINED' | 'PROCEDURE_STEP' | 'STATE_SYNC' | 'CHAT_MESSAGE' | 'REQUEST_SYNC';
  roomId: string;
  studentId: string;
  clientId?: string; // Unique per browser tab instance to guarantee cross-tab identification
  studentName?: string;
  module: string;
  volumeDispensed: number;
  flaskColor: string;
  isEndpointReached: boolean;
  timestamp: number;
  message?: string;
  chatMessage?: { role: 'user' | 'assistant'; content: string };
  // Full State Snapshot
  snapshot?: any;
  // Procedure Sync Fields
  checklist?: Record<string, boolean>;
  isBuretteFilled?: boolean;
  flaskHasSample?: boolean;
  flaskHasIndicator?: boolean;
  flaskIndicatorType?: 'EBT' | 'OTHER' | null;
  selectedEquipment?: string | null;
  activePipetteLiquid?: 'WATER' | 'DISTILLED' | null;
  isStopcockOpen?: boolean;
  stopcockOperatorId?: string | null;
  isSwirling?: boolean;
}

type TelemetryListener = (data: LabTelemetryData) => void;

class NexconnManager {
  private static instance: NexconnManager;
  private app: NCChatUIApplication | null = null;
  private isInitialized = false;
  private isConnected = false;
  private currentUserId = '';
  private clientId: string;
  private telemetryListeners: Set<TelemetryListener> = new Set();
  private activeRoomId: string = (typeof window !== 'undefined' && sessionStorage.getItem('current_active_lab_room')) || 'LAB-DEFAULT';
  private broadcastChannel: BroadcastChannel | null = null;

  private constructor() {
    // Generate unique client ID per tab/window instance so tabs never conflict
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    if (typeof window !== 'undefined') {
      const storedRoom = sessionStorage.getItem('current_active_lab_room');
      if (storedRoom) {
        this.activeRoomId = storedRoom;
      }
      (window as any).__HYD_CLIENT_ID = this.clientId;
      (window as any).__CURRENT_ROOM_ID = this.activeRoomId;
    }
    
    // Persistent BroadcastChannel using the activeRoomId
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`hydrolab_${this.activeRoomId}`);
        (window as any).__nexconn_channel = this.broadcastChannel;
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && (!event.data.roomId || event.data.roomId === this.activeRoomId)) {
            this.notifyLocalListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('[NexconnManager] BroadcastChannel init error:', e);
      }
    }
  }

  public getBroadcastChannel(): BroadcastChannel | null {
    return this.broadcastChannel;
  }

  public static getInstance(): NexconnManager {
    if (!NexconnManager.instance) {
      NexconnManager.instance = new NexconnManager();
    }
    return NexconnManager.instance;
  }

  public getClientId(): string {
    return this.clientId;
  }

  public async initAndConnect(userId: string, userName?: string): Promise<boolean> {
    try {
      this.currentUserId = userId;

      // 1. Fetch token securely from our application backend
      const res = await fetch('/api/v1/nexconn/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: userName }),
      });

      if (!res.ok) {
        throw new Error(`Token endpoint returned ${res.status}`);
      }

      const { token, appKey } = await res.json();

      // 2. Initialize NCEngine (Core Chat SDK)
      if (!this.isInitialized) {
        NCEngine.initialize({
          appKey: appKey || 'z3v5yqkbzen70',
          logLevel: LogLevel.WARN,
          areaCode: AreaCode.SG,
        });

        // Add Connection Status Handler
        NCEngine.addConnectionStatusHandler(
          'hydrolab-main',
          new ConnectionStatusHandler({
            onConnectionStatusChanged({ status, code }) {
              console.log('[Nexconn Chat SDK] Connection status:', status, 'code:', code);
            },
          })
        );

        // Add Global Message Handler for Live Telemetry & Announcements
        NCEngine.addMessageHandler(
          'hydrolab-telemetry',
          new MessageHandler({
            onMessageReceived: ({ messages }) => {
              for (const msg of messages) {
                try {
                  const content = msg.content as any;
                  if (content && typeof content === 'object' && 'text' in content) {
                    const text = content.text;
                    if (text && typeof text === 'string' && text.startsWith('__NEXCONN_LAB_TELEMETRY__')) {
                      const jsonStr = text.replace('__NEXCONN_LAB_TELEMETRY__', '');
                      const data: LabTelemetryData = JSON.parse(jsonStr);
                      // Discard telemetry older than 15 seconds so historical chat history replays on login never trigger titration
                      if (data.timestamp && Date.now() - data.timestamp > 15000) {
                        continue;
                      }
                      this.notifyTelemetryListeners(data);
                    }
                  }
                } catch {
                  // Ignore non-telemetry text
                }
              }
            },
          })
        );

        // 3. Initialize ChatUI (Ready-made Web Component layer)
        const hooks: ServiceHooks = {
          reqUserProfiles: async (ids) => {
            return ids.map((id) => ({
              userId: id,
              name: id === 'dr_hydro_ai' ? 'Dr. Hydro AI' : (id.startsWith('faculty_') ? 'Prof. Faculty (Supervisor)' : `Student (${id.slice(0, 10)})`),
              avatarUrl: id === 'dr_hydro_ai' ? 'https://api.dicebear.com/7.x/bottts/svg?seed=DrHydro' : '',
            }));
          },
          reqGroupProfiles: async (groupIds) => {
            return groupIds.map((gid) => ({
              groupId: gid,
              name: `Lab Collaboration Room: ${gid}`,
              avatarUrl: '',
              memberCount: 3,
            }));
          },
          reqSystemProfiles: async (targetIds) => {
            return targetIds.map((tid) => ({
              systemId: tid,
              name: `System Notice: ${tid}`,
            }));
          },
          reqGroupMembers: async () => [],
        };

        this.app = NCChatUIApplication.initialize({
          hooks,
          language: 'en_US',
        });

        this.app?.ready();
        this.isInitialized = true;
      }

      // 4. Connect to Nexconn Signaling & Chat Network
      if (!this.isConnected && token) {
        const connResult = await NCEngine.connect({ token });
        if (connResult.isOk && connResult.data) {
          console.log('[Nexconn] Successfully connected to Nexconn Cloud! User:', connResult.data.userId);
          this.isConnected = true;
        } else {
          console.warn('[Nexconn] Connection result code:', connResult.code);
        }
      }

      return true;
    } catch (err) {
      console.error('[NexconnManager] Init / Connect error:', err);
      return false;
    }
  }

  public setActiveRoom(roomId: string) {
    if (this.activeRoomId === roomId && this.broadcastChannel) return;
    this.activeRoomId = roomId;
    if (typeof window !== 'undefined') {
      (window as any).__CURRENT_ROOM_ID = roomId;
      sessionStorage.setItem('current_active_lab_room', roomId);
      sessionStorage.setItem('active_lab_room', roomId);
    }

    // Switch BroadcastChannel to room-specific channel to isolate tabs in different rooms
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        if (this.broadcastChannel) {
          this.broadcastChannel.close();
        }
        this.broadcastChannel = new BroadcastChannel(`hydrolab_${roomId}`);
        (window as any).__nexconn_channel = this.broadcastChannel;
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && (!event.data.roomId || event.data.roomId === this.activeRoomId)) {
            this.notifyLocalListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('[NexconnManager] BroadcastChannel switch error:', e);
      }
    }
  }

  /**
   * Broadcasts a full state snapshot so every single button, reading, flask and slider syncs seamlessly
   */
  public async broadcastFullSnapshot(snapshot: any) {
    const vol = snapshot.flaskTitrantVolume !== undefined ? snapshot.flaskTitrantVolume : (
      typeof window !== 'undefined' ? (window as any).__LAST_TITRANT_VOL || 0 : 0
    );

    const fullData: LabTelemetryData = {
      type: 'STATE_SYNC',
      roomId: this.activeRoomId,
      studentId: this.currentUserId,
      clientId: this.clientId,
      module: snapshot.activeModule || 'HARDNESS',
      volumeDispensed: vol,
      flaskColor: '',
      isEndpointReached: false,
      timestamp: Date.now(),
      snapshot,
    };

    this.notifyTelemetryListeners(fullData);
    const serialized = `__NEXCONN_LAB_TELEMETRY__${JSON.stringify(fullData)}`;
    await this.sendDirectTextMessage('dr_hydro_ai', serialized);
  }

  /**
   * Requests initial state snapshot from any already active peer in the room
   */
  public async requestStateSnapshot() {
    const reqData: LabTelemetryData = {
      type: 'REQUEST_SYNC',
      roomId: this.activeRoomId,
      studentId: this.currentUserId,
      clientId: this.clientId,
      module: 'HARDNESS',
      volumeDispensed: 0,
      flaskColor: '',
      isEndpointReached: false,
      timestamp: Date.now(),
    };

    this.notifyTelemetryListeners(reqData);
    const serialized = `__NEXCONN_LAB_TELEMETRY__${JSON.stringify(reqData)}`;
    await this.sendDirectTextMessage('dr_hydro_ai', serialized);
  }

  /**
   * Broadcasts shared chat message between peers
   */
  public async broadcastPeerChat(chat: { role: 'user' | 'assistant'; content: string }) {
    const fullData: LabTelemetryData = {
      type: 'CHAT_MESSAGE',
      roomId: this.activeRoomId,
      studentId: this.currentUserId,
      clientId: this.clientId,
      module: 'CHAT',
      volumeDispensed: 0,
      flaskColor: '',
      isEndpointReached: false,
      timestamp: Date.now(),
      chatMessage: chat,
    };

    this.notifyTelemetryListeners(fullData);
    const serialized = `__NEXCONN_LAB_TELEMETRY__${JSON.stringify(fullData)}`;
    await this.sendDirectTextMessage('dr_hydro_ai', serialized);
  }

  /**
   * Broadcasts procedure actions (filling burette, pipetting, adding indicator, checklist)
   */
  public async broadcastProcedureStep(payload: {
    checklist: Record<string, boolean>;
    isBuretteFilled?: boolean;
    flaskHasSample?: boolean;
    flaskHasIndicator?: boolean;
    flaskIndicatorType?: 'EBT' | 'OTHER' | null;
    selectedEquipment?: string | null;
    activePipetteLiquid?: 'WATER' | 'DISTILLED' | null;
  }) {
    const fullData: LabTelemetryData = {
      type: 'PROCEDURE_STEP',
      roomId: this.activeRoomId,
      studentId: this.currentUserId,
      clientId: this.clientId,
      module: 'PROCEDURE',
      volumeDispensed: 0,
      flaskColor: '',
      isEndpointReached: false,
      timestamp: Date.now(),
      ...payload
    };

    this.notifyTelemetryListeners(fullData);
    const serialized = `__NEXCONN_LAB_TELEMETRY__${JSON.stringify(fullData)}`;
    await this.sendDirectTextMessage('dr_hydro_ai', serialized);
  }

  /**
   * Broadcasts that a student has entered the collaborative lab room
   */
  public async broadcastJoinRoom(roomId: string, studentName?: string) {
    this.setActiveRoom(roomId);
    const joinData: LabTelemetryData = {
      type: 'USER_JOINED',
      roomId,
      studentId: this.currentUserId,
      clientId: this.clientId,
      studentName: studentName || this.currentUserId,
      module: 'COLLABORATION',
      volumeDispensed: 0,
      flaskColor: '',
      isEndpointReached: false,
      timestamp: Date.now(),
      message: `${studentName || this.currentUserId} joined Room ${roomId}`
    };

    this.notifyTelemetryListeners(joinData);
    const serialized = `__NEXCONN_LAB_TELEMETRY__${JSON.stringify(joinData)}`;
    await this.sendDirectTextMessage('dr_hydro_ai', serialized);
  }

  public getActiveRoom(): string {
    return this.activeRoomId;
  }

  public subscribeTelemetry(listener: TelemetryListener) {
    this.telemetryListeners.add(listener);
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  private notifyLocalListeners(data: LabTelemetryData) {
    this.telemetryListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in telemetry listener:', err);
      }
    });
  }

  private notifyTelemetryListeners(data: LabTelemetryData) {
    // Notify in-process listeners
    this.notifyLocalListeners(data);

    // Cross-tab broadcast via single persistent channel
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(data);
      }
    } catch (err) {
      console.warn('[NexconnManager] BroadcastChannel send error:', err);
    }

    // Also relay to backend for cross-browser / cross-network peer sync
    if (data.type === 'TELEMETRY' || data.type === 'STATE_SYNC' || data.type === 'PROCEDURE_STEP') {
      fetch('/api/v1/nexconn/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
  }

  /**
   * Broadcasts student titration actions in real-time across Nexconn Network
   */
  public async broadcastTelemetry(payload: Omit<LabTelemetryData, 'type' | 'timestamp' | 'clientId'>) {
    const fullData: LabTelemetryData = {
      ...payload,
      clientId: this.clientId,
      type: 'TELEMETRY',
      timestamp: Date.now(),
    };

    // 1. Dispatch locally so local listeners update immediately
    this.notifyTelemetryListeners(fullData);

    // 2. Dispatch via Nexconn Direct message to bot/faculty channel (don't await or block tick loop)
    const serialized = `__NEXCONN_LAB_TELEMETRY__${JSON.stringify(fullData)}`;
    this.sendDirectTextMessage('dr_hydro_ai', serialized).catch(() => {});
  }

  /**
   * Faculty pushes real-time announcement to students in the lab
   */
  public async broadcastFacultyNotice(roomId: string, message: string) {
    const notice: LabTelemetryData = {
      type: 'ANNOUNCEMENT',
      roomId,
      studentId: this.currentUserId,
      clientId: this.clientId,
      module: 'SUPERVISOR',
      volumeDispensed: 0,
      flaskColor: '',
      isEndpointReached: false,
      timestamp: Date.now(),
      message,
    };

    this.notifyTelemetryListeners(notice);
    const serialized = `__NEXCONN_LAB_TELEMETRY__${JSON.stringify(notice)}`;
    await this.sendDirectTextMessage('dr_hydro_ai', serialized);
  }

  public getApp(): NCChatUIApplication | null {
    return this.app;
  }

  public isReady(): boolean {
    return this.isInitialized && (this.app?.ifReady() ?? false);
  }

  public async openDirectChat(peerUserId: string) {
    if (this.app?.ifReady()) {
      await this.app.openChannel(new DirectChannelIdentifier(peerUserId), true);
    }
  }

  public async sendDirectTextMessage(peerUserId: string, text: string) {
    if (this.app?.ifReady()) {
      return await this.app.sendMessage(
        new DirectChannelIdentifier(peerUserId),
        new SendTextMessageParams({ text })
      );
    }
    return null;
  }

  public getUserId(): string {
    return this.currentUserId;
  }
}

export default NexconnManager;
