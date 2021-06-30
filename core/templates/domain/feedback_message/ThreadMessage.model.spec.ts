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
 * @fileoverview Unit tests for ThreadMessageModel.
 */


import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';

describe('ThreadMessageModel', () => {
  describe('.createFromBackendDict', () => {
    it('should create a new thread message from a backend dict.', () => {
      let threadMessage = ThreadMessage.createFromBackendDict({
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        text: 'message content',
        updated_status: null,
        updated_subject: null
      });

      expect(threadMessage.authorUsername).toEqual('author');
      expect(threadMessage.createdOnMsecs).toEqual(1000);
      expect(threadMessage.entityType).toEqual('exploration');
      expect(threadMessage.entityId).toEqual('exploration.exp1.thread1');
      expect(threadMessage.messageId).toEqual(1);
      expect(threadMessage.text).toEqual('message content');
      expect(threadMessage.summary.authorUsername).toEqual('author');
      expect(threadMessage.summary.text).toEqual('message content');
      expect(threadMessage.updatedStatus).toBe(null);
      expect(threadMessage.updatedSubject).toBe(null);
    });
  });

  describe('.hasSubjectUpdate', () => {
    it('should be true when updatedSubject is non-null', () => {
      let threadMessage = ThreadMessage.createFromBackendDict({
        updated_subject: 'a new descriptive subject!',
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        text: '',
        updated_status: null
      });

      expect(threadMessage.hasSubjectUpdate()).toBe(true);
    });

    it('should be false when updatedSubject is null', () => {
      let threadMessage = ThreadMessage.createFromBackendDict({
        updated_subject: null,
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        text: '',
        updated_status: null
      });

      expect(threadMessage.hasSubjectUpdate()).toBe(false);
    });
  });

  describe('.hasStatusUpdate', () => {
    it('should be true when updatedStatus is non-null', () => {
      let threadMessage = ThreadMessage.createFromBackendDict({
        updated_status: 'open',
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        text: '',
        updated_subject: null
      });

      expect(threadMessage.hasStatusUpdate()).toBe(true);
    });

    it('should be false when updatedStatus is null', () => {
      let threadMessage = ThreadMessage.createFromBackendDict({
        updated_status: null,
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        text: '',
        updated_subject: null
      });

      expect(threadMessage.hasStatusUpdate()).toBe(false);
    });
  });

  describe('.hasText', () => {
    it('should be true when text is nonempty string', () => {
      let threadMessage = ThreadMessage.createFromBackendDict({
        text: 'nonempty!',
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        updated_status: null,
        updated_subject: null
      });

      expect(threadMessage.hasText()).toBe(true);
    });

    it('should be false when text is empty string', () => {
      let threadMessage = ThreadMessage.createFromBackendDict({
        text: '',
        author_username: 'author',
        created_on_msecs: 1000,
        entity_type: 'exploration',
        entity_id: 'exploration.exp1.thread1',
        message_id: 1,
        updated_status: null,
        updated_subject: null
      });

      expect(threadMessage.hasText()).toBe(false);
    });
  });
});
