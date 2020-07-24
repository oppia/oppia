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
 * @fileoverview Unit tests for interaction customization arg object factory.
 */

import { TestBed } from '@angular/core/testing';

import {
  InteractionCustomizationArgObjectFactory, InteractionCustomizationArg
} from 'domain/exploration/interaction-customization-arg-object.factory';
import { SubtitledHtml } from 'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

describe('Interaction customization arg object factory', () => {
  let icaof: InteractionCustomizationArgObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InteractionCustomizationArgObjectFactory]
    });

    icaof = TestBed.get(InteractionCustomizationArgObjectFactory);
  });

  it('should create a InteractionCustomizationArg from dict and convert ' +
     'to backend dict', () => {
    const caBackendDict = {
      value: [
        {html: '<p>Choice 1</p>', content_id: 'ca_choices_0'},
        {html: '<p>Choice 2</p>', content_id: 'ca_choices_1'}
      ]
    };

    const ca = icaof.createFromBackendDict(
      caBackendDict,
      {
        items: {
          type: 'SubtitledHtml'
        },
        type: 'list',
      }
    );

    expect(ca).toEqual(new InteractionCustomizationArg([
      new SubtitledHtml('<p>Choice 1</p>', 'ca_choices_0'),
      new SubtitledHtml('<p>Choice 2</p>', 'ca_choices_1'),
    ]));

    expect(ca.toBackendDict()).toEqual(caBackendDict);
  });

  it('should create a InteractionCustomizationArg from dict and convert ' +
     'to backend dict for complex nested customization arguments', () => {
    const caBackendDict = {
      value: [{
        content: {
          unicode_str: 'first',
          content_id: 'ca_dummyCustArg_content_0'
        },
        show: true
      },
      {
        content: {
          unicode_str: 'second',
          content_id: 'ca_dummyCustArg_content_1'
        },
        show: true
      }]
    };

    const ca = icaof.createFromBackendDict(
      caBackendDict,
      {
        type: 'list',
        items: {
          type: 'dict',
          properties: [{
            name: 'content',
            schema: {
              type: 'SubtitledUnicode'
            }
          }, {
            name: 'show',
            schema: {
              type: 'bool'
            }
          }]
        }
      }
    );

    expect(ca).toEqual(new InteractionCustomizationArg([{
      content: new SubtitledUnicode('first', 'ca_dummyCustArg_content_0'),
      show: true
    }, {
      content: new SubtitledUnicode('second', 'ca_dummyCustArg_content_1'),
      show: true
    }]));

    expect(ca.toBackendDict()).toEqual(caBackendDict);
  });

  it('should create a InteractionCustomizationArg from dict and get ' +
     'all content ids for complex nested customization arguments', () => {
    const caBackendDict = {
      value: [{
        content: {
          unicode_str: 'first',
          content_id: 'ca_dummyCustArg_content_0'
        },
        show: true
      },
      {
        content: {
          unicode_str: 'second',
          content_id: 'ca_dummyCustArg_content_1'
        },
        show: true
      }]
    };

    const ca = icaof.createFromBackendDict(
      caBackendDict,
      {
        type: 'list',
        items: {
          type: 'dict',
          properties: [{
            name: 'content',
            schema: {
              type: 'SubtitledUnicode'
            }
          }, {
            name: 'show',
            schema: {
              type: 'bool'
            }
          }]
        }
      }
    );

    expect(ca.getContentIds()).toEqual([
      'ca_dummyCustArg_content_0', 'ca_dummyCustArg_content_1'
    ]);
  });
});
