// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for partnerships page.
 */

import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { PartnershipsPageComponent } from './partnerships-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { PageTitleService } from 'services/page-title.service';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Partnerships page', () => {
  let translateService: TranslateService;
  let pageTitleService: PageTitleService;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [PartnershipsPageComponent],
      providers: [
        UrlInterpolationService,
        PageTitleService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  let component: PartnershipsPageComponent;

  beforeEach(() => {
    const partnershipsPageComponent = TestBed.createComponent(
      PartnershipsPageComponent);
    component = partnershipsPageComponent.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should set component properties when ngOnInit() is called', () => {
    spyOn(translateService.onLangChange, 'subscribe');
    component.ngOnInit();

    expect(component.partnershipsImgUrl).toBe(
      '/assets/images/general/partnerships_hero_image.png');
    expect(component.formIconUrl).toBe('/assets/images/icons/icon_form.png');
    expect(component.callIconUrl).toBe('/assets/images/icons/icon_call.png');
    expect(component.changeIconUrl).toBe(
      '/assets/images/icons/icon_change.png');
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  });

  it('should obtain translated page title whenever the selected' +
  'language changes', () => {
    component.ngOnInit();
    spyOn(component, 'setPageTitle');
    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_PARTNERSHIPS_PAGE_TITLE');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_PARTNERSHIPS_PAGE_TITLE');
  });

  it('should unsubscribe on component destruction', () => {
    component.directiveSubscriptions.add(
      translateService.onLangChange.subscribe(() => {
        component.setPageTitle();
      })
    );
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });
});
