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
 * @fileoverview Unit tests for ExtensionTagAssemblerService.
 */

import {TestBed} from '@angular/core/testing';
import {ExtensionTagAssemblerService} from './extension-tag-assembler.service';
import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

describe('Extension Tag Assembler Service', () => {
  let etas: ExtensionTagAssemblerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe],
    });
    etas = TestBed.inject(ExtensionTagAssemblerService);
  });

  it('should not format element without customization', () => {
    const element = document.createElement('p');
    const interactionCustomizationArgs = {};
    const expectedElement = '<p></p>';

    expect(
      etas.formatCustomizationArgAttrs(element, interactionCustomizationArgs)
        .outerHTML
    ).toEqual(expectedElement);
  });

  it('should format element with customization', () => {
    const element = document.createElement('p');
    const interactionCustomizationArgs = {
      choices: {value: 'sampleChoice'},
    };
    const expectedElement =
      '<p ' + 'choices-with-value="&amp;quot;sampleChoice&amp;quot;"' + '></p>';

    expect(
      etas.formatCustomizationArgAttrs(element, interactionCustomizationArgs)
        .outerHTML
    ).toEqual(expectedElement);
  });

  it('should format element with complex customization', () => {
    const element = document.createElement('p');
    const interactionCustomizationArgs = {
      test: {
        value: {
          attr: [new SubtitledHtml('html', 'ca_id')],
        },
      },
    };
    const expectedElement =
      '<p test-with-value="{&amp;quot;attr&amp;quot;:' +
      '[{&amp;quot;html&amp;quot;:&amp;quot;html&amp;quot;,&amp;quot;' +
      'content_id&amp;quot;:&amp;quot;ca_id&amp;quot;}]}"></p>';

    expect(
      etas.formatCustomizationArgAttrs(element, interactionCustomizationArgs)
        .outerHTML
    ).toEqual(expectedElement);
  });

  it('should format element with multiple customizations', () => {
    const element = document.createElement('p');
    const interactionCustomizationArgs = {
      choices: {value: 'sampleChoice'},
      test: {value: 'sampleValue'},
    };
    const expectedElement =
      '<p ' +
      'choices-with-value="&amp;quot;sampleChoice&amp;quot;" ' +
      'test-with-value="&amp;quot;sampleValue&amp;quot;"' +
      '></p>';

    expect(
      etas.formatCustomizationArgAttrs(element, interactionCustomizationArgs)
        .outerHTML
    ).toEqual(expectedElement);
  });
});
