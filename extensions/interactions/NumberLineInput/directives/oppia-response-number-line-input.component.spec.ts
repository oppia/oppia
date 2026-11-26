// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for oppia response number line input.component.spec.
 */

import {HtmlEscaperService} from 'services/html-escaper.service';
import {ResponseNumberLineInput} from './oppia-response-number-line-input.component';

describe('ResponseNumberLineInput', () => {
  it('should display the selected value', () => {
    const escaper = jasmine.createSpyObj<HtmlEscaperService>(
      'HtmlEscaperService',
      ['escapedJsonToObj']
    );
    escaper.escapedJsonToObj.and.returnValue(0.25);
    const component = new ResponseNumberLineInput(escaper);
    component.answer = '0.25';
    component.ngOnInit();
    expect(component.displayAnswer).toBe(0.25);
  });
});
