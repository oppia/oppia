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
 * @fileoverview Tests for roles-and-actions-visualizer component.
 */

import { ComponentFixture, TestBed} from '@angular/core/testing';

import { RolesAndActionsVisualizerComponent } from './roles-and-actions-visualizer.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

describe('Roles and actions visualizer component', function() {
  let component: RolesAndActionsVisualizerComponent;
  let fixture: ComponentFixture<RolesAndActionsVisualizerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RolesAndActionsVisualizerComponent],
      providers: [UrlInterpolationService],
    }).compileComponents();
    fixture = TestBed.createComponent(RolesAndActionsVisualizerComponent);
    component = fixture.componentInstance;
    component.roleToActions = {
      guest: ['allowed action 1', 'allowed action 2'],
      learner: ['allowed action 3', 'allowed action 4'],
      'exploration editor': ['allowed action 5', 'allowed action 6'],
      admin: ['allowed action 7', 'allowed action 8']
    };
  });

  it('should intialize correct active role', function() {
    component.ngOnInit();

    expect(component.activeRole).toEqual('Learner');
  });

  it('should intialize roles with all the roles', function() {
    component.ngOnInit();

    expect(component.roles).toEqual(
      ['Admin', 'Exploration editor', 'Guest', 'Learner']);
  });

  it('should intialize roleToActions correctly', function() {
    component.ngOnInit();

    expect(component.roleToActions).toEqual({
      Guest: ['Allowed action 1', 'Allowed action 2'],
      Learner: ['Allowed action 3', 'Allowed action 4'],
      'Exploration editor': ['Allowed action 5', 'Allowed action 6'],
      Admin: ['Allowed action 7', 'Allowed action 8']
    });
  });

  it('should set active role correctly', function() {
    component.ngOnInit();

    expect(component.activeRole).toEqual('Learner');

    component.setActiveRole('Admin');
    expect(component.activeRole).toEqual('Admin');
  });
});
