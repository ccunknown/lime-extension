/* eslint-disable no-undef */
export default class ExtensionRTCPeer {
  /*
    serviceConfig = {
      peerConnectionConfig: {},
      apiOptions: {
        endpoint: ``,
        headers: []
      }
    }
  */
  constructor(config) {
    if (config) this.init(config);
    this.session = null;
    this.subscribeList = [];
    this.senderReady = false;
    this.receiverReady = false;
  }

  init(config = this.config) {
    this.config = config;
    console.log(`rtcpeer conifg:`, this.config);
  }

  start() {
    return new Promise((resolve, reject) => {
      this.session = new ExtensionRTCSession(this.config);
      this.senderReady = false;
      this.receiverReady = false;
      Promise.resolve()
        .then(() => this.session.start())
        .then(() => this.setChannelMessageHander())
        .then(() => this.applySubscribeList())
        .then(() => resolve())
        .catch((err) => console.error(err));
    });
  }

  setChannelMessageHander(set = true) {
    console.log(`[${this.constructor.name}]`, `setChannelMessageHandler() >> `);
    this.session.addEventListener(`message`, this.onMessage);
  }

  applySubscribeList() {
    console.log(`applySubscribeList() >> `, this.subscribeList);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.subscribeList.reduce((prevProm, e) => {
            console.log(`add subscribe to topic:`, e.topic);
            return prevProm.then(() =>
              this.session.addSubscribe(e.topic, e.callback)
            );
          }, Promise.resolve())
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  addSubscribe(topic, callback) {
    if (
      this.session &&
      this.session.channel &&
      this.session.channel.sender.readyState === `open` &&
      this.session.channel.receiver.readyState === `open`
    ) {
      this.session.addSubscribe(topic, callback);
    } else {
      this.subscribeList.push({
        topic,
        callback,
      });
    }
  }

  onMessage(event) {}
}
