// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for GenerateContentIdService.
 */

import {ISODatePickerAdapter} from 'services/iso-datepicker-adapter.service';
import {TestBed} from '@angular/core/testing';

describe('ISODatePickerAdapter', () => {
  let cda: ISODatePickerAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      providers: [ISODatePickerAdapter],
    });
    cda = TestBed.inject(ISODatePickerAdapter);
  });

  it('should format date for input display', () => {
    const date = new Date('2024-03-16T00:00');
    const formattedDate = cda.format(date, 'input');
    expect(formattedDate).toBe('16-Mar-2024');
  });

  it('should return date as a string for other display formats', () => {
    const date = new Date('2024-03-16T00:00');
    const formattedDate = cda.format(date, 'otherFormat');
    expect(formattedDate).toBe(date.toDateString());
  });
});
