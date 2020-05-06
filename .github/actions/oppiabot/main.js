const {context} = require('@actions/github');
const dispatcher = require('./src/dispatcher');

dispatcher.dispatch(context.eventName, context.action);
