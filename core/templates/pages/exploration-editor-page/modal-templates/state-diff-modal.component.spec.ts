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
 * @fileoverview Unit tests for StateDiffModalComponent.
 */

import { State, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { StateDiffModalBackendApiService } from '../services/state-diff-modal-backend-api.service';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { headersAndYamlStrs, StateDiffModalComponent } from './state-diff-modal.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContextService } from 'services/context.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

describe('State Diff Modal Component', () => {
  let sof: StateObjectFactory;
  let sdmbas: StateDiffModalBackendApiService;
  let contextService: ContextService;
  let component: StateDiffModalComponent;
  let fixture: ComponentFixture<StateDiffModalComponent>;

  let headers: headersAndYamlStrs;
  let newState: State | null;
  let newStateName = 'New state';
  let oldState: State | null;
  let oldStateName = 'Old state';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateDiffModalComponent],
      providers: [
        NgbActiveModal,
        UrlInterpolationService,
        ContextService,
        StateDiffModalBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateDiffModalComponent);
    component = fixture.componentInstance;
    sof = TestBed.inject(StateObjectFactory);
    sdmbas = TestBed.inject(StateDiffModalBackendApiService);
    sdmbas = (sdmbas as unknown) as
     jasmine.SpyObj<StateDiffModalBackendApiService>;
    contextService = TestBed.inject(ContextService);
    contextService = (contextService as unknown) as
     jasmine.SpyObj<ContextService>;
  });

  describe('when new state and old state are truthy', () => {
    beforeEach(() => {
      newState = sof.createDefaultState(newStateName);
      oldState = sof.createDefaultState(oldStateName);

      component.headers = headers;
      component.newState = newState;
      component.newStateName = newStateName;
      component.oldState = oldState;
      component.oldStateName = oldStateName;
    });

    it('should initialize component properties after component is initialized',
      fakeAsync(() => {
        spyOn(sdmbas, 'fetchYaml').and.returnValue(Promise.resolve({
          yaml: 'Yaml data'
        }));
        spyOn(contextService, 'getExplorationId').and.returnValue('exp1');

        component.ngOnInit();
        tick(201);
        fixture.whenStable()
          .then(() => {
            expect(component.headers).toBe(headers);
            expect(component.newStateName).toBe(newStateName);
            expect(component.oldStateName).toBe(oldStateName);
          });
      }));

    it('should evaluate yaml strings object', fakeAsync(() => {
      spyOn(sdmbas, 'fetchYaml').and.returnValue(Promise.resolve({
        yaml: 'Yaml data'
      }));
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');

      component.ngOnInit();
      tick(201);
      fixture.whenStable()
        .then(() => {
          expect(component.yamlStrs.leftPane).toBe('Yaml data');
          expect(component.yamlStrs.rightPane).toBe('Yaml data');
        });
    }));
  });

  describe('when new state and old state are falsy', () => {
    beforeEach(() => {
      oldState = null;
      newState = null;

      component.headers = headers;
      component.newState = newState;
      component.newStateName = newStateName;
      component.oldState = oldState;
      component.oldStateName = oldStateName;
    });

    it('should initialize component properties after component is initialized',
      fakeAsync(() => {
        spyOn(sdmbas, 'fetchYaml').and.returnValue(Promise.resolve({
          yaml: 'Yaml data'
        }));
        spyOn(contextService, 'getExplorationId').and.returnValue('exp1');

        component.ngOnInit();
        tick(201);
        fixture.whenStable()
          .then(() => {
            expect(component.headers).toBe(headers);
            expect(component.newStateName).toBe(newStateName);
            expect(component.oldStateName).toBe(oldStateName);
          });
      }));

    it('should evaluate yaml strings object when timeout tasks are flushed',
      fakeAsync(() => {
        spyOn(sdmbas, 'fetchYaml').and.returnValue(Promise.resolve({
          yaml: 'Yaml data'
        }));

        spyOn(contextService, 'getExplorationId').and.returnValue('exp1');

        component.ngOnInit();
        tick(201);
        fixture.whenStable()
          .then(() => {
            expect(component.yamlStrs.leftPane).toBe('');
            expect(component.yamlStrs.rightPane).toBe('');
          });
      }));
  });
});
