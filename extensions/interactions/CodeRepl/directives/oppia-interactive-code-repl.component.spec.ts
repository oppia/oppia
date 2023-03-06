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
 * @fileoverview Unit tests for the InteractiveCodeRepl response component.
 */

import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { InteractiveCodeReplComponent } from './oppia-interactive-code-repl.component';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { ChangeDetectorRef, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import 'third-party-imports/skulpt.import';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';

describe('InteractiveCodeReplComponent', () => {
  let component: InteractiveCodeReplComponent;
  let playerPositionService: PlayerPositionService;
  let mockNewCardAvailableEmitter = new EventEmitter();
  let fixture: ComponentFixture<InteractiveCodeReplComponent>;
  let currentInteractionService: CurrentInteractionService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(interactionId, attributes) {
      return {
        language: attributes.languageWithValue,
        placeholder: attributes.placeholderWithValue,
        preCode: attributes.preCodeWithValue,
        postCode: attributes.postCodeWithValue
      };
    }
  }

  interface SkulptConfigurationArgs {
    output: Function;
    read: Function;
    timeoutMsg: Function;
    execLimit: number;
  }

  let mockCurrentInteractionService = {
    onSubmit: (answer, rulesService) => {},
    registerCurrentInteraction: (submitAnswerFn, validateExpressionFn) => {
      submitAnswerFn();
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveCodeReplComponent],
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
    playerPositionService = TestBed.get(PlayerPositionService);
    currentInteractionService = TestBed.get(CurrentInteractionService);
    fixture = TestBed.createComponent(InteractiveCodeReplComponent);
    component = fixture.componentInstance;
    component.lastAnswer = null;
    component.languageWithValue = {value: 'python'};
    component.placeholderWithValue = {value: '# Type your code here.'};
    component.preCodeWithValue = {value: '# precode'};
    component.postCodeWithValue = {value: '# postcode'};
  });

  it('should set interaction as inactive when a new card is displayed', () => {
    spyOnProperty(playerPositionService, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    component.ngOnInit();

    component.interactionIsActive = true;

    mockNewCardAvailableEmitter.emit();

    expect(component.interactionIsActive).toBeFalse();
  });

  it('should initialize when code editor interaction is added', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction').and.stub();
    spyOn(component.componentSubscriptions, 'add').and.callThrough();
    spyOn(Sk, 'configure').and.stub();

    component.ngOnInit();

    expect(component.componentSubscriptions.add).toHaveBeenCalled();
    expect(component.language).toBe('python');
    expect(component.placeholder).toBe('# Type your code here.\n');
    expect(component.preCode).toBe('# precode\n');
    expect(component.postCode).toBe('# postcode');
    expect(component.interactionIsActive).toBe(true);
    expect(component.hasLoaded).toBeFalse();
    expect(component.output).toBe('');
    expect(component.code)
      .toBe('# precode\n# Type your code here.\n# postcode');
    expect(Sk.configure).toHaveBeenCalled();
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalled();
  });

  it('should display last answer when a new card is displayed in the' +
  ' exploration player', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction').and.stub();
    spyOn(Sk, 'configure').and.stub();
    component.lastAnswer = {
      code: '# Type your code here.\nprint(\'hello\');\n# postcode',
      output: 'hello'
    };

    expect(component.code).toBeUndefined();
    expect(component.output).toBeUndefined();

    component.ngOnInit();

    // This displays the last answer only when the interaction is not active
    // anymore. Therefore, we test to see if the pre-condition is false.
    expect(component.interactionIsActive).toBeFalse();
    expect(component.code)
      .toBe('# Type your code here.\nprint(\'hello\');\n# postcode');
    expect(component.output).toBe('hello');
    expect(currentInteractionService.registerCurrentInteraction)
      .toHaveBeenCalled();
  });

  it('should not display precode when user does not enter any characters',
    () => {
      component.preCodeWithValue = {value: ' '};

      expect(component.preCode).toBeUndefined();

      component.ngOnInit();

      expect(component.preCode).toBe('');
    });

  it('should update output when the code completes execution', () => {
    spyOn(currentInteractionService, 'registerCurrentInteraction').and.stub();
    spyOn(Sk, 'configure').and.callFake((
        obj: SkulptConfigurationArgs
    ) => {
      obj.output('hello');
    });

    expect(component.output).toBeUndefined();

    component.ngOnInit();

    expect(Sk.configure).toHaveBeenCalled();
    expect(component.output).toBe('hello');
  });

  it('should dispay a timeout message when the code takes too long to run',
    () => {
      spyOn(Sk, 'configure').and.callFake((
          obj: SkulptConfigurationArgs
      ) => {
        obj.read('src/builtin/sys.js');
        obj.timeoutMsg();
      });
      spyOn(component, 'sendResponse').and.stub();

      component.ngOnInit();

      expect(component.sendResponse).toHaveBeenCalledWith('', 'timeout');
    });

  it('should throw error when builtin module is not found', () => {
    spyOn(Sk, 'configure').and.callFake((
        obj: SkulptConfigurationArgs
    ) => {
      obj.read('test');
      obj.timeoutMsg();
    });

    expect(() => {
      component.ngOnInit();
    }).toThrowError('module test not found');
  });

  it('should customize editor with editor options when the exploration player' +
  ' loads', () => {
    let cm = {
      replaceSelection: (spaces) => {
        expect(spaces).toBe('  ');
        expect(spaces.length).toBe(2);
      },
      getDoc: () => {
        return {
          setCursor: (pos) => {
            expect(pos).toBe(2);
          },
          getCursor: (loc) => {
            if (loc === 'head') {
              return 2;
            }
          }
        };
      },
      getOption: (opt) => {
        if (opt === 'indentUnit') {
          return 2;
        }
      }
    } as unknown as CodeMirror.Editor;

    component.editorOptions.extraKeys.Tab(cm);
  });

  it('should run code and submit code when user submits code', fakeAsync(() => {
    spyOn(Sk, 'importMainWithBody').and.returnValue({});

    expect(component.evaluation).toBeUndefined();
    expect(component.fullError).toBeUndefined();

    component.runAndSubmitCode('print(\'hello\');');
    tick();

    expect(component.evaluation).toBe('');
    expect(component.fullError).toBe('');
  }));

  it('should update code when user types the code editor', () => {
    component.code = '#code';

    component.onEditorChange('#test code comment');

    expect(component.code).toBe('#test code comment');
  });

  it('should display error when code fails', fakeAsync(() => {
    spyOn(Sk, 'importMainWithBody').and.returnValue({});
    // This throws "Argument of type '() => Promise<never>' is not assignable
    // to parameter of type 'never'" We need to suppress this error because the
    // the error case needs to be tested.
    // @ts-expect-error
    spyOn(Sk.misceval, 'asyncToPromise').and.callFake(() => {
      return Promise.reject('Error');
    });
    spyOn(component, 'sendResponse').and.callThrough();
    spyOn(currentInteractionService, 'onSubmit');

    component.runAndSubmitCode('print(\'hello\');');
    tick();

    expect(component.evaluation).toBe('');
    expect(component.fullError).toBe('Error');
    expect(component.sendResponse).toHaveBeenCalledWith('', 'Error');
    expect(currentInteractionService.onSubmit).toHaveBeenCalled();
  }));

  it('should execute after the component view has loaded', fakeAsync(() => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy =
      spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
    component.preCode = '#precode\n#Code';
    component.postCode = '#postcode';
    component.code = 'print(\'hello\');';
    component.codeMirrorComponent = {
      codeMirror: {
        getDoc: () => {
          return {
            markText: (obj1, obj2, obj3) => {}
          };
        },
        addLineClass: (num, txt1, txt2) => {}
      }
    } as CodemirrorComponent;

    component.ngAfterViewInit();
    tick();

    expect(component.hasLoaded).toBeTrue();
    expect(detectChangesSpy).toHaveBeenCalled();
  }));
});
