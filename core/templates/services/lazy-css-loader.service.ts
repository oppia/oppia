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
  SHEPHERD = 'SHEPHERD',
  UNKNOWN = 'UNKNOWN',
}

@Injectable({
  providedIn: 'root',
})
export class LazyCssLoaderService {
  // Set of CSS groups that have finished loading successfully.
  private fullyLoadedCss: Set<string> = new Set<string>();
  // Set of CSS groups whose stylesheet requests are still in flight. This is
  // kept separate from fullyLoadedCss so that a failed request can be retried
  // rather than being permanently deduplicated away.
  private cssGroupsCurrentlyLoading: Set<string> = new Set<string>();
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  hasCssLoaded(css: KNOWN_CSS): boolean {
    return (
      this.fullyLoadedCss.has(css) || this.cssGroupsCurrentlyLoading.has(css)
    );
  }

  loadCss(css: KNOWN_CSS): boolean {
    // If the css is already loaded or is being loaded, it does not load again.
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
      case KNOWN_CSS.SHEPHERD:
        cssHrefs = [
          '/assets/third_party_static/shepherd/shepherd.css',
          '/assets/third_party_static/shepherd/shepherd-overrides.css',
        ];
        break;
      default:
        return false;
    }

    this.cssGroupsCurrentlyLoading.add(css);
    let linksStillLoading = cssHrefs.length;
    let loadHasFailed = false;
    cssHrefs.forEach((cssHref: string) => {
      const linkElement = this.renderer.createElement('link');
      linkElement.rel = 'stylesheet';
      // The stylesheet is requested with media="print" so the browser fetches
      // it without blocking first paint, then gets applied to the screen once
      // it has loaded. This mirrors the async loading used for MathJax.
      linkElement.media = 'print';
      linkElement.onload = () => {
        linkElement.media = 'all';
        linksStillLoading -= 1;
        // The whole group is marked as loaded only once every stylesheet has
        // loaded, so that a partially loaded group can still be retried.
        if (!loadHasFailed && linksStillLoading === 0) {
          this.cssGroupsCurrentlyLoading.delete(css);
          this.fullyLoadedCss.add(css);
        }
      };
      linkElement.onerror = () => {
        // If any stylesheet in the group fails to load, clear the in-flight
        // marker so a later call can retry loading the entire group.
        loadHasFailed = true;
        this.cssGroupsCurrentlyLoading.delete(css);
      };
      linkElement.href = cssHref;
      this.renderer.appendChild(document.head, linkElement);
    });

    return true;
  }
}
