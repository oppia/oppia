// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for ThreadMessageObjectFactory.
 */

import { ThreadMessageObjectFactory } from
  'domain/feedback_message/ThreadMessageObjectFactory';

describe('Feedback thread object factory', () => {
  let factory: ThreadMessageObjectFactory;

  beforeEach(() => {
    factory = new ThreadMessageObjectFactory();
  });

  describe('createFromBackendDict', () => {
    it('should create a new feedback thread from a backend dict.', () => {
      var threadMessage = factory.createFromBackendDict({
        author_username: 'author',
        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        text: 'message content',
        updated_status: null,
        updated_subject: null
      });

      expect(threadMessage.authorUsername).toEqual('author');
      expect(threadMessage.createdOn).toEqual(1000);
      expect(threadMessage.entityType).toEqual('exploration');
      expect(threadMessage.entityId).toEqual('exploration.exp1.thread1');
      expect(threadMessage.messageId).toEqual(1);
      expect(threadMessage.receivedViaEmail).toEqual(false);
      expect(threadMessage.text).toEqual('message content');
      expect(threadMessage.updatedStatus).toBe(null);
      expect(threadMessage.updatedSubject).toBe(null);
    });
  });

  describe('.getSummary', () => {
    it('should return the same author and text as message.', () => {
      var threadMessage = factory.createFromBackendDict({
        author_username: 'author',
        text: 'message content',

        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        updated_status: null,
        updated_subject: null
      });

      let summary = threadMessage.getSummary();
      expect(summary.authorUsername).toEqual('author');
      expect(summary.text).toEqual('message content');
    });
  });

  describe('.hasSubjectUpdate()', () => {
    it('is true when updatedStatus is non-null', () => {
      var threadMessage = factory.createFromBackendDict({
        updated_subject: 'a new descriptive subject!',

        author_username: 'author',
        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        text: '',
        updated_status: null
      });

      expect(threadMessage.hasSubjectUpdate()).toEqual(true);
    });

    it('is true when text is empty string', () => {
      var threadMessage = factory.createFromBackendDict({
        updated_subject: null,

        author_username: 'author',
        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        text: '',
        updated_status: null
      });

      expect(threadMessage.hasSubjectUpdate()).toEqual(false);
    });
  });

  describe('.hasStatusUpdate()', () => {
    it('is true when updatedStatus is non-null', () => {
      var threadMessage = factory.createFromBackendDict({
        updated_status: 'open',

        author_username: 'author',
        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        text: null,
        updated_subject: null
      });

      expect(threadMessage.hasStatusUpdate()).toEqual(true);
    });

    it('is true when text is empty string', () => {
      var threadMessage = factory.createFromBackendDict({
        updated_status: null,

        author_username: 'author',
        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        text: '',
        updated_subject: null
      });

      expect(threadMessage.hasStatusUpdate()).toEqual(false);
    });
  });

  describe('.isNotempty()', () => {
    it('is true when text is empty string', () => {
      var threadMessage = factory.createFromBackendDict({
        text: 'nonempty!',

        author_username: 'author',
        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        updated_status: null,
        updated_subject: null
      });

      expect(threadMessage.isNonempty()).toEqual(false);
    });

    it('is true when text is empty string', () => {
      var threadMessage = factory.createFromBackendDict({
        text: '',

        author_username: 'author',
        created_on: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        received_via_email: false,
        updated_status: null,
        updated_subject: null
      });

      expect(threadMessage.isNonempty()).toEqual(true);
    });
  });
});

