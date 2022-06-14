'use strict';

const Path = require(`path`);
const { v1: uuid } = require(`uuid`);
const EventEmitter = require('events').EventEmitter;
const Config = require(`./default`);

class ChannelPair extends EventEmitter {
  constructor(peerConnection, config = {}) {
    super();
    this.peerConnection = peerConnection;
    this.sender = null;
    this.receiver = null;

    this.config = Config.channel;

    this.callRespondStack = [];

    this.overWriteConfig(this.config, config);
    this.init();
  }

  init() {
    this.createReceiver();
    this.createSender();
  }

  overWriteConfig(dest, src) {
    for(let i in src)
      dest[i] = src[i];
  }

  /*
    Sender
  */
  createSender() {
    console.log(`[${this.constructor.name}]`, `createSender() >> `);
    this.sender = this.peerConnection.createDataChannel(`server-to-client`);
    this.setupSenderListener();
  }

  setupSenderListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    let onSenderOpen = (event) => this.emit(`sender-open`, event);
    let onSenderClose = (event) => this.emit(`sender-close`, event);
    this.sender[func](`open`, onSenderOpen);
    this.sender[func](`close`, onSenderClose);
  }

  /*
    Receiver
  */
  createReceiver() {
    console.log(`[${this.constructor.name}]`, `createReceiver() >> `);
    this.peerConnection.addEventListener(
      `datachannel`,
      (event) => this.onReceiverRequest(event)
    );
  }

  onReceiverRequest(event) {
    console.log(`[${this.constructor.name}]`, `onReceiverRequest() >> `);
    this.receiver = event.channel;
    this.setupReceiverListener();
  }

  setupReceiverListener(set = true) {
    let func = set ? `addEventListener` : `removeEventListener`;
    let onReceiverOpen = (event) => this.emit(`receiver-open`, event);
    let onReceiverMessage = (event) => {
      /*
        data = {
          messageId: ``,
          message: ``
        }
      */
      let data = this.decodeMessage(event.data);
      if(data.type == `message`)
        this.emit(data.type, data.message);
      else
        this.emit(data.type, data);
    };
    let onReceiverError = (event) => this.emit(`receiver-error`, event);
    let onReceiverClose = (event) => this.emit(`receiver-close`, event);
    this.receiver[func](`open`, onReceiverOpen);
    this.receiver[func](`message`, onReceiverMessage);
    this.receiver[func](`error`, onReceiverError);
    this.receiver[func](`close`, onReceiverClose);
  }

  /*
    Send function
  */
  send(message, type = `message`) {
    this.sendRaw(JSON.stringify({
      messageId: uuid(),
      layer: `channel-pair`,
      type: type,
      message: this.encodeMessage(message)
    }));
  }

  reply(messageId, message, type = `reply`) {
    this.sendRaw(JSON.stringify({
      messageId: messageId,
      layer: `channel-pair`,
      type: type,
      message: this.encodeMessage(message)
    }));
  }

  sendRaw(message) {
    this.sender.send(message);
  }

  /*
    Call respond
  */
  callRespond(message, type = `request`) {
    let payload = {
      messageId: uuid(),
      layer: `channel-pair`,
      type: type,
      message: this.encodeMessage(message)
    };
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.sender.send(JSON.stringify(payload)))
      .then(() => this.waitForRespond(payload.messageId))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  waitForRespond(messageId) {
    return new Promise((resolve, reject) => {
      let timeout = null;
      let onMessage = (event) => {
        let ret = JSON.parse(event.data);
        if(ret && ret.messageId == messageId) {
          clearTimeout(timeout);
          this.removeListener(`reply-message`, onMessage.bind(this));
          messageId && resolve(ret.message);
        }
      };
      this.on(`reply`, onMessage.bind(this));
      timeout = setTimeout(
        () => {
          this.removeListener(`reply-message`, onMessage.bind(this));
          reject(new Error(`Call-respond timeout.`));
        }, 
        this.config.channel.callrespond.timeout
      );
    });
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
}

module.exports = ChannelPair;