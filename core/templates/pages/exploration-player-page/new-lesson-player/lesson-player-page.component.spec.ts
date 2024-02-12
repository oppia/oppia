// Copyright 2024 The Oppia Authors. All Rights Reserved.
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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { PageTitleService } from 'services/page-title.service';
import { NewLessonPlayerPageComponent } from './lesson-player-page.component';

/**
 * @fileoverview Unit tests for new lesson player page component.
 */

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('New Lesson Player Page', () => {
  let fixture: ComponentFixture<NewLessonPlayerPageComponent>;
  let componentInstance: NewLessonPlayerPageComponent;
  let contextService: ContextService;
  let keyboardShortcutService: KeyboardShortcutService;
  let metaTagCustomizationService: MetaTagCustomizationService;
  let pageTitleService: PageTitleService;
  let readOnlyExplorationBackendApiService:
  ReadOnlyExplorationBackendApiService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        NewLessonPlayerPageComponent
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(NewLessonPlayerPageComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    keyboardShortcutService = TestBed.inject(KeyboardShortcutService);
    metaTagCustomizationService = TestBed.inject(MetaTagCustomizationService);
    pageTitleService = TestBed.inject(PageTitleService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    translateService = TestBed.inject(TranslateService);
  }));

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize component', fakeAsync(() => {
    const expId = 'exp_id';
    const response = {
      exploration: {
        title: 'Test',
        objective: 'test objective',
      }
    };

    spyOn(contextService, 'getExplorationId').and.returnValue(expId);
    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve(
        response as FetchExplorationBackendResponse));
    spyOn(componentInstance, 'setPageTitle');
    spyOn(componentInstance, 'subscribeToOnLangChange');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');
    spyOn(keyboardShortcutService, 'bindExplorationPlayerShortcuts');

    componentInstance.ngOnInit();
    tick();

    expect(contextService.getExplorationId).toHaveBeenCalled();
    expect(readOnlyExplorationBackendApiService.fetchExplorationAsync)
      .toHaveBeenCalledWith(expId, null);
    expect(componentInstance.setPageTitle).toHaveBeenCalled();
    expect(componentInstance.subscribeToOnLangChange).toHaveBeenCalled();
    expect(metaTagCustomizationService.addOrReplaceMetaTags)
      .toHaveBeenCalledWith([
        {
          propertyType: 'itemprop',
          propertyValue: 'name',
          content: response.exploration.title
        },
        {
          propertyType: 'itemprop',
          propertyValue: 'description',
          content: response.exploration.objective
        },
        {
          propertyType: 'property',
          propertyValue: 'og:title',
          content: response.exploration.title
        },
        {
          propertyType: 'property',
          propertyValue: 'og:description',
          content: response.exploration.objective
        }
      ]);
    expect(keyboardShortcutService.bindExplorationPlayerShortcuts)
      .toHaveBeenCalled();
  }));

  it('should obtain translated page title whenever the selected' +
  'language changes', () => {
    componentInstance.subscribeToOnLangChange();
    spyOn(componentInstance, 'setPageTitle');
    translateService.onLangChange.emit();

    expect(componentInstance.directiveSubscriptions.closed).toBe(false);
    expect(componentInstance.setPageTitle).toHaveBeenCalled();
  });

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    componentInstance.explorationTitle = 'dummy_name';
    componentInstance.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_EXPLORATION_PLAYER_PAGE_TITLE', {
        explorationTitle: 'dummy_name'
      });
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_EXPLORATION_PLAYER_PAGE_TITLE');
  });

  it('should unsubscribe on component destruction', () => {
    componentInstance.subscribeToOnLangChange();
    expect(componentInstance.directiveSubscriptions.closed).toBe(false);
    componentInstance.ngOnDestroy();

    expect(componentInstance.directiveSubscriptions.closed).toBe(true);
  });
});
