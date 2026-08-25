// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the error page.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'error-page',
  templateUrl: './error-page.component.html',
  styleUrls: [],
})
export class ErrorPageComponent implements OnInit, AfterViewInit {
  // This property is initialized using Angular lifecycle hooks.
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() statusCode!: string;

  customErrorMessage: string | null = null;
  private usingKeyboard = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  async ngOnInit(): Promise<void> {
    // Get custom error message from sessionStorage.
    // Auth guards store it there since location.replaceState clears router state.
    const storedErrorMessage =
      this.windowRef.nativeWindow.sessionStorage.getItem(
        'oppia_401_error_message'
      );
    if (storedErrorMessage) {
      this.customErrorMessage = storedErrorMessage;
      // Clear it immediately after reading so it doesn't persist across page reloads.
      this.windowRef.nativeWindow.sessionStorage.removeItem(
        'oppia_401_error_message'
      );
    }
  }

  private attachFocusListeners(links: NodeListOf<HTMLElement>): void {
    this.renderer.listen('window', 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.usingKeyboard = true;
      }
    });
    this.renderer.listen('window', 'mousedown', () => {
      this.usingKeyboard = false;
    });

    links.forEach(link => {
      this.renderer.listen(link, 'focus', () => {
        if (this.usingKeyboard) {
          this.renderer.setStyle(link, 'outline', '2px solid #0844aa');
          this.renderer.setStyle(link, 'outline-offset', '2px');
        }
      });
      this.renderer.listen(link, 'blur', () => {
        this.renderer.removeStyle(link, 'outline');
        this.renderer.removeStyle(link, 'outline-offset');
      });
    });
  }

  ngAfterViewInit(): void {
    const container: HTMLElement | null =
      this.elementRef.nativeElement.querySelector('.oppia-wide-panel-content');

    if (!container) {
      return;
    }

    const existingLinks: NodeListOf<HTMLElement> =
      container.querySelectorAll('a');

    if (existingLinks.length > 0) {
      this.attachFocusListeners(existingLinks);
    } else {
      // The links are injected asynchronously via [innerHTML] once the
      // translation resolves, so we observe the DOM until they appear.
      const observer = new MutationObserver(() => {
        const links: NodeListOf<HTMLElement> = container.querySelectorAll('a');
        if (links.length > 0) {
          this.attachFocusListeners(links);
          observer.disconnect();
        }
      });
      observer.observe(container, {childList: true, subtree: true});
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getStatusCode(): number {
    return Number(this.statusCode);
  }
}
