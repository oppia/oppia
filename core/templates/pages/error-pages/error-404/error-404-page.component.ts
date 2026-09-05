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
 * @fileoverview Component for the error 404 page.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PageTitleService} from 'services/page-title.service';
import './error-404-page.component.css';

@Component({
  selector: 'oppia-error-404-page',
  templateUrl: './error-404-page.component.html',
  styleUrls: ['./error-404-page.component.css'],
})
export class Error404PageComponent implements OnInit, OnDestroy, AfterViewInit {
  directiveSubscriptions = new Subscription();
  private usingKeyboard = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
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

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_ERROR_PAGE_TITLE_404'
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
