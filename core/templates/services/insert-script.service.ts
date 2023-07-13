import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export enum KNOWN_SCRIPTS {
  DONORBOX = 'DONORBOX',
}

@Injectable({
  providedIn: 'root'
})
export class InsertScriptService {
  private loaded_scripts: Set<string> = new Set<string>();
  private renderer: Renderer2;

  constructor(
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  loadScript(script: KNOWN_SCRIPTS): void {
    if (this.loaded_scripts.has(script)) {
      return;
    }
    const scriptElement = document.createElement('script');
    switch (script) {
      case KNOWN_SCRIPTS.DONORBOX:
        scriptElement.src = 'https://donorbox.org/widget.js';
        scriptElement.setAttribute('paypalExpress', 'false');
        scriptElement.async = true;
        this.renderer.appendChild(document.body, scriptElement);
        this.loaded_scripts.add(script);
        break;
      default: {
        break;
      }
    }
  }
}

angular.module('oppia').factory(
  'InsertScriptService', downgradeInjectable(InsertScriptService));
