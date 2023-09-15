export type FrameEventBusTopic = string;
export type FrameEventBusEvent = string;
export type FrameEventBusPayload<T> = T | any;
export type FrameEventBusCallback<T, R> = (payload: FrameEventBusPayload<T>) => R | any;

export type FrameEventBusConfig = {
  notifyCurrentFrame?: boolean;
  notifyParentFrame?: boolean;
  notifyChildFrames?: boolean;
};

export type FrameEventBusListeners = {
  [topic: FrameEventBusTopic]: {
    [eventId: FrameEventBusEvent]: FrameEventBusCallback<any, any>;
  };
};

export type FrameEventEmitData<T> = {
  topics: FrameEventBusTopic[];
  payload: FrameEventBusPayload<T>;
};
export type FrameEventBusContext = Window | null;

class FrameEventBus {
  private _config: FrameEventBusConfig;
  private _listeners: FrameEventBusListeners;
  private _currentFrame!: FrameEventBusContext;
  private _parentFrame!: FrameEventBusContext;
  private _childFrames!: FrameEventBusContext[];

  constructor(config: FrameEventBusConfig = {}) {
    this._listeners = {};
    this._config = {
      notifyCurrentFrame: true,
      notifyParentFrame: true,
      notifyChildFrames: true,
      ...config,
    };

    this._initFrames();
    this._initEvents();
  }

  listen<T, R>(topics: FrameEventBusTopic[], callback: FrameEventBusCallback<T, R>) {
    const eventId = this._uuid();
    for (const topic of topics) {
      if (!this._listeners[topic]) this._listeners[topic] = {};
      this._listeners[topic][eventId] = callback;
    }
    return this._unregister(topics, eventId);
  }

  emit<T>(topics: FrameEventBusTopic[], payload: FrameEventBusPayload<T>) {
    this._initFrames();
    const data: FrameEventEmitData<T> = { topics, payload };
    if (this._config.notifyCurrentFrame) this._postMessage([this._currentFrame], data, window.origin);
    if (this._config.notifyParentFrame) this._postMessage([this._parentFrame], data, '*');
    if (this._config.notifyChildFrames) this._postMessage(this._childFrames, data, '*');
  }

  reload() {
    this._initFrames();
    this._initEvents();
  }

  private _initFrames() {
    this._currentFrame = window;
    this._parentFrame = window.top !== window.self ? window.top : null;
    this._childFrames = Array.from(window.document.querySelectorAll('iframe')).map((i) => i.contentWindow);
  }

  private _initEvents() {
    const onMessage = this._onMessage.bind(this);
    window.removeEventListener('message', onMessage);
    window.addEventListener('message', onMessage);
  }

  private _onMessage(e: MessageEvent<FrameEventEmitData<any>>) {
    const { topics, payload } = e.data;
    for (const topic of topics) {
      if (!this._listeners[topic]) return;
      for (const eventId in this._listeners[topic]) {
        if (!this._listeners[topic].hasOwnProperty(eventId)) continue;
        this._listeners[topic][eventId](payload);
      }
    }
  }

  private _postMessage(contexts: FrameEventBusContext[], payload: FrameEventBusPayload<any>, location: string) {
    for (const context of contexts) {
      if (!context) continue;
      context.postMessage(payload, location);
    }
  }

  private _unregister(topics: FrameEventBusTopic[], eventId: FrameEventBusEvent) {
    return () => {
      for (const topic of topics) {
        delete this._listeners[topic][eventId];
        if (Object.keys(this._listeners[topic]).length === 0) {
          delete this._listeners[topic];
        }
      }
    };
  }

  private _uuid() {
    return Math.random().toString(36).substring(2, 9);
  }
}

export default FrameEventBus;
