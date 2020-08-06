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
 * @fileoverview Unit test for the Interaction attributes extractor service.
 */

import { TestBed } from '@angular/core/testing';

import { HtmlEscaperService } from 'services/html-escaper.service';
import { InteractionAttributesExtractorService } from
  'interactions/interaction-attributes-extractor.service';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

describe('Interaction attributes extractor service', () => {
  let iaes: InteractionAttributesExtractorService = null;
  let hes: HtmlEscaperService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InteractionAttributesExtractorService, HtmlEscaperService]
    });

    iaes = TestBed.get(InteractionAttributesExtractorService);
    hes = TestBed.get(HtmlEscaperService);
  });

  it('properly extract customization arguments values from attributes', () => {
    const placeholderWithValue = hes.objToEscapedJson({
      content_id: 'ca_placeholder_0',
      unicode_str: 'Enter here.'
    });
    const rowsWithValue = hes.objToEscapedJson(2);
    const attributes = { placeholderWithValue, rowsWithValue };

    const caValues = iaes.getValuesFromAttributes('TextInput', attributes);
    expect(caValues).toEqual({
      placeholder: new SubtitledUnicode('Enter here.', 'ca_placeholder_0'),
      rows: 2
    });
  });
});
