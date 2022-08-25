/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
export default class ExtensionRTCSession extends EventTarget {
  constructor(config, option = {}) {
    super();
    this.config = config;
    // this.apiEndpoint = apiEndpoint;
    const defaultOption = {
      sessionId: null,
      peerConnection: null,
      offer: null,
      answer: null,
      answerDescription: null,
      offerCandidate: [],
      answerCandidate: [],
      channel: null,
      metric: {
        createDate: (new Date()).toString()
      },
      subscribeList: []
    };
    this.initParam(this, defaultOption);
    this.initParam(this, option);

    this.init();
  }

  initParam(dest, src) {
    for(let i in src)
      dest[i] = src[i];
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    this.addEventListener(`request`, this.onRequestMessage.bind(this));
    // this.addEventListener(`subscribe`, this.onSubsribe.bind(this));
    this.addEventListener(`cmd-publish`, this.onPublishMessage.bind(this));
  }

  start() {
    return new Promise((resolve, reject) => {
      Promise.resolve()

      // Create peer connection.
      .then(() => this.createPeerConnection())

      // Create session.
      .then(() => this.createSession())
      .then((targetSessionId) => {
        this.sessionId = targetSessionId;
        console.log(`sessionId:`, this.sessionId);
      })

      // Create data channel.
      .then(() => this.createChannel())

      // Get offer.
      .then(() => this.getOffer(this.sessionId))
      .then((offer) => this.offer = offer)
      .then(() => this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.offer)))

      // Create answer.
      .then(() => this.peerConnection.createAnswer())
      .then((ansDesc) => {
        this.answerDescription = ansDesc;
        this.answer = {
          type: this.answerDescription.type,
          sdp: this.answerDescription.sdp
        };
        return this.peerConnection.setLocalDescription(this.answerDescription);
      })

      // Set answer to server.
      .then(() => this.addAnswer())

      // Get offer candidate.
      .then(() => this.getOfferCandidate())
      .then((ret) => this.offerCandidate = ret)
      .then(() => console.log(`[${this.constructor.name}]`, `offer candidate`, this.offerCandidate))
      .then(() => this.offerCandidate.forEach(e => {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(e));
      }))

      .then(() => this.waitChannelReady())

      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  waitChannelReady() {
    return new Promise((resolve, reject) => {
      let senderReady = false;
      let receiverReady = false;
      this.channel.addEventListener(
        `send-channel-open`, 
        () => (senderReady = true) && receiverReady && resolve(), 
        { once: true }
      );
      this.channel.addEventListener(
        `receive-channel-open`, 
        () => (receiverReady = true) && senderReady && resolve(), 
        { once: true }
      );
    });
  }

  createPeerConnection(peerConnectionConfig = this.config.peerConnectionConfig) {
    console.log(`[${this.constructor.name}]`, `createPeerConnection() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.peerConnection = new RTCPeerConnection(peerConnectionConfig);
        this.peerConnection.onicecandidate = (e) => {
          console.log(`[${this.constructor.name}]`, `answer candidate`, e.candidate);
          console.log(`[${this.constructor.name}]`, `sessionId`, this.sessionId);
          e.candidate && this.addAnswerCandidate(e.candidate.toJSON());
        };
      })
      .then(() => this.peerConnection)
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  createSession(config = this.config.apiOptions) {
    console.log(`[${this.constructor.name}]`, `createSession() >> `);
    return new Promise((resolve, reject) => {
      let url = `/${config.endpoint.split(`/`).filter(e => e.length).join(`/`)}/rtcpeer/session`;
      console.log(`url:`, `${url}`);
      Promise.resolve()
      .then(() => this.apiFetch({
        url: `/session`,
        method: `POST`
      }))

      .then((body) => {
        console.log(`body:`, body);
        return body.id;
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  createChannel() {
    console.log(`[${this.constructor.name}]`, `createChannel() >> `);
    this.channel = new ExtensionRTCChannelPair(this.peerConnection, this.config.channel);
    this.channel.addEventListener(`message`, this.onMessage.bind(this));
  }

  getOffer(sessionId = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `getOffer() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.apiFetch({
        url: `/session/${sessionId}/offer`,
        method: `GET`
      }))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  getOfferCandidate(sessionId = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `getOfferCandidate() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.apiFetch({
        url: `/session/${sessionId}/offer-candidate`,
        method: `GET`
      }))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  addAnswer(answer = this.answer, sessionId = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `addAnswer() >> `, answer);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.apiFetch({
        url: `/session/${sessionId}/answer`,
        method: `POST`,
        body: answer
      }))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  addAnswerCandidate(candidate = this.answerCandidate, sessionId = this.sessionId) {
    console.log(`[${this.constructor.name}]`, `addAnswerCandidate() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.apiFetch({
            url: `/session/${sessionId}/answer-candidate`,
            method: `POST`,
            body: candidate,
          })
        )
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }

  /*
    Session functions.
  */

  onMessage(event) {
    // console.log(`[${this.constructor.name}]`, `onMessage() >> `);
    const data = this.decodeMessage(event.detail);
    console.log(`[${this.constructor.name}]`, `onMessage() >> `, data);
    if ([`request`, `reply`].includes(data.type)) {
      this.dispatchEvent(new CustomEvent(data.type, { detail: data }));
    } else if (data.type === `message`) {
      if (data.command)
        this.dispatchEvent(
          new CustomEvent(`cmd-${data.command}`, { detail: data })
        );
      else
        this.dispatchEvent(
          new CustomEvent(data.type, { detail: data.message })
        );
    } else {
      this.dispatchEvent(new CustomEvent(data.type, { detail: data }));
    }
  }

  onRequestMessage(event) {
    // console.log(`[${this.constructor.name}]`, `onRequestMessage() >> `, event.detail);
    const data = this.decodeMessage(event.detail);
    if (data.command === `ping`) {
      this.sendReply(data.messageId, { command: `pong` });
    } else {
      console.log(data);
    }
  }

  onPublishMessage(event) {
    const data = this.decodeMessage(event.detail);
    console.log(
      `[${this.constructor.name}]`, 
      `onPublishMessage(${data.topic}) >> ${data.message}`
    );
    console.log(this.subscribeList);
    const elem = this.subscribeList.find((e) =>
      data.topic.match(`^${e.topic}$`)
    );
    return elem.callback(data.topic, this.decodeMessage(data.message));
  }

  send(message, options = {}) {
    console.log(`[${this.constructor.name}]`, `send() >> `);
    const payload = {
      messageId: this.uuid(),
      layer: `session`,
      type: `message`,
      message: this.encodeMessage(message),
    };
    this.initParam(payload, options);
    this.sendRaw(JSON.stringify(payload));
  }

  sendRaw(message) {
    this.channel.send(message);
  }

  addSubscribe(topic, callback) {
    console.log(`[${this.constructor.name}]`, `addSubscribe() >> `);
    const existTopic = this.subscribeList.find((t) => t === topic);
    if (existTopic) {
      existTopic.callback = callback;
      return Promise.resolve();
    }
    return this._addSubscribe(topic, callback);
  }

  _addSubscribe(topic, callback) {
    const payload = {
      command: `subscribe-add`,
      topic,
    };
    return new Promise((resolve, reject) => {
      Promise.resolve()
        // .then(() => this.initParam(payload, options))
        .then(() => this.sendRequest(payload))
        .then((ret) => {
          console.log(`subscribe:`, ret);
          if (ret && ret.command === `subscribe-added`) {
            this.subscribeList.push({
              topic: ret.topic,
              callback,
            });
          } else {
            throw new Error(`Add subscribe fail.`);
          }
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
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
      messageId: this.uuid(),
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
        console.log(`reply message:`, message);
        const ret = this.decodeMessage(message.detail);
        if (ret && ret.messageId === messageId) {
          clearTimeout(timeout);
          this.removeEventListener(`reply`, onMessage.bind(this));
          resolve(ret);
        }
      };
      this.addEventListener(`reply`, onMessage.bind(this));
      timeout = setTimeout(() => {
        this.removeEventListener(`reply`, onMessage.bind(this));
        reject(new Error(`Call-respond timeout.`));
      }, this.config.peerConnectionConfig.channel.callrespond.timeout);
    });
  }

  /*
    apiFetch(
      options = {
        url: ``,
        method: ``,
        headers: [],
        body: ``,
      }
    )
  */ 
  apiFetch(options) {
    console.log(`[${this.constructor.name}]`, `apiFetch:`, `[${options.method}]: ${options.url}`);
    options.body && console.log(`[${this.constructor.name}]`, `body:`, options.body);
    return new Promise((resolve, reject) => {
      options.url = this.pathJoin(this.config.apiOptions.endpoint, options.url);
      options.headers = this.config.apiOptions.headers;
      if(typeof options.body == `object`) {
        options.headers[`content-type`] = `application/json`;
        options.body = JSON.stringify(options.body);
      }
      Promise.resolve()
      .then(() => fetch(options.url, options))
      .then((res) => 
        (!res.ok)
        ? res.json()
          .then((body) => reject({
            status: res.status, 
            body: (body ? JSON.stringify(body) : undefined)
          }))
        : resolve(res.json())
      )
      .catch((err) => reject(err));
    });
  }

  // Millicious

  pathJoin(...args) {
    let arr = [];
    args.forEach(str => arr.push.apply(arr, str.split(`/`).filter(e => e.length)));
    return `/${arr.join(`/`)}`;
  }

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