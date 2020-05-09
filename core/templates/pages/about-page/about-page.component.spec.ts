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
 * @fileoverview Unit tests for the about page.
 */

// import { async, ComponentFixture, TestBed } from '@angular/core/testing';
// import { AboutPageComponent } from './about-page.component';
// import { HttpLoaderFactory } from './about-page.module';
// import { TranslateModule, TranslateLoader, TranslateService } from
//   '@ngx-translate/core';

// import {HttpClient} from '@angular/common/http';
// import {HttpClientTestingModule, HttpTestingController} from
//   '@angular/common/http/testing';
// const TRANSLATIONS_EN = require('../../../../assets/i18n/en.json');
// const TRANSLATIONS_PT_BR = require('../../../../assets/i18n/pt-br.json');

// fdescribe('AboutPageComponent', () => {
//   let translate: TranslateService;
//   let http: HttpTestingController;

//   beforeEach(async(() => {
//     TestBed.configureTestingModule({
//       declarations: [
//         AboutPageComponent
//       ],
//       imports: [
//         HttpClientTestingModule,
//         TranslateModule.forRoot({
//           loader: {
//             provide: TranslateLoader,
//             useFactory: HttpLoaderFactory,
//             deps: [HttpClient]
//           }
//         })
//       ],
//       providers: [TranslateService]
//     }).compileComponents();
//     translate = TestBed.get(TranslateService);
//     http = TestBed.get(HttpTestingController);
//   }));

//   fit('should create the app', async(() => {
//     const fixture = TestBed.createComponent(AboutPageComponent);
//     const app = fixture.debugElement.componentInstance;
//     expect(app).toBeTruthy();
//   }));

//   fit('should load translations', async(() => {
//     spyOn(translate, 'getBrowserLang').and.returnValue('en');
//     const fixture = TestBed.createComponent(AboutPageComponent);
//     const compiled = fixture.debugElement.nativeElement;

//     // the DOM should be empty for now since the translations haven't
//     // been rendered yet
//     expect(compiled.querySelector('h1').textContent).toEqual('');

//     http.expectOne('/assets/i18n/en.json').flush(TRANSLATIONS_EN);
//     http.expectNone('/assets/i18n/pt-br.json');

//     // Finally, assert that there are no outstanding requests.
//     http.verify();

//     fixture.detectChanges();
//     // the content should be translated to english now
//     expect(compiled.querySelector('h1').textContent)
//       .toEqual(TRANSLATIONS_EN.I18N_ABOUT_PAGE_HEADING);

//     translate.use('pt-br');
//     http.expectOne('/assets/i18n/pt-br.json').flush(TRANSLATIONS_PT_BR);

//     // Finally, assert that there are no outstanding requests.
//     http.verify();

//     // the content has not changed yet
//     expect(compiled.querySelector('h1').textContent)
//       .toEqual(TRANSLATIONS_EN.I18N_ABOUT_PAGE_HEADING);

//     fixture.detectChanges();
//     // the content should be translated to french now
//     expect(compiled.querySelector('h').textContent)
//       .toEqual(TRANSLATIONS_PT_BR.I18N_ABOUT_PAGE_HEADING);
//   }));
// });
