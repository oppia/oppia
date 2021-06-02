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
 * @fileoverview Unit tests for the teach page.
 */

 import { NO_ERRORS_SCHEMA, Pipe, EventEmitter } from '@angular/core';
 import { ComponentFixture, TestBed } from
   '@angular/core/testing';
 
 import { LicensePageComponent } from './license-page.component';
 import { UrlInterpolationService } from
   'domain/utilities/url-interpolation.service';
 import { WindowRef } from 'services/contextual/window-ref.service';
 import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
 import { SiteAnalyticsService } from 'services/site-analytics.service';
 import { TranslateService } from 'services/translate.service';
 
 @Pipe({name: 'translate'})
 class MockTranslatePipe {
   transform(value: string, params: Object | undefined): string {
     return value;
   }
 }
 
 class MockTranslateService {
   languageCode = 'es';
   use(newLanguageCode: string): string {
     this.languageCode = newLanguageCode;
     return this.languageCode;
   }
 }
 
 class MockI18nLanguageCodeService {
   codeChangeEventEmiiter = new EventEmitter<string>();
   getCurrentI18nLanguageCode() {
     return 'en';
   }
 
   get onI18nLanguageCodeChange() {
     return this.codeChangeEventEmiiter;
   }
 }
 
 class MockSiteAnalyticsService {
   registerApplyToTeachWithOppiaEvent(): void {
     return;
   }
 }
 
 let component: LicensePageComponent;
 let fixture: ComponentFixture<LicensePageComponent>;
 
 describe('License Page', () => {
   let siteAnalyticsService = null;
 
   beforeEach(() => {
     TestBed.configureTestingModule({
       declarations: [LicensePageComponent, MockTranslatePipe],
       providers: [
         {
           provide: I18nLanguageCodeService,
           useClass: MockI18nLanguageCodeService
         },
         {
           provide: SiteAnalyticsService,
           useClass: MockSiteAnalyticsService
         },
         {
           provide: TranslateService,
           useClass: MockTranslateService
         },
       ],
       schemas: [NO_ERRORS_SCHEMA]
     }).compileComponents();
     siteAnalyticsService = TestBed.get(SiteAnalyticsService);
   });
 
   beforeEach(() => {
     fixture = TestBed.createComponent(LicensePageComponent);
     component = fixture.componentInstance;
     fixture.detectChanges();
   });
 });
 