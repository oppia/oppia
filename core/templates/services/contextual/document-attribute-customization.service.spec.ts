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
 * @fileoverview Unit tests for DocumentAttributeCustomizationService.
 */
import { TestBed } from '@angular/core/testing';

import { DocumentAttributeCustomizationService } from
  'services/contextual/document-attribute-customization.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Document Attribute Customization Service', () => {
  let dacs: DocumentAttributeCustomizationService;
  let wrs: WindowRef;

  beforeEach(() => {
    dacs = TestBed.inject(DocumentAttributeCustomizationService);
    wrs = TestBed.inject(WindowRef);
  });

  it('should add a atribute', () => {
    const setAttributeSpy = spyOn(
      wrs.nativeWindow.document.documentElement, 'setAttribute').and.stub();
    dacs.addAttribute('class', 'oppia-base-container');

    expect(setAttributeSpy).toHaveBeenCalled();
  });
});
