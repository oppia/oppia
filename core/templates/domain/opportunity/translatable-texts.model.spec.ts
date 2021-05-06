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
 * @fileoverview Tests for TranslatableTexts.
 */

import {
  StateNamesToContentIdMapping,
  TranslatableTexts,
  TranslatableTextsBackendDict
} from
  'domain/opportunity/translatable-texts.model';

describe('Translatable Texts model', () => {
  let sampleTranslatableTexts: TranslatableTexts;

  beforeEach(() => {
    const sampleBackendDict: TranslatableTextsBackendDict = {
      state_names_to_content_id_mapping: {
        state1: {
          1: 'text1',
          2: 'text2'
        },
        state2: {
          1: 'text3'
        }
      },
      version: '1'
    };
    sampleTranslatableTexts = TranslatableTexts
      .createFromBackendDict(sampleBackendDict);
  });

  it('should get state name to content id mapping', () => {
    const expectedStatewiseContents: StateNamesToContentIdMapping = {
      state1: {
        1: 'text1',
        2: 'text2'
      },
      state2: {
        1: 'text3'
      }
    };
    expect(sampleTranslatableTexts.stateWiseContents)
      .toEqual(expectedStatewiseContents);
  });

  it('should get version number', () => {
    expect(sampleTranslatableTexts.explorationVersion).toBe('1');
  });
});
