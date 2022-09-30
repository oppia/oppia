// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the topic dependency graph viz modal component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TopicsDependencyGraphModalComponent } from './topic-dependency-graph-viz-modal.component';

describe('Topic Dependency Graph Visualization Modal Component', () => {
  let fixture: ComponentFixture<TopicsDependencyGraphModalComponent>;
  let componentInstance: TopicsDependencyGraphModalComponent;
  let closeSpy: jasmine.Spy;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TopicsDependencyGraphModalComponent
      ],
      providers: [
        NgbActiveModal,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicsDependencyGraphModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should be able to close modal', () => {
    componentInstance.close();
    expect(closeSpy).toHaveBeenCalled();
  });
});
