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
 * @fileoverview Unit tests for collection editor page component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {Collection} from 'domain/collection/collection.model';
import {UrlService} from 'services/contextual/url.service';
import {PageTitleService} from 'services/page-title.service';
import {CollectionEditorPageComponent} from './collection-editor-page.component';
import {CollectionEditorRoutingService} from './services/collection-editor-routing.service';
import {CollectionEditorStateService} from './services/collection-editor-state.service';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Collection editor page component', () => {
  let componentInstance: CollectionEditorPageComponent;
  let fixture: ComponentFixture<CollectionEditorPageComponent>;

  let collectionEditorRoutingService: CollectionEditorRoutingService;
  let collectionEditorStateService: CollectionEditorStateService;
  let pageTitleService: PageTitleService;
  let urlService: UrlService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CollectionEditorPageComponent],
      providers: [
        CollectionEditorRoutingService,
        CollectionEditorStateService,
        PageTitleService,
        UrlService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionEditorPageComponent);
    componentInstance = fixture.componentInstance;
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    collectionEditorRoutingService = TestBed.inject(
      CollectionEditorRoutingService
    );
    pageTitleService = TestBed.inject(PageTitleService);
    urlService = TestBed.inject(UrlService);
    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize', () => {
    let mockOnCollectionInitializedEventEmitter = new EventEmitter<void>();
    let collectionId = 'collection_id';

    spyOnProperty(
      collectionEditorStateService,
      'onCollectionInitialized'
    ).and.returnValue(mockOnCollectionInitializedEventEmitter);
    spyOn(collectionEditorStateService, 'loadCollection');
    spyOn(componentInstance, 'setTitle');
    spyOn(componentInstance, 'subscribeToOnLangChange');
    spyOn(urlService, 'getCollectionIdFromEditorUrl').and.returnValue(
      collectionId
    );

    componentInstance.ngOnInit();
    mockOnCollectionInitializedEventEmitter.emit();
    fixture.detectChanges();

    expect(componentInstance.setTitle).toHaveBeenCalled();
    expect(componentInstance.subscribeToOnLangChange).toHaveBeenCalled();
    expect(collectionEditorStateService.loadCollection).toHaveBeenCalledWith(
      collectionId
    );
  });

  it('should destroy', () => {
    spyOn(componentInstance.directiveSubscriptions, 'unsubscribe');
    componentInstance.ngOnDestroy();
    expect(
      componentInstance.directiveSubscriptions.unsubscribe
    ).toHaveBeenCalled();
  });

  it('should set page title whenever the selected language changes', () => {
    componentInstance.subscribeToOnLangChange();
    spyOn(componentInstance, 'setTitle');
    translateService.onLangChange.emit();

    expect(componentInstance.setTitle).toHaveBeenCalled();
  });

  it('should obtain translation and set page title', () => {
    let pageTitle = 'test title';

    spyOn(collectionEditorStateService, 'getCollection').and.returnValues(
      {
        getTitle: () => pageTitle,
      } as Collection,
      {
        getTitle: () => '',
      } as Collection
    );
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');

    componentInstance.setTitle();
    componentInstance.setTitle();

    expect(translateService.instant).toHaveBeenCalledTimes(2);
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_COLLECTION_EDITOR_PAGE_TITLE',
      {
        collectionTitle: pageTitle,
      }
    );
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_COLLECTION_EDITOR_UNTITLED_COLLECTION_PAGE_TITLE'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledTimes(2);
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_COLLECTION_EDITOR_PAGE_TITLE'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_COLLECTION_EDITOR_UNTITLED_COLLECTION_PAGE_TITLE'
    );
  });

  it('should tell active tab name', () => {
    let activeTabName = 'Active Tab';
    spyOn(collectionEditorRoutingService, 'getActiveTabName').and.returnValue(
      activeTabName
    );
    expect(componentInstance.getActiveTabName()).toEqual(activeTabName);
  });
});
