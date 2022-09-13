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
 * @fileoverview Unit test for graph editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { GraphEditorComponent } from './graph-editor.component';

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GraphEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
  });

  it('should update value component when user edits a graph', fakeAsync(() => {
    spyOn(component.valueChanged, 'emit');
    expect(component.graphIsShown).toBeFalse();
    component.ngAfterViewInit();
    tick();
    expect(component.graphIsShown).toBeTrue();
    let graph = {
      isWeighted: false,
      edges: [
        {
          src: 0,
          dst: 1,
          weight: 1
        },
        {
          src: 1,
          dst: 2,
          weight: 1
        }
      ],
      isDirected: false,
      vertices: [
        {
          x: 150,
          y: 50,
          label: ''
        },
        {
          x: 200,
          y: 50,
          label: ''
        },
        {
          x: 150,
          y: 100,
          label: ''
        },
        {
          x: 199.5625,
          y: 121.625,
          label: ''
        }
      ],
      isLabeled: false
    };

    expect(component.value).toBeUndefined();

    component.updateValue(graph);

    expect(component.value).toEqual(graph);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(graph);
  }));
});
