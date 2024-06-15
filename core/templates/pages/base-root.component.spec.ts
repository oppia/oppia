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
 * @fileoverview UnitTests for base root component.
 */

import {EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from '@angular/core/testing';
import {
  LangChangeEvent,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {of, Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {BaseRootComponent, MetaTagData} from './base-root.component';
import {PageHeadService} from 'services/page-head.service';

class MockComponent extends BaseRootComponent {
  title: string = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ADMIN.TITLE;
  meta: MetaTagData[] = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ADMIN
    .META as unknown as Readonly<MetaTagData>[];
}

describe('Base root component', () => {
  let fixture: ComponentFixture<MockComponent>;
  let component: MockComponent;
  let pageHeadService: PageHeadService;
  let translateServie: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [MockComponent],
      providers: [PageHeadService, TranslateService],
    }).compileComponents();

    fixture = TestBed.createComponent(MockComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
    translateServie = TestBed.inject(TranslateService);
  });

  it(
    'should subscribe to language ' + 'changes and update title and metadata',
    fakeAsync(() => {
      const translatedTitle = 'translatedTitle';
      const instantSpy = spyOn(translateServie, 'instant').and.returnValue(
        translatedTitle
      );
      const updateTitleAndMetaTagsSpy = spyOn(
        pageHeadService,
        'updateTitleAndMetaTags'
      );
      spyOnProperty(translateServie, 'onLangChange', 'get').and.returnValue(
        of(null) as unknown as EventEmitter<LangChangeEvent>
      );

      component.ngOnInit();
      flush();

      expect(instantSpy).toHaveBeenCalledOnceWith(
        component.title,
        component.titleInterpolationParams
      );
      expect(updateTitleAndMetaTagsSpy).toHaveBeenCalledWith(
        translatedTitle,
        component.meta
      );
    })
  );

  it('should unsubscribe on destroy', () => {
    const mockUnsubscribe = jasmine.createSpy();
    component.directiveSubscriptions = {
      unsubscribe: mockUnsubscribe,
    } as unknown as Subscription;

    component.ngOnDestroy();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
