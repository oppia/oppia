// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to help inserting script element into html page.
 */

import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

export enum KNOWN_SCRIPTS {
  DONORBOX = 'DONORBOX',
  UNKNOWN = 'UNKNOWN',
  MATHJAX = 'MATHJAX',
  PENCILCODE = 'PENCILCODE',
}

@Injectable({
  providedIn: 'root',
})
export class InsertScriptService {
  // Set of scripts that have already loaded.
  private fullyLoadedScripts: Set<string> = new Set<string>();
  // Maps scripts that are currently still loading along with their on-load-callback promises.
  private partiallyLoadedScripts: Map<string, Promise<void>> = new Map();
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  hasScriptLoaded(script: KNOWN_SCRIPTS): boolean {
    return this.fullyLoadedScripts.has(script);
  }

  loadScript(script: KNOWN_SCRIPTS, onLoadCb?: () => void): boolean {
    // If the script is already loaded, it does not load again.
    if (this.hasScriptLoaded(script)) {
      Promise.resolve().then(onLoadCb);
      return false;
    }
    // The loading method continues only if the script is not in partiallyLoadedScripts.
    // This is to prevent the same script from creating multiple promises to load. This can
    // happen for both the MATHJAX and DONORBOX scripts.
    // The same script can create multiple promises as we call loadScript in the ngOnInit
    // function of the component needing the script. If on exploration editor, you open the
    // math expression editor, the MATHJAX script starts loading. If you close the editor
    // before it loads completely and reopen it again, another promise will be created
    // for the MATHJAX script due to loadScript being called by the ngOnInit function again.
    // Hence, we need the partiallyLoadedScripts Map and these checks to prevent this from
    // happening.
    if (!this.partiallyLoadedScripts.has(script)) {
      const scriptElement = this.renderer.createElement('script');

      switch (script) {
        case KNOWN_SCRIPTS.DONORBOX:
          scriptElement.src = 'https://donorbox.org/widget.js';
          scriptElement.setAttribute('paypalExpress', 'false');
          scriptElement.async = true;
          break;
        case KNOWN_SCRIPTS.MATHJAX:
          scriptElement.src =
            '/third_party/static/MathJax-2.7.5/MathJax.js?config=default';
          break;
        case KNOWN_SCRIPTS.PENCILCODE:
          scriptElement.src = 'https://pencilcode.net/lib/pencilcodeembed.js';
          break;
        default:
          return false;
      }
      const scriptLoadPromise = new Promise<void>((resolve, reject) => {
        scriptElement.onerror = (error: ErrorEvent) => {
          this.partiallyLoadedScripts.delete(script);
          reject(error);
        };

        scriptElement.onload = () => {
          this.fullyLoadedScripts.add(script);
          this.partiallyLoadedScripts.delete(script);
          resolve();
          if (onLoadCb) {
            onLoadCb();
          }
        };
      });

      this.partiallyLoadedScripts.set(script, scriptLoadPromise);
      this.renderer.appendChild(document.body, scriptElement);
    }

    this.partiallyLoadedScripts.get(script)?.then(onLoadCb, () => {
      console.error('Script loading failed:', script);
    });
    return true;
  }
}
