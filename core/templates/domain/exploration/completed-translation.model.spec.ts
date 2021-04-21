// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CompletedTranslationModel.
 */

import { CompletedTranslation, CompletedTranslationBackendDict } from
'domain/exploration/completed-translation.model';

describe('Completed Translation model', () => {
  describe('CompletedTranslationModel', () => {
    let backendDict: CompletedTranslationBackendDict;

    beforeEach(() => {
      backendDict = {
        translation: 'translation',
        content: 'content',
        };
    });

    it('should return correct translation', () => {
      let completedTranslation = (
        CompletedTranslation.createFromBackendDict(backendDict));

      expect(completedTranslation.getTranslation()).toEqual(
        'translation');
    });

    it('should return correct content', () => {
      let completedTranslation = (
        CompletedTranslation.createFromBackendDict(backendDict));

      expect(completedTranslation.getContent()).toEqual(
        'content');
    });
  });
});
