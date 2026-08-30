// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for error 404 page.
 */
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

import {Error404PageComponent} from './error-404-page.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PageTitleService} from 'services/page-title.service';

describe('Error404PageComponent', () => {
  let component: Error404PageComponent;
  let fixture: ComponentFixture<Error404PageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [Error404PageComponent],
      providers: [UrlInterpolationService, PageTitleService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Error404PageComponent);
    component = fixture.componentInstance;
  });

  it('should get the static image url', () => {
    expect(component.getStaticImageUrl('/general/oops_mint.webp')).toBe(
      '/assets/images/general/oops_mint.webp'
    );
  });

  it('should update the page title when the language changes', () => {
    const translateService = TestBed.inject(TranslateService);
    const pageTitleService = TestBed.inject(PageTitleService);
    spyOn(pageTitleService, 'setDocumentTitle');

    component.ngOnInit();
    translateService.onLangChange.emit();

    expect(pageTitleService.setDocumentTitle).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    component.ngOnInit();
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  describe('focus indicator for links', () => {
    const getContainer = (): HTMLElement =>
      fixture.nativeElement.querySelector('.oppia-wide-panel-content');

    const createMockLink = (): HTMLAnchorElement => {
      const link = document.createElement('a');
      link.href = '/';
      link.textContent = 'home page';
      return link;
    };

    it('should attach focus and blur listeners to links that already exist', fakeAsync(() => {
      fixture.detectChanges();
      const container = getContainer();
      const link = createMockLink();
      container.appendChild(link);

      component.ngAfterViewInit();
      tick();

      const keydownEvent = new KeyboardEvent('keydown', {key: 'Tab'});
      window.dispatchEvent(keydownEvent);
      link.dispatchEvent(new Event('focus'));

      expect(link.style.outline).toBe('rgb(8, 68, 170) solid 2px');
      expect(link.style.outlineOffset).toBe('2px');
    }));

    it('should not show outline when focus is triggered by mouse', fakeAsync(() => {
      fixture.detectChanges();
      const container = getContainer();
      const link = createMockLink();
      container.appendChild(link);

      component.ngAfterViewInit();
      tick();

      const mousedownEvent = new MouseEvent('mousedown');
      window.dispatchEvent(mousedownEvent);
      link.dispatchEvent(new Event('focus'));

      expect(link.style.outline).toBe('');
    }));

    it('should remove outline styles on blur', fakeAsync(() => {
      fixture.detectChanges();
      const container = getContainer();
      const link = createMockLink();
      container.appendChild(link);

      component.ngAfterViewInit();
      tick();

      const keydownEvent = new KeyboardEvent('keydown', {key: 'Tab'});
      window.dispatchEvent(keydownEvent);
      link.dispatchEvent(new Event('focus'));
      expect(link.style.outline).toBe('rgb(8, 68, 170) solid 2px');

      link.dispatchEvent(new Event('blur'));
      expect(link.style.outline).toBe('');
      expect(link.style.outlineOffset).toBe('');
    }));

    it('should attach listeners to links injected later via MutationObserver', async () => {
      fixture.detectChanges();
      const container = getContainer();

      component.ngAfterViewInit();

      const link = createMockLink();
      container.appendChild(link);

      // Wait for the real MutationObserver callback to fire (runs as a
      // genuine browser microtask, which fakeAsync cannot reliably flush).
      await new Promise(resolve => setTimeout(resolve, 0));

      const keydownEvent = new KeyboardEvent('keydown', {key: 'Tab'});
      window.dispatchEvent(keydownEvent);
      link.dispatchEvent(new Event('focus'));

      expect(link.style.outline).toBe('rgb(8, 68, 170) solid 2px');
    });

    it('should do nothing if the container element is not found', fakeAsync(() => {
      fixture.detectChanges();
      const container = getContainer();
      container.remove();

      expect(() => {
        component.ngAfterViewInit();
        tick();
      }).not.toThrow();
    }));
  });
});