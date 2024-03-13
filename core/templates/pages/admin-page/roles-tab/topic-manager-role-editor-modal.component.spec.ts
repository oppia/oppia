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
 * @fileoverview Unit tests for TopicManagerRoleEditorModalComponent.
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  async,
  tick,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MaterialModule} from 'modules/material.module';

import {AdminBackendApiService} from 'domain/admin/admin-backend-api.service';
import {AlertsService} from 'services/alerts.service';

import {TopicManagerRoleEditorModalComponent} from './topic-manager-role-editor-modal.component';

describe('TopicManagerRoleEditorModalComponent', () => {
  let component: TopicManagerRoleEditorModalComponent;
  let fixture: ComponentFixture<TopicManagerRoleEditorModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let adminBackendApiService: AdminBackendApiService;
  let alertsService: AlertsService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, MaterialModule, HttpClientTestingModule],
      declarations: [TopicManagerRoleEditorModalComponent],
      providers: [NgbActiveModal, AdminBackendApiService, AlertsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicManagerRoleEditorModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    component.managedTopicIds = ['topic123', 'topic456', 'topic789'];
    component.topicIdToName = {
      topic000: 'Topic 000',
      topic123: 'Topic 123',
      topic456: 'Topic 456',
      topic789: 'Topic 789',
    };
    fixture.detectChanges();
  });

  it('should update topic ids for selection on initialization', () => {
    component.topicIdsForSelection = [];

    component.ngOnInit();

    expect(component.topicIdsForSelection).toEqual(['topic000']);
  });

  describe('on calling addTopic', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should make request to add topic', fakeAsync(() => {
      spyOn(
        adminBackendApiService,
        'assignManagerToTopicAsync'
      ).and.resolveTo();
      component.newTopicId = 'topic000';

      component.addTopic();
      expect(component.topicIdInUpdate).toEqual('topic000');
      tick();

      expect(
        adminBackendApiService.assignManagerToTopicAsync
      ).toHaveBeenCalled();
    }));

    it('should alert warning if request fails', fakeAsync(() => {
      spyOn(
        adminBackendApiService,
        'assignManagerToTopicAsync'
      ).and.returnValue(Promise.reject());
      spyOn(alertsService, 'addWarning').and.callThrough();

      component.newTopicId = 'topic000';

      component.addTopic();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalled();
    }));

    it('should throw error if no more topic left', fakeAsync(() => {
      component.newTopicId = null;

      expect(() => {
        component.addTopic();
      }).toThrowError('Expected newTopicId to be non-null.');
    }));
  });

  describe('on calling removeTopicId', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should make request to remove topic', fakeAsync(() => {
      spyOn(
        adminBackendApiService,
        'deassignManagerFromTopicAsync'
      ).and.resolveTo();

      component.removeTopicId('topic123');
      expect(component.topicIdInUpdate).toEqual('topic123');
      tick();

      expect(
        adminBackendApiService.deassignManagerFromTopicAsync
      ).toHaveBeenCalled();
    }));

    it('should alert warning if request fails', fakeAsync(() => {
      spyOn(
        adminBackendApiService,
        'deassignManagerFromTopicAsync'
      ).and.returnValue(Promise.reject());
      spyOn(alertsService, 'addWarning').and.callThrough();

      component.removeTopicId('topic123');
      tick();

      expect(alertsService.addWarning).toHaveBeenCalled();
    }));
  });

  it('should close with correct managed topic ids', () => {
    const modalCloseSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.managedTopicIds = ['topic000'];

    component.close();

    expect(modalCloseSpy).toHaveBeenCalledWith(['topic000']);
  });
});
