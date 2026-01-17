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
  private fullyLoadedScripts: Set<string> = new Set<string>();
  private partiallyLoadedScripts: Map<string, Promise<void>> = new Map();
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  hasScriptLoaded(script: KNOWN_SCRIPTS): boolean {
    return this.fullyLoadedScripts.has(script);
  }

  loadScript(script: KNOWN_SCRIPTS, onLoadCb?: () => void): boolean {
    if (this.hasScriptLoaded(script)) {
      Promise.resolve().then(onLoadCb);
      return false;
    }

    if (this.partiallyLoadedScripts.has(script)) {
      this.partiallyLoadedScripts.get(script)?.then(onLoadCb, () => {
        console.error('Script loading failed:', script);
      });
      return false;
    }

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

    return true;
  }
}
