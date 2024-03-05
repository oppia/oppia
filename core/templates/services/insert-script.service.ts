import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export enum KNOWN_SCRIPTS {
  DONORBOX = 'DONORBOX',
  UNKNOWN = 'UNKNOWN',
  MATHJAX = 'MATHJAX',
}

@Injectable({
  providedIn: 'root'
})
export class InsertScriptService {
  private loadedScripts: Set<string> = new Set<string>();
  private scriptsLoading: Map<string, Promise<void>> = new Map();
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  loadScript(script: KNOWN_SCRIPTS, onLoadCb?: () => void): boolean {
    if (this.loadedScripts.has(script)) {
      setTimeout(onLoadCb, 0); // Execute callback asynchronously if script is already loaded
      return false;
    }

    if (!this.scriptsLoading.has(script)) {
      const scriptElement = this.renderer.createElement('script');
      const scriptLoadPromise = new Promise<void>((resolve, reject) => {
        scriptElement.onload = () => {
          this.loadedScripts.add(script);
          this.scriptsLoading.delete(script);
          resolve();
          if (onLoadCb) onLoadCb();
        };
        scriptElement.onerror = (error) => {
          this.scriptsLoading.delete(script);
          reject(error);
        };
        // Set script src based on the case
        switch (script) {
          case KNOWN_SCRIPTS.DONORBOX:
            scriptElement.src = 'https://donorbox.org/widget.js';
            scriptElement.setAttribute('paypalExpress', 'false');
            scriptElement.async = true;
            break;
          case KNOWN_SCRIPTS.MATHJAX:
            scriptElement.src = '/third_party/static/MathJax-2.7.5/MathJax.js?config=default';
            break;
          default:
            return false;
        }
        this.renderer.appendChild(document.body, scriptElement);
      });

      this.scriptsLoading.set(script, scriptLoadPromise);
    }

    this.scriptsLoading.get(script).then(onLoadCb, () => {
      console.error('Script loading failed:', script);
    });

    return true;
  }
}

angular.module('oppia').factory(
  'InsertScriptService', downgradeInjectable(InsertScriptService));
