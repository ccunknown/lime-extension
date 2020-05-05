'use strict'

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

class vthingService extends EventEmitter {
	constructor(extension, config) {
		console.log(`vthingService: contructor() >> `);
		super(extension.addonManager, extension.manifest.id);

		this.extension = extension;
		this.manifest = extension.manifest;
		this.addonManager = extension.addonManager;

		this.init();
	}

	init() {
		console.log(`vthingService: init() >> `);
	}

	start() {
		console.log(`vthingService: start() >> `);
		return Promise.resolve();
	}

	stop() {
		console.log(`vthingService: stop() >> `);
	}
}

module.exports = vthingService;