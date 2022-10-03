const Service = require(`../service-template/service`);
const Session = require(`./session`);

class rtcpeerService extends Service {
  constructor(extension, config, id) {
    super(extension, config, id);
    console.log(`[${this.constructor.name}]`, `constructor() >> `);

    // this.extension = extension;
    // this.manifest = extension.manifest;
    // this.addonManager = extension.addonManager;
    // this.configManager = this.extension.configManager;
    // this.routesManager = this.extension.routesManager;
    // this.laborsManager = this.extension.laborsManager;

    // this.config = config.rtcpeer;
    this.config = this.config[`service-config`][`rtcpeer-service`];

    this.sessions = [];

    console.log(`rtcpeer config`, JSON.stringify(this.config));

    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    // this.initConfigHandler();
  }

  // initConfigHandler() {
  //   console.log(`[${this.constructor.name}]`, `initConfigHandler() >> `);
  //   this.configManager.on(`CONFIG_SAVE`, (config) => this.config = config.rtcpeer);
  // }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
  }

  shout(message) {
    const msg = message.type === `string` ? message : JSON.stringify(message);
    this.sessions.forEach((session) => {
      if (
        session.channel &&
        session.channel.sender &&
        session.channel.sender.readyState === `open`
      ) {
        // console.log(`[${this.constructor.name}]`, `message >> `, message);
        this.send(session, msg);
      }
    });
  }

  publish(topic, message) {
    this.sessions.forEach((session) => session.publish(topic, message));
  }

  // publish(topic, message) {
  //   // console.log(
  //   //   `[${this.constructor.name}]`,
  //   //   `publish(${topic}) >> ${message}`
  //   // );
  //   this.sessions.forEach((session) => {
  //     // console.log(`[${session.id}]`, session.publishList);
  //     if (
  //       session.publishList.map((re) => `^${re}$`).find((re) => topic.match(re))
  //     ) {
  //       // console.log(
  //       //   `[${this.constructor.name}]`,
  //       //   `[${session.id}]`,
  //       //   `publish(${topic}) >> ${message}`
  //       // );
  //       session.sendPublish(topic, message);
  //       // console.log(`publish condition >> true`);
  //     } else {
  //       // console.log(`publish condition >> false`);
  //     }
  //   });
  // }

  send(session, message) {
    const ss = typeof session === `string` ? this.getSession(session) : session;
    ss.send(message);
  }

  // createSession(iceConfig = this.config.server.config.ice) {
  createSession(config = this.config) {
    console.log(`[${this.constructor.name}]`, `createSession() >> `);
    return new Promise((resolve, reject) => {
      let session = null;
      Promise.resolve()
        .then(() => {
          session = new Session(config);
        })
        .then(() => session.createPeerConnection())
        .then(() => session.createChannel())
        .then(() => session.createOffer())
        .then(() => this.setSessionHandler(session))
        .then(() => this.sessions.push(session))
        .then(() => resolve(session))
        .catch((err) => reject(err));
    });
  }

  setSessionHandler(session) {
    let sessionEvent = {};
    sessionEvent = {
      destroy: (sessionId) => {
        Object.keys(sessionEvent).forEach((event) =>
          session.removeListener(event, sessionEvent[event])
        );
        this.sessions = this.sessions.filter((e) => e.id !== sessionId);
        console.log(
          `Sessions:`,
          JSON.stringify(
            this.sessions.map((e) => e.id),
            null,
            2
          )
        );
      },
    };
    Object.keys(sessionEvent).forEach((event) =>
      session.on(event, sessionEvent[event])
    );
  }

  getSession(id) {
    console.log(`[${this.constructor.name}]`, `getSession(${id || ``}) >> `);
    return this.sessions.find((e) => e.id === id);
  }

  deleteSession(session) {
    console.log(
      `[${this.constructor.name}]`,
      `deleteSession(${session ? session.id || session : ``}) >> `
    );
    session.destroy();
    this.sessions = this.sessions.filter((e) => e.id !== session.id);
  }

  getOffer(session) {
    console.log(
      `[${this.constructor.name}]`,
      `getOffer(${typeof session === `string` ? session : session.id}) >> `
    );
    const ss = typeof session === `object` ? session : this.getSession(session);
    return ss.getOffer();
  }

  getOfferCandidate(session) {
    console.log(
      `[${this.constructor.name}]`,
      `getOfferCandidate(${
        typeof session === `string` ? session : session.id
      }) >> `
    );
    const ss = typeof session === `object` ? session : this.getSession(session);
    return ss.getOfferCandidate();
  }

  addAnswer(session, answer) {
    console.log(
      `[${this.constructor.name}]`,
      `addAnswer(${typeof session === `string` ? session : session.id}) >> `
    );
    const ss = typeof session === `object` ? session : this.getSession(session);
    return ss.addAnswer(answer);
  }

  addAnswerCandidate(session, answerCandidate) {
    console.log(
      `[${this.constructor.name}]`,
      `addAnswerCandidate(${
        typeof session === `string` ? session : session.id
      }) >> `
    );
    console.log(`session id: `, session);
    console.log(`session type:`, typeof session);
    const ss = typeof session === `object` ? session : this.getSession(session);
    return ss.addAnswerCandidate(answerCandidate);
  }
}

module.exports = rtcpeerService;
