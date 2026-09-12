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
 * @fileoverview Tests for LazyCssLoaderService.
 */
// @ts-nocheck

import {RendererFactory2} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
  KNOWN_CSS,
  LazyCssLoaderService,
} from 'services/lazy-css-loader.service';

class MockRenderer {
  createElement(tag: string) {
    return document.createElement(tag);
  }
  appendChild(parent: HTMLElement, newChild: HTMLElement) {
    parent.appendChild(newChild);
  }
}

class MockRendererFactory {
  createRenderer() {
    return new MockRenderer();
  }
}

describe('LazyCssLoaderService', () => {
  let lazyCssLoaderService: LazyCssLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LazyCssLoaderService,
        {provide: RendererFactory2, useClass: MockRendererFactory},
      ],
    });
    lazyCssLoaderService = TestBed.inject(LazyCssLoaderService);
  });

  afterEach(() => {
    document.head
      .querySelectorAll('link[href*="third_party_static"]')
      .forEach((linkElement: {remove: () => void}) => {
        linkElement.remove();
      });
  });

  it('should load GUPPY css when not loaded', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');
    const result = lazyCssLoaderService.loadCss(KNOWN_CSS.GUPPY);

    expect(result).toBe(true);
    expect(lazyCssLoaderService.hasCssLoaded(KNOWN_CSS.GUPPY)).toBe(true);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(appendChildSpy.calls.mostRecent().args[0].getAttribute('href')).toBe(
      '/assets/third_party_static/guppy/guppy-default.min.css'
    );
    expect(appendChildSpy.calls.mostRecent().args[0].getAttribute('rel')).toBe(
      'stylesheet'
    );
  });

  it('should not reload GUPPY css if already loaded', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');
    lazyCssLoaderService.loadCss(KNOWN_CSS.GUPPY);

    const result = lazyCssLoaderService.loadCss(KNOWN_CSS.GUPPY);

    expect(result).toBe(false);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
  });

  it('should load CROPPER css when not loaded', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');
    const result = lazyCssLoaderService.loadCss(KNOWN_CSS.CROPPER);

    expect(result).toBe(true);
    expect(lazyCssLoaderService.hasCssLoaded(KNOWN_CSS.CROPPER)).toBe(true);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(appendChildSpy.calls.mostRecent().args[0].getAttribute('href')).toBe(
      '/assets/third_party_static/cropper/cropper.min.css'
    );
  });

  it('should not reload CROPPER css if already loaded', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');
    lazyCssLoaderService.loadCss(KNOWN_CSS.CROPPER);

    const result = lazyCssLoaderService.loadCss(KNOWN_CSS.CROPPER);

    expect(result).toBe(false);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
  });

  it('should load both CODEMIRROR and merge css when not loaded', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');
    const result = lazyCssLoaderService.loadCss(KNOWN_CSS.CODEMIRROR);

    expect(result).toBe(true);
    expect(lazyCssLoaderService.hasCssLoaded(KNOWN_CSS.CODEMIRROR)).toBe(true);
    expect(appendChildSpy).toHaveBeenCalledTimes(2);
    expect(appendChildSpy.calls.allArgs()[0][0].getAttribute('href')).toBe(
      '/assets/third_party_static/codemirror/codemirror.css'
    );
    expect(appendChildSpy.calls.allArgs()[1][0].getAttribute('href')).toBe(
      '/assets/third_party_static/codemirror/merge.css'
    );
  });

  it('should not reload CODEMIRROR css if already loaded', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');
    lazyCssLoaderService.loadCss(KNOWN_CSS.CODEMIRROR);

    const result = lazyCssLoaderService.loadCss(KNOWN_CSS.CODEMIRROR);

    expect(result).toBe(false);
    expect(appendChildSpy).toHaveBeenCalledTimes(2);
  });

  it('should append stylesheet links to the document head', () => {
    lazyCssLoaderService.loadCss(KNOWN_CSS.GUPPY);
    lazyCssLoaderService.loadCss(KNOWN_CSS.CROPPER);
    lazyCssLoaderService.loadCss(KNOWN_CSS.CODEMIRROR);

    const linkHrefs = Array.from(
      document.head.querySelectorAll('link[href*="third_party_static"]')
    ).map(linkElement => linkElement.getAttribute('href'));
    expect(linkHrefs).toEqual([
      '/assets/third_party_static/guppy/guppy-default.min.css',
      '/assets/third_party_static/cropper/cropper.min.css',
      '/assets/third_party_static/codemirror/codemirror.css',
      '/assets/third_party_static/codemirror/merge.css',
    ]);
  });

  it('should report css as not loaded before loadCss is called', () => {
    expect(lazyCssLoaderService.hasCssLoaded(KNOWN_CSS.GUPPY)).toBe(false);
    expect(lazyCssLoaderService.hasCssLoaded(KNOWN_CSS.CROPPER)).toBe(false);
    expect(lazyCssLoaderService.hasCssLoaded(KNOWN_CSS.CODEMIRROR)).toBe(false);
  });

  it('should return false for unknown css', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');
    const result = lazyCssLoaderService.loadCss(KNOWN_CSS.UNKNOWN);

    expect(result).toBe(false);
    expect(appendChildSpy).not.toHaveBeenCalled();
  });
});
