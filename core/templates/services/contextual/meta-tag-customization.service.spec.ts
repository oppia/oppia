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
 * @fileoverview Unit tests for MetaTagCustomizationService.
 */

import { TestBed } from '@angular/core/testing';
import { MetaTagCustomizationService } from
  'services/contextual/meta-tag-customization.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Meta Tag Customization Service', () => {
  let mtcs: MetaTagCustomizationService;
  let wrs: WindowRef;

  beforeEach(() => {
    mtcs = TestBed.inject(MetaTagCustomizationService);
    wrs = TestBed.inject(WindowRef);
  });

  it('should replace a meta tag in the html head', () => {
    const metaTags = [
      {
        propertyType: 'name',
        propertyValue: 'application-name',
        content: 'Oppia.org'
      }
    ];

    let removeSpy = jasmine.createSpy();

    spyOn(wrs.nativeWindow.document, 'querySelector').and.returnValue({
      remove: () => {
        removeSpy();
      }
    } as Element);

    const appendChildSpy = spyOn(
      wrs.nativeWindow.document.head, 'appendChild').and.callThrough();
    mtcs.addOrReplaceMetaTags(metaTags);

    const meta = wrs.nativeWindow.document.createElement('meta');
    meta.setAttribute('name', 'application-name');
    meta.setAttribute('content', 'Oppia.org');

    expect(removeSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalledWith(meta);
  });
});
