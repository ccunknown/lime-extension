/* eslint-disable class-methods-use-this */
const { v1: uuid } = require(`uuid`);
const { EventEmitter } = require(`events`);
const { RTCPeerConnection, RTCIceCandidate } = require(`wrtc`);

const Config = require(`./default`);
const ChannelPair = require(`./channel-pair`);

class Session extends EventEmitter {
  // constructor(config, options = {}) {
  constructor(config) {
    super();
    this.state = `uninitialize`;
    this.interval = null;
    const defaultOption = {
      id: uuid ? uuid() : null,
      peerConnection: null,
      offer: null,
      answer: null,
      offerCandidate: [],
      answerCandidate: [],
      channel: null,
      metric: {
        createDate: new Date().toISOString(),
        failCount: 0,
        successCount: 0,
      },
      config: Config.session,
      publishList: [],
    };

    this.initParam(this, defaultOption);
    this.initParam(this.config, config);
    this.initCommandFunction();
    console.log(`session config`, JSON.stringify(this.config));
    this.abortcountdown = this.config.handshake.abortcountdown;
  }

  initParam(dest, src) {
    Object.entries(src).forEach(([key, value]) => {
      // eslint-disable-next-line no-param-reassign
      dest[key] = value;
    });
  }

  initHandshake() {
    this.interval = setInterval(
      () => this.doHandshake(),
      this.config.handshake.period
    );
  }

  doHandshake() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          if (
            this.channel.sender.readyState === `open` &&
            this.channel.receiver.readyState === `open`
          ) {
            this.handshake();
          } else {
            this.onHandshakeFail();
          }
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  handshake() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.onHandshakeFail();
        reject(new Error(`handshake timeout.`));
      }, this.config.handshake.abortcountdown);
      Promise.resolve()
        .then(() =>
          this.sendRequest({
            command: `ping`,
          })
        )
        .then((ret) => {
          clearTimeout(timeout);
          this.onHandshakeSuccess();
          resolve(ret);
        })
        .catch((err) => reject(err));
    });
  }

  onHandshakeSuccess() {
    this.abortcountdown = this.config.handshake.abortcountdown;
  }

  onHandshakeFail() {
    this.abortcountdown -= 1;
    if (this.abortcountdown <= 0) this.destroy();
  }

  createPeerConnection(
    peerConnectionConfig = this.config.peerConnectionConfig
  ) {
    console.log(`[${this.constructor.name}]`, `createPeerConnection() >> `);
    console.log(
      `[${this.constructor.name}]`,
      `peerConnectionConfig`,
      JSON.stringify(peerConnectionConfig, null, 2)
    );
    this.peerConnection = new RTCPeerConnection(peerConnectionConfig);
    this.peerConnection.onicecandidate = (e) => {
      if (e && e.type && e.candidate) {
        console.log(
          `[${this.constructor.name}]`,
          `session[${this.id}]`,
          `\n\t<type: ${e.type}>`,
          `\n\taddress: ${e.candidate.address}`,
          `\n\tport: ${e.candidate.port}`,
          `\n\tprotocol: ${e.candidate.protocol}`
        );

        const candidate = new RTCIceCandidate(e.candidate);
        this.offerCandidate.push(candidate);
      } else {
        console.log(`[${this.constructor.name}]`, this.id, e);
      }
    };
    return this.peerConnection;
  }

  createChannel(peerConnection = this.peerConnection) {
    console.log(`[${this.constructor.name}]`, `createChannel() >> `);
    this.channel = new ChannelPair(peerConnection);

    this.channel.on(`message`, this.onMessage.bind(this));
    this.on(`request`, this.onRequestMessage.bind(this))
    this.initHandshake();
  }

  onMessage(message) {
    console.log(`[${this.constructor.name}]`, `onMessage() >> `, message);
    try {
      const data = this.decodeMessage(message);
      if (data.type === `request`) this.emit(data.type, data);
      if (data.type === `reply`) this.emit(data.type, data);
      if (data.type === `message`) this.emit(data.type, data.message);
    } catch (err) {
      console.error(err);
    }
  }

  onRequestMessage(message) {
    const data = this.decodeMessage(message);
    console.log(`[${this.constructor.name}]`, `request message:`, data);
    this.onCommand(data);
  }

  onCommand(data) {
    console.log(`[${this.constructor.name}]`, `onCommand() >> `);
    if (Object.prototype.hasOwnProperty.call(this.cmdFunction, data.command))
      return this.cmdFunction[data.command](data);
    return this.sendReply(data.messageId, { command: `Invalid command` });
    // if (data.command === `ping`) {
    //   this.sendReply(data.messageId, { command: `pong` });
    // } else if (data.command === `subscribe-add`) {
    //   this.publishList.push(data.topic);
    //   this.sendReply(
    //     //
    //     data.messageId,
    //     {
    //       command: `subscribe-added`,
    //       topic: data.topic,
    //     }
    //   );
    // }
  }

  initCommandFunction() {
    this.cmdFunction = {
      ping: (data) => {
        this.sendReply(data.messageId, { command: `pong` });
      },
      "subscribe-add": (data) => {
        const index = this.publishList.indexOf(data.topic);
        if (index !== -1) {
          this.sendReply(data.messageId, { command: `subscribe-duplicate` });
        } else {
          this.publishList.push(data.topic);
          this.sendReply(
            //
            data.messageId,
            { command: `subscribe-added`, topic: data.topic }
          );
        }
      },
      "subscribe-remove": (data) => {
        const index = this.publishList.indexOf(data.topic);
        if (index !== -1) {
          this.publishList.splice(index, 1);
          this.sendReply(
            //
            data.messageId,
            { command: `subscribe-removed`, topic: data.topic }
          );
        } else {
          this.sendReply(data.messageId, { command: `subscribe-notfound` });
        }
      },
      "subscribe-remove-all": (data) => {
        this.publishList = [];
        this.sendReply(
          //
          data.messageId,
          { command: `all-subscribe-removed` }
        );
      },
    };
  }

  send(message, options = {}) {
    console.log(`[${this.constructor.name}]`, `send() >> `);
    const payload = {
      messageId: uuid(),
      layer: `session`,
      type: `message`,
      message: this.encodeMessage(message),
    };
    this.initParam(payload, options);
    this.sendRaw(JSON.stringify(payload));
  }

  publish(topic, message, options = {}) {
    this.publishList
      .map((t) => `^${t}$`)
      .forEach((re) => {
        if (topic.match(re)) this.sendPublish(topic, message, options);
      });
  }

  sendPublish(topic, message, options = {}) {
    const payload = {
      messageId: uuid(),
      layer: `session`,
      type: `message`,
      command: `publish`,
      topic,
      message: this.encodeMessage(message),
    };
    this.initParam(payload, options);
    this.sendRaw(JSON.stringify(payload));
  }

  sendRaw(message) {
    this.channel.send(message);
  }

  sendReply(messageId, options = {}) {
    const payload = {
      messageId,
      layer: `session`,
      type: `reply`,
    };
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initParam(payload, options))
        .then(() => this.sendRaw(JSON.stringify(payload)))
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }

  sendRequest(options = {}) {
    const payload = {
      messageId: uuid(),
      layer: `session`,
      type: `request`,
    };
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initParam(payload, options))
        .then(() => this.sendRaw(JSON.stringify(payload)))
        .then(() => this.waitForReply(payload.messageId))
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }

  waitForReply(messageId) {
    return new Promise((resolve, reject) => {
      let timeout = null;
      const onMessage = (message) => {
        const ret = this.decodeMessage(message);
        if (ret && ret.messageId === messageId) {
          clearTimeout(timeout);
          this.removeAllListeners(`reply`);
          if (messageId) resolve(ret);
        }
      };
      this.on(`reply`, onMessage.bind(this));
      timeout = setTimeout(
        //
        () => {
          this.removeAllListeners(`reply`);
          reject(new Error(`Call-respond timeout.`));
        },
        this.config.channel.callrespond.timeout
      );
    });
  }

  createOffer() {
    console.log(`[${this.constructor.name}]`, `createOffer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.peerConnection.createOffer())
        .then((offer) => {
          console.log(`[${this.constructor.name}]`, `offer`, offer);
          this.offer = offer;
          return this.peerConnection.setLocalDescription(offer);
        })
        .then(() => resolve(this.offer))
        .catch((err) => reject(err));
    });
  }

  getOffer() {
    console.log(`[${this.constructor.name}]`, `getOffer() >> `);
    return {
      type: this.offer.type,
      sdp: this.offer.sdp,
    };
  }

  getOfferCandidate() {
    console.log(`[${this.constructor.name}]`, `getOfferCandidate() >> `);
    return this.offerCandidate;
  }

  addAnswer(answer) {
    console.log(
      `[${this.constructor.name}]`,
      `addAnswer() >> `,
      JSON.stringify(answer)
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.peerConnection.setRemoteDescription(answer))
        .then(() => {
          this.answer = answer;
        })
        .then((ret) => resolve({ result: true && ret }))
        .catch((err) => reject(err));
    });
  }

  addAnswerCandidate(answerCandidate) {
    console.log(`[${this.constructor.name}]`, `addAnswerCandidate() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          const candidate = new RTCIceCandidate(answerCandidate);
          this.peerConnection.addIceCandidate(candidate);
          this.answerCandidate.push(answerCandidate);
        })
        .then(() => resolve({ result: true }))
        .catch((err) => reject(err));
    });
  }

  destroy() {
    if (this.interval) clearInterval(this.interval);

    if (this.channel.sender && this.channel.setupSenderListener(false))
      delete this.channel.sender;

    if (this.channel.receiver && this.channel.setupReceiverListener(false))
      delete this.channel.receiver;

    this.peerConnection.close();

    delete this.peerConnection;

    console.log(`[${this.constructor.name}]`, `[${this.id}]`, `destroy`);
    this.emit(`destroy`, this.id);
  }

  // Millicious
  decodeMessage(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return text;
    }
  }

  encodeMessage(arg) {
    return typeof arg === `object` ? JSON.stringify(arg) : arg;
  }
}

module.exports = Session;
