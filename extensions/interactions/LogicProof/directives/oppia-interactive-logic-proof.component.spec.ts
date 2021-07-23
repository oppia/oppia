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
 * @fileoverview Unit tests for the LogicProof Interaction.
 */

import { EventEmitter, NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractiveLogicProofComponent } from './oppia-interactive-logic-proof.component';
import { TranslateModule } from '@ngx-translate/core';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import logicProofStudent from 'interactions/LogicProof/static/js/student';
import CodeMirror from 'codemirror';
import logicProofConversion from '../static/js/conversion';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

describe('InteractiveLogicProofComponent', () => {
  let currentInteractionService: CurrentInteractionService;
  let playerPositionService: PlayerPositionService;
  let mockNewCardAvailableEmitter = new EventEmitter();
  let ngbModal: NgbModal;
  let component: InteractiveLogicProofComponent;
  let fixture: ComponentFixture<InteractiveLogicProofComponent>;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(interactionId, attributes) {
      return {
        question: {
          value: attributes.questionWithValue
        }
      };
    }
  }

  class CustomError extends Error {
    line;
    message;
    category;
    code;
    constructor(message, line, category = '', code = '', ...params) {
      super(...params);
      this.message = message;
      this.line = line;
      this.category = category;
      this.code = code;
    }
  }

  // This throws "Type 'mockEditor' is missing the
  // following properties from type 'Editor': hasFocus, findPosH,
  // findPosV, findWordAt, and 95 more." We need to suppress this error
  // because we don't require all 95 and only the function defined for
  // testing.
  // @ts-expect-error
  class mockEditor implements CodeMirror.Editor {
    static count = 0;
    proofString = '';
    refresh() {
      console.error('refresh');
      return;
    }
    setValue(val) {
      this.proofString = val;
    }
    getValue() {
      return this.proofString;
    }
    setOption(txt, bool) {
      return;
    }
    on(evt, func) {
      if (evt === 'beforeChange') {
        func('instance', {
          text: {
            join: (txt) => {
              return 'take a';
            }
          },
          from: {
            line: 1,
            ch: 0,
            sticky: null
          },
          to: {
            line: 1,
            ch: 0,
            sticky: null
          },
          cancel: () => {}
        });
      }
      if (evt === 'cursorActivity') {
        func();
      }
      if (evt === 'change') {
        func('instance', {
          text: {
            length: 2
          },
          removed: {
            length: 1
          }});
      }
    }
    get doc() {
      return {
        getCursor() {
          if (mockEditor.count === 0) {
            mockEditor.count += 1;
            return {
              line: 6
            };
          } else {
            return {
              line: 7
            };
          }
        },
        replaceRange() {
          return;
        }
      } as unknown as CodeMirror.Doc;
    }
  }

  let mockCurrentInteractionService = {
    onSubmit: (answer, rulesService) => {
    },
    registerCurrentInteraction: (submitAnswer, validateExpressionFn) => {
      submitAnswer();
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
        }),
      ],
      declarations: [InteractiveLogicProofComponent],
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
    ngbModal = TestBed.inject(NgbModal);
    currentInteractionService = TestBed.get(CurrentInteractionService);
    playerPositionService = TestBed.get(PlayerPositionService);

    fixture = TestBed.createComponent(InteractiveLogicProofComponent);
    component = fixture.componentInstance;
    component.questionWithValue = {
      assumptions: [
        {
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        }
      ],
      results: [
        {
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        }
      ],
      default_proof_string: 'Default'};
    component.lastAnswer = null;
    component.proofString = 'default';
  });

  it('should initialise component when user add interaction', () => {
    spyOn(logicProofStudent, 'buildProof').and.callFake(() => {
      return {
        lines: [
          {
            template_name: 'take',
            matchings: {
              a: {
                top_kind_name: 'variable',
                top_operator_name: 'a',
                arguments: [],
                dummies: []
              }
            },
            antecedents: [],
            results: [],
            variables: [
              {
                top_kind_name: 'variable',
                top_operator_name: 'a',
                arguments: [],
                dummies: []
              }
            ],
            indentation: 0,
            text: 'take a'
          }
        ]
      };
    });
    spyOn(logicProofStudent, 'checkProof').and.callFake(() => {
      return;
    });
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.callThrough();
    component.editor = {
      doc: {
        markText: () => {}
      } as unknown as CodeMirror.Doc
    } as unknown as CodeMirror.Editor;

    component.ngOnInit();

    expect(component.localQuestionData).toEqual({
      assumptions: [
        {
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        }
      ],
      results: [
        {
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        }
      ],
      default_proof_string: 'Default'
    });
    expect(component.interactionIsActive).toBeTrue();
    expect(component.questionData.assumptions).toEqual([
      {
        top_kind_name: 'variable',
        top_operator_name: 'p',
        arguments: [],
        dummies: []
      }
    ]);
    expect(component.questionData.results).toEqual([
      {
        top_kind_name: 'variable',
        top_operator_name: 'p',
        arguments: [],
        dummies: []
      }
    ]);
    expect(component.expressions).toEqual([
      {
        top_kind_name: 'variable',
        top_operator_name: 'p',
        arguments: [],
        dummies: []
      } as unknown as string,
      {
        top_kind_name: 'variable',
        top_operator_name: 'p',
        arguments: [],
        dummies: []
      } as unknown as string]);
    expect(component.topTypes).toEqual(['boolean', 'boolean']);
    expect(component.targetString).toBe('p');
    expect(component.assumptionsString).toBe('p');
    expect(component.questionString)
      .toBe('I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_ASSUMPTIONS');
    expect(component.questionStringData).toEqual({
      target: 'p',
      assumptions: 'p'
    });
    expect(component.messageIsSticky).toBeFalse();
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalledWith(jasmine.any(Function), null);
  });

  it('should generate custom assumtion string when user provides' +
  ' more than one', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.stub();
    component.questionWithValue.assumptions = [{
      top_kind_name: 'variable',
      top_operator_name: 'p',
      arguments: [],
      dummies: []
    }, {
      top_kind_name: 'variable',
      top_operator_name: 'c',
      arguments: [],
      dummies: []
    }];

    expect(component.assumptionsString).toBeUndefined();

    component.ngOnInit();

    expect(component.assumptionsString).toBe('p and c');
  });

  it('should not display assumptions when user does not provide any', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.stub();
    component.questionWithValue.assumptions = [];

    expect(component.questionString).toBeUndefined();

    component.ngOnInit();

    expect(component.questionString)
      .toBe('I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_NO_ASSUMPTION');
  });

  it('should execute when code editor is intilaised', fakeAsync(() => {
    spyOn(logicProofConversion, 'convertToLogicCharacters').and
      .returnValue('take ');
    let testMockEditor = new mockEditor();
    testMockEditor.setValue('Default');
    spyOn(console, 'error').and.stub();
    spyOn(component, 'checkForBasicErrors').and.stub();
    component.localQuestionData = {
      assumptions: [
        {
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        }
      ],
      results: [
        {
          top_kind_name: 'variable',
          top_operator_name: 'p',
          arguments: [],
          dummies: []
        }
      ],
      default_proof_string: 'Default'
    };
    component.interactionIsActive = true;
    component.editor = {
      doc: {
        markText: () => {}
      } as unknown as CodeMirror.Doc
    } as unknown as CodeMirror.Editor;
    component.proofString = '';

    // This throws "Type 'mockEditor' is missing the
    // following properties from type 'Editor': hasFocus, findPosH,
    // findPosV, findWordAt, and 95 more." We need to suppress this error
    // because we don't require all 95 and only the function defined for
    // testing.
    // @ts-expect-error
    component.codeEditor(new mockEditor());
    tick(600);

    // The editor variable is private. Therefore to test if refresh has
    // actually been called a console.error statement is executed and tested
    // to ensure that the function has been called.
    // expect(console.error).toHaveBeenCalledWith('refresh');
    expect(component.checkForBasicErrors).toHaveBeenCalledTimes(2);
    expect(component.proofString).toBe('Default');
    expect(component.editor).toEqual(testMockEditor);
  }));

  it('should set interaction as false when a new card is displayed', () => {
    spyOnProperty(playerPositionService, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    spyOn(logicProofStudent, 'buildProof').and.callFake(() => {
      return {
        lines: [
          {
            template_name: 'take',
            matchings: {
              a: {
                top_kind_name: 'variable',
                top_operator_name: 'a',
                arguments: [],
                dummies: []
              }
            },
            antecedents: [],
            results: [],
            variables: [
              {
                top_kind_name: 'variable',
                top_operator_name: 'a',
                arguments: [],
                dummies: []
              }
            ],
            indentation: 0,
            text: 'take a'
          }
        ]
      };
    });
    spyOn(logicProofStudent, 'checkProof').and.callFake(() => {
      return;
    });
    spyOn(currentInteractionService, 'registerCurrentInteraction')
      .and.callThrough();
    component.editor = {
      doc: {
        markText: () => {}
      } as unknown as CodeMirror.Doc
    } as unknown as CodeMirror.Editor;

    component.ngOnInit();

    expect(component.interactionIsActive).toBeTrue();

    mockNewCardAvailableEmitter.emit();

    expect(component.interactionIsActive).toBeFalse();
  });

  it('should check for basic error in the logic when user submits', () => {
    component.messageIsSticky = false;
    component.proofString = 'take a';
    spyOn(logicProofStudent, 'validateProof');

    component.checkForBasicErrors();

    expect(logicProofStudent.validateProof).toHaveBeenCalledWith(
      'take a', component.questionInstance);
  });

  it('should display error message when the proof is not valid', () => {
    spyOn(component, 'clearMessage').and.stub();
    spyOn(logicProofStudent, 'validateProof').and.callFake(() => {
      throw new CustomError('Error', 0);
    });
    component.messageIsSticky = true;
    component.errorMessage = '';
    component.proofString = 'assuming a';
    component.editor = {
      doc: {
        markText: () => {
          return {
            clear: () => {
              return;
            },
          };
        }
      } as unknown as CodeMirror.Doc
    } as unknown as CodeMirror.Editor;

    expect(component.errorMark).toBeUndefined();

    component.checkForBasicErrors();

    expect(component.clearMessage).toHaveBeenCalled();
    expect(component.messageIsSticky).toBeFalse();
    expect(component.errorMessage).toBe('line 1: Error');
  });

  it('should show error message when user submits invalid proof', () => {
    spyOn(component, 'clearMessage').and.callThrough();
    spyOn(component, 'showMessage').and.callThrough();
    spyOn(logicProofStudent, 'buildProof').and.callFake(() => {
      return {
        lines: [
          {
            template_name: 'take',
            matchings: {
              a: {
                top_kind_name: 'variable',
                top_operator_name: 'a',
                arguments: [],
                dummies: []
              }
            },
            antecedents: [],
            results: [],
            variables: [
              {
                top_kind_name: 'variable',
                top_operator_name: 'a',
                arguments: [],
                dummies: []
              }
            ],
            indentation: 0,
            text: 'take a'
          }
        ]
      };
    });
    spyOn(logicProofStudent, 'checkProof').and.callFake(() => {
      throw new CustomError('Error', 0, 'category', 'code');
    });
    // This throws "Type '{ clear: () => void; }' is missing the following
    // properties from type 'TextMarker': find, changed, on, off" We need
    // to suppress this error because we only need the clear funciton for
    // testing.
    // @ts-expect-error
    component.errorMark = {
      clear: () => {
        return;
      },
    };
    let clear = spyOn(component.errorMark, 'clear');
    component.editor = {
      doc: {
        markText: () => {
          return {
            clear: () => {
              return;
            },
          };
        }
      } as unknown as CodeMirror.Doc
    } as unknown as CodeMirror.Editor;
    component.assumptionsString = 'p';
    component.targetString = 'p';
    component.proofString = 'take a';
    component.questionString =
      'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_ASSUMPTIONS';
    component.errorMessage = '';
    component.messageIsSticky = false;

    component.submitProof();

    expect(component.clearMessage).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
    expect(component.errorMessage).toBe('line 1: Error');
    expect(component.messageIsSticky).toBeTrue();
  });

  it('should display help modal when user clicks the help button', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: {},
          result: Promise.resolve('success')
        });
    });

    component.showHelp({} as TemplateRef<unknown>);

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should close help modal when user clicks the close button', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: {},
          result: Promise.reject('close')
        });
    });

    component.showHelp({} as TemplateRef<unknown>);

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should make invalid line bold when user submits proof', () => {
    expect(component.displayProof('take1 a\nassuming a\nhence a', 1))
      .toEqual(['1  take1 a', '2  assuming a', '3  hence a']);
  });
});
