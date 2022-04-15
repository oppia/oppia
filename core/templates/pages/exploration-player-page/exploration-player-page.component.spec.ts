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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { PageTitleService } from 'services/page-title.service';
import { ExplorationPlayerPageComponent } from './exploration-player-page.component';

/**
 * @fileoverview Unit tests for exploration player page component.
 */

describe('Exploration Player Page', () => {
  let fixture: ComponentFixture<ExplorationPlayerPageComponent>;
  let componentInstance: ExplorationPlayerPageComponent;
  let contextService: ContextService;
  let keyboardShortcutService: KeyboardShortcutService;
  let metaTagCustomizationService: MetaTagCustomizationService;
  let pageTitleService: PageTitleService;
  let readOnlyExplorationBackendApiService:
  ReadOnlyExplorationBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ExplorationPlayerPageComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ExplorationPlayerPageComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    keyboardShortcutService = TestBed.inject(KeyboardShortcutService);
    metaTagCustomizationService = TestBed.inject(MetaTagCustomizationService);
    pageTitleService = TestBed.inject(PageTitleService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
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
    spyOn(pageTitleService, 'setDocumentTitle');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');
    spyOn(keyboardShortcutService, 'bindExplorationPlayerShortcuts');

    componentInstance.ngOnInit();
    tick();

    expect(contextService.getExplorationId).toHaveBeenCalled();
    expect(readOnlyExplorationBackendApiService.fetchExplorationAsync)
      .toHaveBeenCalledWith(expId, null);
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      response.exploration.title + ' - Oppia');
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
});
