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
  TranslatableTexts,
  TranslatableTextsBackendDict
} from
  'domain/opportunity/translatable-texts.model';
import { TranslatableItem } from './translatable-content.model';

describe('Translatable Texts model', () => {
  let sampleTranslatableTexts: TranslatableTexts;
  const getTranslatableItem = (text: string) => {
    return {
      content_format: 'html',
      content_value: text,
      content_type: 'content',
      interaction_id: null,
      rule_type: null
    };
  };

  beforeEach(() => {
    const sampleBackendDict: TranslatableTextsBackendDict = {
      state_names_to_content_id_mapping: {
        state1: {
          1: getTranslatableItem('text1'),
          2: getTranslatableItem('text2')
        },
        state2: {
          1: getTranslatableItem('text3')
        }
      },
      version: '1'
    };
    sampleTranslatableTexts = TranslatableTexts
      .createFromBackendDict(sampleBackendDict);
  });

  it('should get state name to content id mapping', () => {
    const expectedStatewiseContents = {
      state1: {
        1: new TranslatableItem('text1', 'html', 'content', null, null),
        2: new TranslatableItem('text2', 'html', 'content', null, null)
      },
      state2: {
        1: new TranslatableItem('text3', 'html', 'content', null, null)
      }
    };
    expect(sampleTranslatableTexts.stateWiseContents)
      .toEqual(expectedStatewiseContents);
  });

  it('should get version number', () => {
    expect(sampleTranslatableTexts.explorationVersion).toBe('1');
  });
});
