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
 * @fileoverview Service to lazily load third-party CSS files.
 */

import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

export enum KNOWN_CSS {
  GUPPY = 'GUPPY',
  CROPPER = 'CROPPER',
  CODEMIRROR = 'CODEMIRROR',
  UNKNOWN = 'UNKNOWN',
}

@Injectable({
  providedIn: 'root',
})
export class LazyCssLoaderService {
  // Set of CSS files that have already been loaded.
  private fullyLoadedCss: Set<string> = new Set<string>();
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  hasCssLoaded(css: KNOWN_CSS): boolean {
    return this.fullyLoadedCss.has(css);
  }

  loadCss(css: KNOWN_CSS): boolean {
    // If the css is already loaded, it does not load again.
    if (this.hasCssLoaded(css)) {
      return false;
    }

    // The CodeMirror merge view add-on depends on the base CodeMirror
    // stylesheet, so both are loaded together to keep the view intact.
    let cssHrefs: string[] = [];
    switch (css) {
      case KNOWN_CSS.GUPPY:
        cssHrefs = ['/assets/third_party_static/guppy/guppy-default.min.css'];
        break;
      case KNOWN_CSS.CROPPER:
        cssHrefs = ['/assets/third_party_static/cropper/cropper.min.css'];
        break;
      case KNOWN_CSS.CODEMIRROR:
        cssHrefs = [
          '/assets/third_party_static/codemirror/codemirror.css',
          '/assets/third_party_static/codemirror/merge.css',
        ];
        break;
      default:
        return false;
    }

    cssHrefs.forEach((cssHref: string) => {
      const linkElement = this.renderer.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = cssHref;
      this.renderer.appendChild(document.head, linkElement);
    });

    this.fullyLoadedCss.add(css);
    return true;
  }
}
