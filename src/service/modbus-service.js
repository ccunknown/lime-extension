'use strict'

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

class modbusService extends EventEmitter {
	constructor(extension, config) {
		console.log(`modbusService: contructor() >> `);
		super(extension.addonManager, extension.manifest.id);

		this.extension = extension;
		this.manifest = extension.manifest;
		this.addonManager = extension.addonManager;

		this.init();
	}

	init() {
		console.log(`modbusService: init() >> `);
	}

	start() {
		console.log(`modbusService: start() >> `);
		return Promise.resolve();
	}

	stop() {
		console.log(`modbusService: stop() >> `);
	}
}

module.exports = modbusService;