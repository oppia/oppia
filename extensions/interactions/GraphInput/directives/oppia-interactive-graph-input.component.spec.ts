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
 * @fileoverview Unit tests for the GraphInput interaction.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractiveGraphInput } from './oppia-interactive-graph-input.component';
import { TranslateModule } from '@ngx-translate/core';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { GraphAnswer } from 'interactions/answer-defs';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';

describe('InteractiveGraphInput', () => {
  let component: InteractiveGraphInput;
  let playerPositionService: PlayerPositionService;
  let mockNewCardAvailableEmitter = new EventEmitter();
  let fixture: ComponentFixture<InteractiveGraphInput>;
  let currentInteractionService: CurrentInteractionService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(
        interactionId: InteractionSpecsKey, attributes: Record<string, string>
    ) {
      return {
        graph: {
          value: JSON.parse(attributes.graphWithValue)
        },
        canAddVertex: {
          value: JSON.parse(attributes.canAddVertexWithValue)
        },
        canDeleteVertex: {
          value: JSON.parse(attributes.canDeleteVertexWithValue)
        },
        canEditVertexLabel: {
          value: JSON.parse(attributes.canMoveVertexWithValue)
        },
        canMoveVertex: {
          value: JSON.parse(attributes.canEditVertexLabelWithValue)
        },
        canAddEdge: {
          value: JSON.parse(attributes.canAddEdgeWithValue)
        },
        canDeleteEdge: {
          value: JSON.parse(attributes.canDeleteEdgeWithValue)
        },
        canEditEdgeWeight: {
          value: JSON.parse(attributes.canEditEdgeWeightWithValue)
        }
      };
    }
  }

  let mockCurrentInteractionService = {
    updateViewWithNewAnswer: () => {},
    onSubmit: (
        answer: GraphAnswer, rulesService: CurrentInteractionService) => {},
    registerCurrentInteraction: (
        submitAnswerFn: Function, validateExpressionFn: Function) => {
      submitAnswerFn();
      validateExpressionFn();
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en'
        })
      ],
      declarations: [InteractiveGraphInput],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: mockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useValue: mockCurrentInteractionService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    playerPositionService = TestBed.get(PlayerPositionService);
    fixture = TestBed.createComponent(InteractiveGraphInput);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);

    component.graphWithValue = '{' +
    '  "isWeighted": false,' +
    '  "edges": [' +
    '      {' +
    '          "src": 0,' +
    '          "dst": 1,' +
    '          "weight": 1' +
    '      },' +
    '      {' +
    '          "src": 1,' +
    '          "dst": 2,' +
    '          "weight": 1' +
    '      }' +
    '  ],' +
    '  "isDirected": false,' +
    '  "vertices": [' +
    '      {' +
    '          "x": 150,' +
    '          "y": 50,' +
    '          "label": ""' +
    '      },' +
    '      {' +
    '          "x": 200,' +
    '          "y": 50,' +
    '          "label": ""' +
    '      },' +
    '      {' +
    '          "x": 150,' +
    '          "y": 100,' +
    '          "label": ""' +
    '      }' +
    '  ],' +
    '  "isLabeled": false' +
    '}';
    component.canAddVertexWithValue = 'true';
    component.canDeleteVertexWithValue = 'true';
    component.canMoveVertexWithValue = 'true';
    component.canEditVertexLabelWithValue = 'true';
    component.canAddEdgeWithValue = 'true';
    component.canDeleteEdgeWithValue = 'true';
    component.canEditEdgeWeightWithValue = 'true';
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialise component when user saves interaction', () => {
    spyOn(component.componentSubscriptions, 'add');
    spyOn(component, 'resetGraph').and.callThrough();
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.callThrough();
    component.lastAnswer = null;

    component.ngOnInit();

    expect(component.componentSubscriptions.add).toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
    expect(component.interactionIsActive).toBe(true);
    expect(component.graph).toEqual({
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
        }
      ],
      isLabeled: false
    });
    expect(component.resetGraph).toHaveBeenCalled();
    expect(component.canAddVertex).toBe(true);
    expect(component.canDeleteVertex).toBe(true);
    expect(component.canEditVertexLabel).toBe(true);
    expect(component.canMoveVertex).toBe(true);
    expect(component.canAddEdge).toBe(true);
    expect(component.canDeleteEdge).toBe(true);
    expect(component.canEditEdgeWeight).toBe(true);
  });

  it('should initialise customization options as false if interaction is not' +
  ' active when component is initialised', () => {
    component.lastAnswer = {
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
          x: 250,
          y: 50,
          label: ''
        },
        {
          x: 230,
          y: 50,
          label: ''
        },
        {
          x: 350,
          y: 100,
          label: ''
        }
      ],
      isLabeled: false
    };

    component.ngOnInit();

    expect(component.canAddVertex).toBe(false);
    expect(component.canDeleteVertex).toBe(false);
    expect(component.canEditVertexLabel).toBe(false);
    expect(component.canMoveVertex).toBe(false);
    expect(component.canAddEdge).toBe(false);
    expect(component.canDeleteEdge).toBe(false);
    expect(component.canEditEdgeWeight).toBe(false);
  });

  it('should get RTL language status correctly', () => {
    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should set the last answer given by the user as the graph when the' +
  ' interaction is not longer active in the exploration player', () => {
    component.lastAnswer = {
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
          x: 250,
          y: 50,
          label: ''
        },
        {
          x: 230,
          y: 50,
          label: ''
        },
        {
          x: 350,
          y: 100,
          label: ''
        }
      ],
      isLabeled: false
    };
    component.graphWithValue = 'null';

    component.ngOnInit();

    component.graph = {
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
          x: 250,
          y: 50,
          label: ''
        },
        {
          x: 230,
          y: 50,
          label: ''
        },
        {
          x: 350,
          y: 100,
          label: ''
        }
      ],
      isLabeled: false
    };
  });

  it('should display error message to user if the graph is invalid', () => {
    component.graphWithValue = 'null';
    component.errorMessage = '';

    component.resetGraph();

    expect(component.errorMessage)
      .toBe('I18N_INTERACTIONS_GRAPH_ERROR_INVALID');
  });

  it('should return true when a valid graph is passed', () => {
    component.graph = {
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
          x: 250,
          y: 50,
          label: ''
        },
        {
          x: 230,
          y: 50,
          label: ''
        },
        {
          x: 350,
          y: 100,
          label: ''
        }
      ],
      isLabeled: false
    };

    expect(component.validityCheckFn()).toBe(true);
  });

  it('should return false when a invalid graph is passed', () => {
    // This throws "Type null is not assignable to type
    // 'GraphAnswer'." We need to suppress this error
    // because of the need to test validations.
    // @ts-ignore
    component.graph = null;

    expect(component.validityCheckFn()).toBe(false);
  });

  it('should set all customization options to false when a new card is' +
  ' displayed', () => {
    spyOnProperty(playerPositionService, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    component.ngOnInit();
    component.interactionIsActive = true;
    component.canAddVertex = true;
    component.canDeleteVertex = true;
    component.canEditVertexLabel = true;
    component.canMoveVertex = true;
    component.canAddEdge = true;
    component.canDeleteEdge = true;
    component.canEditEdgeWeight = true;

    mockNewCardAvailableEmitter.emit();

    expect(component.canAddVertex).toBe(false);
    expect(component.canDeleteVertex).toBe(false);
    expect(component.canEditVertexLabel).toBe(false);
    expect(component.canMoveVertex).toBe(false);
    expect(component.canAddEdge).toBe(false);
    expect(component.canDeleteEdge).toBe(false);
    expect(component.canEditEdgeWeight).toBe(false);
  });
});
