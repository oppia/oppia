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
 * @fileoverview Tests for Admin misc tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';

import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminTaskManagerService } from '../services/admin-task-manager.service';
import { AdminMiscTabComponent } from './admin-misc-tab.component';

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash'
    }
  }
}

class MockReaderObject {
  result = null;
  onloadend = null;
  constructor() {
    this.onloadend = () => {
      return 'Fake onload executed';
    };
  }
  readAsDataURL(file) {
    this.onloadend();
    return 'The file is loaded';
  }
  readAsText(){
    return;
  }
}

fdescribe('Admin misc tab component ', () => {
  let component: AdminMiscTabComponent;
  let fixture: ComponentFixture<AdminMiscTabComponent>;

  let adminBackendApiService: AdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let mockWindowRef: MockWindowRef;

  let statusMessageSpy: jasmine.Spy;
  let confirmSpy: jasmine.Spy;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [AdminMiscTabComponent],
      providers: [
        AdminBackendApiService,
        AdminTaskManagerService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMiscTabComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    adminTaskManagerService = TestBed.inject(AdminTaskManagerService);

    statusMessageSpy = spyOn(component.setStatusMessage, 'emit')
      .and.returnValue(null);
    spyOn(adminTaskManagerService, 'startTask').and.returnValue(null);
    spyOn(adminTaskManagerService, 'finishTask').and.returnValue(null);
    confirmSpy = spyOn(mockWindowRef.nativeWindow, 'confirm');
    // This throws "Argument of type 'mockReaderObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());
  });

  describe('when clicking on clear search index button ', () => {
    it('should clear search index successfully', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let clearSearchIndexSpy = spyOn(
        adminBackendApiService, 'clearSearchIndexAsync')
        .and.resolveTo(null);

      component.clearSearchIndex();
      tick();

      expect(clearSearchIndexSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Index successfully cleared.');
    }));

    it('should not clear search index in case of backend ' +
      'error', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let clearSearchIndexSpy = spyOn(
        adminBackendApiService, 'clearSearchIndexAsync')
        .and.rejectWith('Internal Server Error.');

      component.clearSearchIndex();
      tick();

      expect(clearSearchIndexSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Internal Server Error.');
    }));

    it('should not request backend to clear search index if ' +
      'a task is still running in the queue', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let clearSearchIndexSpy = spyOn(
        adminBackendApiService, 'clearSearchIndexAsync');

      // Setting task is still running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      component.clearSearchIndex();
      tick();

      expect(clearSearchIndexSpy).not.toHaveBeenCalled();
    }));

    it('should not request backend to clear search index if ' +
      'cancel button is clicked in the alert', fakeAsync(() => {
      confirmSpy.and.returnValue(false);
      let clearSearchIndexSpy = spyOn(
        adminBackendApiService, 'clearSearchIndexAsync');
      // Setting cancel button clicked to be true.

      component.clearSearchIndex();
      tick();

      expect(clearSearchIndexSpy).not.toHaveBeenCalled();
    }));
  });

  describe('when clicking on regenerate topic button ', () => {
    it('should regenerate topic successfully', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let regenerateTopicSpy = spyOn(
        adminBackendApiService, 'regenerateOpportunitiesRelatedToTopicAsync')
        .and.returnValue(Promise.resolve(10));

      component.regenerateOpportunitiesRelatedToTopic();
      tick();

      expect(regenerateTopicSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'No. of opportunities model created: 10'
      );
    }));

    it('should not regenerate topic in case of backend ' +
      'error', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let regenerateTopicSpy = spyOn(
        adminBackendApiService, 'regenerateOpportunitiesRelatedToTopicAsync')
        .and.rejectWith('Internal Server Error.');

      component.regenerateOpportunitiesRelatedToTopic();
      tick();

      expect(regenerateTopicSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Internal Server Error.');
    }));

    it('should not request backend to regenerate topic if ' +
      'a task is still running in the queue', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let regenerateTopicSpy = spyOn(
        adminBackendApiService, 'regenerateOpportunitiesRelatedToTopicAsync');

      // Setting task is still running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      component.regenerateOpportunitiesRelatedToTopic();
      tick();

      expect(regenerateTopicSpy).not.toHaveBeenCalled();
    }));

    it('should not request backend to regenerate topic if ' +
      'cancel button is clicked in the alert', fakeAsync(() => {
      confirmSpy.and.returnValue(false);
      let regenerateTopicSpy = spyOn(
        adminBackendApiService, 'regenerateOpportunitiesRelatedToTopicAsync');
      // Setting cancel button clicked to be true.

      component.regenerateOpportunitiesRelatedToTopic();
      tick();

      expect(regenerateTopicSpy).not.toHaveBeenCalled();
    }));
  });

  describe('when clicking on upload csv button ', () => {
    it('should upload csv file successfully', fakeAsync(() => {
      let uploadCsvSpy = spyOn(
        adminBackendApiService, 'uploadTopicSimilaritiesAsync')
        .and.returnValue(Promise.resolve());

      component.uploadTopicSimilaritiesFile();
      tick();

      expect(uploadCsvSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Topic similarities uploaded successfully.'
      );
    }));

    it('should not upload csv file in case of backend ' +
      'error', fakeAsync(() => {
      let uploadCsvSpy = spyOn(
        adminBackendApiService, 'uploadTopicSimilaritiesAsync')
        .and.rejectWith('Internal Server Error.');

      component.uploadTopicSimilaritiesFile();
      tick();

      expect(uploadCsvSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Internal Server Error.');
    }));
  });

  it('should download topic similarities csv file ' +
    'on clicking download button', () => {
    let downloadHandler = '/admintopicscsvdownloadhandler';
    expect(mockWindowRef.nativeWindow.location.href).toEqual('href');
    component.downloadTopicSimilaritiesFile();
    expect(mockWindowRef.nativeWindow.location.href).toEqual(downloadHandler);
  });

});