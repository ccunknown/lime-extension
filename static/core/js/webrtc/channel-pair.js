export default class ExtensionRTCChannelPair extends EventTarget {
  constructor(peerConnection, config = {}) {
    super();
    this.peerConnection = peerConnection;
    this.sender = null;
    this.receiver = null;

    this.config = {};

    this.initParam(this.config, config);
    this.init();
  }

  initParam(dest, src) {
    for(let i in src)
      dest[i] = src[i];
  }

  init() {
    this.createReceiveChannel();
    this.createSendChannel();
  }

  createReceiveChannel() {
    console.log(`${this.constructor.name}`, `createReceiveChannel() >> `);
    this.peerConnection.addEventListener(`datachannel`, this.onReceiveChannelRequest.bind(this));
  }

  onReceiveChannelRequest(event) {
    console.log(`${this.constructor.name}`, `onReceiveChannelRequest() >> `);
    this.receiver = event.channel;
    this.setupReceiveChannelListener();
  }

  setupReceiveChannelListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    this.receiver[func](`open`, this.onReceiveChannelOpen.bind(this));
    this.receiver[func](`message`, this.onReceiveChannelMessage.bind(this));
    this.receiver[func](`error`, this.onReceiveChannelError.bind(this));
    this.receiver[func](`close`, this.onReceiveChannelClose.bind(this));
  }

  onReceiveChannelOpen(event) { 
    console.log(`[${this.constructor.name}]`, `Receive channel open`); 
    this.dispatchEvent(new CustomEvent(`receive-channel-open`));
  }

  onReceiveChannelMessage(event) {
    let data = this.decodeMessage(event.data);
    // console.log(`[${this.constructor.name}]`, `on message`, data);
    (data.type == `request`) && this.dispatchEvent(new CustomEvent(data.type, { detail: data }));
    (data.type == `reply`) && this.dispatchEvent(new CustomEvent(data.type, { detail: data }));
    (data.type == `message`) && this.dispatchEvent(new CustomEvent(data.type, { detail: data.message }));
  }

  onReceiveChannelError() {
    console.log(`[${this.constructor.name}]`, `Receive channel error:`, event);
  }

  onReceiveChannelClose() {
    console.log(`[${this.constructor.name}]`, `Receive channel close`);
  }

  createSendChannel() {
    console.log(`${this.constructor.name}`, `createSendChannel() >> `);
    this.sender = this.peerConnection.createDataChannel(`client-to-server`);
    this.setupSendChannelListener();
  }

  setupSendChannelListener(set = true) {
    console.log(`${this.constructor.name}`, `setupSendChannelListener() >> `);
    let func = set ? `addEventListener` : `removeEventListener`;
    this.sender[func](`open`, this.onSendChannelOpen.bind(this));
    this.sender[func](`close`, this.onSendChannelClose.bind(this));
  }

  onSendChannelOpen(event) {
    console.log(`[${this.constructor.name}]`, `Send channel open`);
    this.dispatchEvent(new CustomEvent(`send-channel-open`));
  }

  onSendChannelClose(event) {
    console.log(`[${this.constructor.name}]`, `Send channel close`);
  }

  send(message, options) {
    // console.log(`[${this.constructor.name}]`, `send() >> `);
    let payload = {
      messageId: this.uuid(),
      layer: `channel-pair`,
      type: `message`,
      message: message
    };
    this.initParam(payload, options);
    return this.sendRaw(this.encodeMessage(payload));
  }

  sendRaw(message) {
    this.sender.send(message);
  }

  // Millicious
  decodeMessage(text) {
    try {
      return JSON.parse(text);
    } catch(err) {
      return text;
    }
  }

  encodeMessage(arg) {
    return (typeof arg == `object`) ? JSON.stringify(arg) : arg;
  }

  uuid() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }
}