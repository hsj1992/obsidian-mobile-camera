const { default: BaseEnvironment } = require('@jest/environment-jsdom-abstract');
const jsdom = require('jsdom');

// Jest's supported composition API lets us use a maintained jsdom version.
module.exports = class BrowserEnvironment extends BaseEnvironment {
	constructor(config, context) {
		super(config, context, jsdom);
	}
};
