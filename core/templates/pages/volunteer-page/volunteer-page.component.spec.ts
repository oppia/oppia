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
 * @fileoverview Unit tests for volunteer page.
 */

import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

import { VolunteerPageComponent } from './volunteer-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { PageTitleService } from 'services/page-title.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Volunteer page', () => {
  let translateService: TranslateService;
  let pageTitleService: PageTitleService;
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [
        VolunteerPageComponent,
        MockTranslatePipe
      ],
      providers: [
        UrlInterpolationService,
        NgbCarouselConfig,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        },
        PageTitleService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  let component: VolunteerPageComponent;

  beforeEach(() => {
    const volunteerPageComponent = TestBed.createComponent(
      VolunteerPageComponent);
    component = volunteerPageComponent.componentInstance;
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should set component properties when ngOnInit() is called', () => {
    spyOn(translateService.onLangChange, 'subscribe');
    component.ngOnInit();

    expect(component.bannerImgPath).toBe(
      '/volunteer/banner.webp');
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/test')).toEqual('/assets/images/test');
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
      'I18N_VOLUNTEER_PAGE_TITLE');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_VOLUNTEER_PAGE_TITLE');
  });

  it('should get webp extended file name', () => {
    expect(component.getWebpExtendedName('a.jpg')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.png')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.webp')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.b.jpg')).toEqual('a.b.webp');
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
