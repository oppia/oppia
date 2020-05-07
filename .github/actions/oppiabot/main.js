const core = require('@actions/core');
const {context} = require('@actions/github');
const dispatcher = require('./src/dispatcher');

core.info(`About to dispatch:${context.eventName} and ${context.payload.action}.`);
dispatcher.dispatch(context.eventName, context.payload.action);
