// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for favicon service.
 */

import { TestBed } from '@angular/core/testing';
import { WindowRef } from './contextual/window-ref.service';
import { FaviconService } from './favicon.service';

describe('Favicon service', () => {
  let faviconService: FaviconService;
  let windowRef: WindowRef;

  beforeEach(() => {
    faviconService = TestBed.inject(FaviconService);
    windowRef = TestBed.inject(WindowRef);
  });

  it('should set the favicon to the given url', () => {
    const faviconUrl = '/assets/images/logo/favicon.png';
    const linkElement: HTMLLinkElement = document.createElement('link');
    spyOn(
      windowRef.nativeWindow.document, 'querySelector'
    ).and.returnValue(linkElement);

    faviconService.setFavicon(faviconUrl);

    expect(linkElement.type).toEqual('image/x-icon');
    expect(linkElement.rel).toEqual('icon');
  });
});
