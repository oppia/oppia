/**
 * node-archiver
 *
 * Copyright (c) 2012-2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Queue = module.exports = function() {
  EventEmitter.call(this);

  this.closed = false;
  this.ended = false;
  this.waiting = false;

  this.entries = [];
};

inherits(Queue, EventEmitter);

Queue.prototype.add = function(obj) {
  if (this.closed) {
    this.emit('error', new Error('can\'t add queue entry after close'));
  } else {
    this.entries.push(obj);
    this.run();
  }
};

Queue.prototype.close = function() {
  this.closed = true;
  this.run();
};

Queue.prototype.next = function() {
  this.waiting = false;
  this.run();
};

Queue.prototype.run = function() {
  if (this.waiting || (this.closed && this.ended)) {
    return;
  }

  if (this.entries.length === 0) {
    if (this.closed) {
      this.emit('end');
      this.ended = true;
    }

    return;
  }

  this.waiting = true;
  this.emit('entry', this.entries.shift());
};