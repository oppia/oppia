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
 * @fileoverview Unit tests for EndExploration component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import {
  async,
  ComponentFixture,
  TestBed,
  tick,
  fakeAsync,
} from '@angular/core/testing';
import {InteractiveEndExplorationComponent} from './oppia-interactive-end-exploration.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ContextService} from 'services/context.service';
import {EndExplorationBackendApiService} from './end-exploration-backend-api.service';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';

describe('Interactive ratio expression input', () => {
  let component: InteractiveEndExplorationComponent;
  let fixture: ComponentFixture<InteractiveEndExplorationComponent>;
  let contextService: ContextService;
  let endExplorationBackendApiService: EndExplorationBackendApiService;

  const httpResponse = {
    summaries: [
      {
        id: '0',
      },
    ],
  };
  const editorTabContext = 'preview';
  const pageContextEditor = 'editor';

  class MockInteractionAttributesExtractorService {
    getValuesFromAttributes(
      interactionId: InteractionSpecsKey,
      attributes: Record<string, string>
    ) {
      return {
        recommendedExplorationIds: {
          value: JSON.parse(attributes.recommendedExplorationIdsWithValue),
        },
      };
    }
  }

  class MockEndExplorationBackendApiService {
    async getRecommendExplorationsData() {
      return Promise.resolve(httpResponse);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveEndExplorationComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: MockInteractionAttributesExtractorService,
        },
        {
          provide: EndExplorationBackendApiService,
          useClass: MockEndExplorationBackendApiService,
        },
        ContextService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  describe('Valid exploration id provided', function () {
    const explorationIds = ['0'];

    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      endExplorationBackendApiService = TestBed.inject(
        EndExplorationBackendApiService
      );
      fixture = TestBed.createComponent(InteractiveEndExplorationComponent);
      component = fixture.componentInstance;

      component.recommendedExplorationIdsWithValue =
        JSON.stringify(explorationIds);
      component.errorMessage = '';

      spyOn(contextService, 'getPageContext').and.returnValue(
        pageContextEditor
      );
      spyOn(contextService, 'getEditorTabContext').and.returnValue(
        editorTabContext
      );
    });

    it('should initialize ctrl variables', function () {
      component.ngOnInit();
      expect(component.isInEditorPage).toBeTrue();
      expect(component.isInEditorPreviewMode).toBeTrue();
      expect(component.isInEditorMainTab).toBeFalse();
    });

    it('should not display error message', fakeAsync(() => {
      const recommendExplorationSpy = spyOn(
        endExplorationBackendApiService,
        'getRecommendExplorationsData'
      ).and.callThrough();

      component.ngOnInit();
      tick(150);
      fixture.detectChanges();

      expect(component.isInEditorPage).toBeTrue();
      expect(component.isInEditorPreviewMode).toBeTrue();
      expect(component.isInEditorMainTab).toBeFalse();
      expect(recommendExplorationSpy).toHaveBeenCalled();
      expect(component.errorMessage).toBe('');
    }));
  });

  describe('Invalid exploration Id provided', function () {
    const explorationIds = ['0', '1'];

    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      endExplorationBackendApiService = TestBed.inject(
        EndExplorationBackendApiService
      );
      fixture = TestBed.createComponent(InteractiveEndExplorationComponent);
      component = fixture.componentInstance;

      component.recommendedExplorationIdsWithValue =
        JSON.stringify(explorationIds);
      component.errorMessage = '';

      spyOn(contextService, 'getPageContext').and.returnValue(
        pageContextEditor
      );
      spyOn(contextService, 'getEditorTabContext').and.returnValue(
        editorTabContext
      );
    });

    it('should display error message', fakeAsync(() => {
      const recommendExplorationSpy = spyOn(
        endExplorationBackendApiService,
        'getRecommendExplorationsData'
      ).and.callThrough();

      component.ngOnInit();
      tick(150);
      fixture.detectChanges();

      expect(component.isInEditorPage).toBeTrue();
      expect(component.isInEditorPreviewMode).toBeTrue();
      expect(component.isInEditorMainTab).toBeFalse();
      expect(recommendExplorationSpy).toHaveBeenCalled();
      expect(component.errorMessage).toBe(
        'Warning: exploration(s) with the IDs "' +
          '1' +
          '" will not be shown as recommendations because ' +
          'they either do not exist, or are not publicly viewable.'
      );
    }));
  });

  describe('Data should not be fetched from backend ', function () {
    const explorationIds = ['0', '1'];

    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      endExplorationBackendApiService = TestBed.inject(
        EndExplorationBackendApiService
      );
      fixture = TestBed.createComponent(InteractiveEndExplorationComponent);
      component = fixture.componentInstance;

      component.recommendedExplorationIdsWithValue =
        JSON.stringify(explorationIds);

      spyOn(contextService, 'getPageContext').and.returnValue('learner');
      spyOn(contextService, 'getEditorTabContext').and.returnValue(
        editorTabContext
      );
      spyOn(
        endExplorationBackendApiService,
        'getRecommendExplorationsData'
      ).and.callFake(() => Promise.resolve(httpResponse));
    });

    it(
      'should not check if any author-recommended explorations are' +
        ' invalid.',
      function () {
        component.ngOnInit();
        expect(component.isInEditorPage).toBeFalse();
      }
    );
  });
});
