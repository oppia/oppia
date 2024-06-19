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

/**
 * @fileoverview Unit tests for modify translations modal component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  tick,
  fakeAsync,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ModifyTranslationsModalComponent} from './exploration-modify-translations-modal.component';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {ChangeListService} from '../services/change-list.service';
import {ContextService} from 'services/context.service';
import {EntityBulkTranslationsBackendApiService} from '../services/entity-bulk-translations-backend-api.service';

describe('Modify Translations Modal Component', function () {
  let component: ModifyTranslationsModalComponent;
  let fixture: ComponentFixture<ModifyTranslationsModalComponent>;
  let entityTranslationsService: EntityTranslationsService;
  let changeListService: ChangeListService;
  let contextService: ContextService;
  let entityBulkTranslationsBackendApiService: EntityBulkTranslationsBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ModifyTranslationsModalComponent],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyTranslationsModalComponent);
    component = fixture.componentInstance;
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    changeListService = TestBed.inject(ChangeListService);
    contextService = TestBed.inject(ContextService);
    entityBulkTranslationsBackendApiService = TestBed.inject(
      EntityBulkTranslationsBackendApiService
    );

    entityTranslationsService.languageCodeToEntityTranslations = {
      hi: EntityTranslation.createFromBackendDict({
        entity_id: 'expId',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'fr',
        translations: {
          content1: {
            content_value: 'This is text one.',
            content_format: 'html',
            needs_update: false,
          },
          content2: {
            content_value: 'This is text two.',
            content_format: 'html',
            needs_update: false,
          },
          content3: {
            content_value: 'This is text three.',
            content_format: 'html',
            needs_update: false,
          },
        },
      }),
    };
    spyOn(
      entityBulkTranslationsBackendApiService,
      'fetchEntityBulkTranslationsAsync'
    ).and.returnValue(
      Promise.resolve({
        hi: {
          entityId: 'entity1',
          entityType: 'exploration',
          entityVersion: 5,
          languageCode: 'hi',
          translationMapping: {
            content1: {
              translation: '<p>This is content 1.</p>',
              dataFormat: 'html',
              needsUpdate: true,
            },
            content4: {
              translation: '<p>This is content 4.</p>',
              dataFormat: 'html',
              needsUpdate: false,
            },
          },
        },
      })
    );
  });

  it('should check component is initialized', () => {
    expect(component).toBeDefined();
  });

  describe('when initializing content translations', () => {
    it('should use latest translations from entity translations service', fakeAsync(() => {
      spyOn(contextService, 'getExplorationId').and.returnValue('expId');
      let expectedTranslation = TranslatedContent.createFromBackendDict({
        content_value: 'This is text one.',
        content_format: 'html',
        needs_update: false,
      });
      expect(component.contentTranslations).toEqual({});

      component.contentId = 'content1';
      component.ngOnInit();
      tick();

      expect(component.contentTranslations).toEqual({
        hi: expectedTranslation,
      });
    }));

    it('should use published translations when changes do not exist', fakeAsync(() => {
      spyOn(contextService, 'getExplorationId').and.returnValue('expId');
      let expectedTranslation = TranslatedContent.createFromBackendDict({
        content_value: '<p>This is content 4.</p>',
        content_format: 'html',
        needs_update: false,
      });
      expect(component.contentTranslations).toEqual({});

      component.contentId = 'content4';
      component.ngOnInit();
      tick();

      expect(component.contentTranslations).toEqual({
        hi: expectedTranslation,
      });
    }));
  });

  it('should handle translations being removed', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(changeListService, 'getTranslationChangeList').and.returnValue([
      {
        cmd: 'remove_translations',
        content_id: 'content4',
      },
    ]);
    expect(component.contentTranslations).toEqual({});

    component.contentId = 'content4';
    component.ngOnInit();
    expect(component.contentTranslations).toEqual({});
  });

  it('should get language name from language code', () => {
    const languageCode = 'en';
    expect(component.getLanguageName(languageCode)).toBe('English');
  });
});
