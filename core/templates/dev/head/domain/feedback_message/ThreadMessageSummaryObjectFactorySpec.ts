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
 * @fileoverview Unit tests for ThreadMessageSummaryObjectFactory.
 */

import { ThreadMessageSummaryObjectFactory } from
  'domain/feedback_message/ThreadMessageSummaryObjectFactory';

describe('Feedback thread object factory', () => {
  let factory: ThreadMessageSummaryObjectFactory;

  beforeEach(() => {
    factory = new ThreadMessageSummaryObjectFactory();
  });

  describe('createFromBackendDict', () => {
    it('should create a new feedback thread from a backend dict.', () => {
      var threadMessageSummary = factory.createFromBackendDict(
        { author_username: 'author', text: 'message content' });

      expect(threadMessageSummary.authorUsername).toEqual('author');
      expect(threadMessageSummary.text).toEqual('message content');
    });
  });

  describe('.isNotempty()', () => {
    it('is true when text is empty string', () => {
      var threadMessageSummary = factory.createFromBackendDict(
        { text: 'nonempty!', author_username: 'author' });

      expect(threadMessageSummary.isNonempty()).toEqual(false);
    });

    it('is true when text is empty string', () => {
      var threadMessageSummary = factory.createFromBackendDict(
        { text: '', author_username: 'author' });

      expect(threadMessageSummary.isNonempty()).toEqual(true);
    });
  });
});

