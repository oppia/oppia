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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {TopicsDependencyGraphModalComponent} from './topic-dependency-graph-viz-modal.component';

describe('Topic Dependency Graph Visualization Modal Component', () => {
  let fixture: ComponentFixture<TopicsDependencyGraphModalComponent>;
  let componentInstance: TopicsDependencyGraphModalComponent;
  let closeSpy: jasmine.Spy;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicsDependencyGraphModalComponent],
      providers: [NgbActiveModal],
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

  it('should be able to create graph data from the topics prerequisite', () => {
    componentInstance.topicIdToTopicName = {
      1: 'Dummy Topic 1',
      2: 'Dummy Topic 2',
      3: 'Dummy Topic 3',
      4: 'Dummy Topic 4',
      5: 'Dummy Topic 5',
    };
    componentInstance.topicIdToPrerequisiteTopicIds = {
      1: [],
      2: ['1'],
      3: ['1'],
      4: ['2'],
      5: ['3'],
    };
    const expectedGraphData = {
      finalStateIds: ['4', '5'],
      initStateId: '1',
      links: [
        {
          source: '1',
          target: '2',
          linkProperty: null,
          connectsDestIfStuck: false,
        },
        {
          source: '1',
          target: '3',
          linkProperty: null,
          connectsDestIfStuck: false,
        },
        {
          source: '2',
          target: '4',
          linkProperty: null,
          connectsDestIfStuck: false,
        },
        {
          source: '3',
          target: '5',
          linkProperty: null,
          connectsDestIfStuck: false,
        },
      ],
      nodes: {
        1: 'Dummy Topic 1',
        2: 'Dummy Topic 2',
        3: 'Dummy Topic 3',
        4: 'Dummy Topic 4',
        5: 'Dummy Topic 5',
      },
    };

    componentInstance.ngOnInit();

    expect(componentInstance.graphData).toEqual(expectedGraphData);
  });

  it(
    'should be able to create graph data from the topics prerequisite ' +
      'when all topics can be initial topic ID',
    () => {
      componentInstance.topicIdToTopicName = {
        1: 'Dummy Topic 1',
        2: 'Dummy Topic 2',
        3: 'Dummy Topic 3',
        4: 'Dummy Topic 4',
        5: 'Dummy Topic 5',
      };
      componentInstance.topicIdToPrerequisiteTopicIds = {
        1: ['5'],
        2: ['1'],
        3: ['2'],
        4: ['3'],
        5: ['4'],
      };
      const expectedGraphData = {
        finalStateIds: [],
        initStateId: '1',
        links: [
          {
            source: '5',
            target: '1',
            linkProperty: null,
            connectsDestIfStuck: false,
          },
          {
            source: '1',
            target: '2',
            linkProperty: null,
            connectsDestIfStuck: false,
          },
          {
            source: '2',
            target: '3',
            linkProperty: null,
            connectsDestIfStuck: false,
          },
          {
            source: '3',
            target: '4',
            linkProperty: null,
            connectsDestIfStuck: false,
          },
          {
            source: '4',
            target: '5',
            linkProperty: null,
            connectsDestIfStuck: false,
          },
        ],
        nodes: {
          1: 'Dummy Topic 1',
          2: 'Dummy Topic 2',
          3: 'Dummy Topic 3',
          4: 'Dummy Topic 4',
          5: 'Dummy Topic 5',
        },
      };

      componentInstance.ngOnInit();

      expect(componentInstance.graphData).toEqual(expectedGraphData);
    }
  );

  it('should get truncated label with truncate filter', () => {
    expect(
      componentInstance.getTruncatedLabel('This is a label for node 3')
    ).toBe('This is a la...');
  });
});
