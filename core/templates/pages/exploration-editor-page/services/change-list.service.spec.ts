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
 * @fileoverview Tests for Change List Service.
 */

import {async, fakeAsync, flush, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeListService} from './change-list.service';
import {LoaderService} from 'services/loader.service';
import {EventEmitter} from '@angular/core';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {ExplorationDataService} from './exploration-data.service';
import {AutosaveInfoModalsService} from './autosave-info-modals.service';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {VoiceoverBackendDict} from 'domain/exploration/voiceover.model';

class MockWindowRef {
  _window = {
    location: {
      _pathname: '/learn/math',
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      get pathname() {
        return this._pathname;
      },
      set pathname(val) {
        this._pathname = val;
      },
      reload: () => {},
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {},
    },
    navigator: {
      // Internet Connection.
      onLine: true,
    },
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockExplorationDataService1 {
  explorationId!: 0;
  autosaveChangeListAsync(
    changeList: string[],
    successCb: (arg0: {
      changes_are_mergeable: boolean;
      is_version_of_draft_valid: boolean;
    }) => void,
    errorCb: () => void
  ) {
    successCb({
      changes_are_mergeable: true,
      is_version_of_draft_valid: false,
    });
  }

  discardDraftAsync() {
    return;
  }
}

class MockExplorationDataService2 {
  explorationId!: 0;
  autosaveChangeListAsync(
    changeList: string[],
    successCb: (arg0: {
      changes_are_mergeable: boolean;
      is_version_of_draft_valid: boolean;
    }) => void,
    errorCb: () => void
  ) {
    successCb({
      changes_are_mergeable: false,
      is_version_of_draft_valid: false,
    });
  }

  discardDraftAsync() {
    return;
  }
}

class MockExplorationDataService3 {
  explorationId!: 0;
  autosaveChangeListAsync(
    changeList: string[],
    successCb: () => void,
    errorCb: () => void
  ) {
    errorCb();
  }

  discardDraftAsync() {
    return;
  }
}

class MockAutosaveInfoModalsService {
  isModalOpen() {
    return false;
  }

  showNonStrictValidationFailModal() {
    return;
  }
}

describe('Change List Service when changes are mergable', () => {
  let changeListService: ChangeListService;
  let alertsService: AlertsService;
  let mockWindowRef: MockWindowRef;
  let internetConnectivityService: InternetConnectivityService;
  let autosaveInfoModalsService: AutosaveInfoModalsService;

  let alertsSpy: jasmine.Spy;
  let mockExplorationDataService: MockExplorationDataService1;
  let mockEventEmitter = new EventEmitter();

  beforeEach(async(() => {
    mockWindowRef = new MockWindowRef();
    mockExplorationDataService = new MockExplorationDataService1();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: mockExplorationDataService,
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: LoaderService,
          useValue: {
            onLoadingMessageChange: mockEventEmitter,
          },
        },
      ],
    });
  }));

  beforeEach(() => {
    changeListService = TestBed.inject(ChangeListService);
    internetConnectivityService = TestBed.inject(InternetConnectivityService);
    autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
    alertsService = TestBed.inject(AlertsService);

    spyOn(
      autosaveInfoModalsService,
      'showVersionMismatchModal'
    ).and.returnValue();
    spyOn(
      autosaveInfoModalsService,
      'showNonStrictValidationFailModal'
    ).and.returnValue();
    alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue();
  });

  it('should set loading message when initialized', () => {
    mockEventEmitter.emit('loadingMessage');

    expect(changeListService.loadingMessage).toBe('loadingMessage');
  });

  it(
    'should save changes after deleting a state ' +
      "when calling 'deleteState'",
    fakeAsync(() => {
      changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
      changeListService.explorationChangeList.length = 0;
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'emit'
      ).and.callThrough();

      changeListService.deleteState('state');
      flush();

      expect(saveSpy).toHaveBeenCalled();
    })
  );

  it(
    'should save changes after adding a state ' + "when calling 'addState'",
    fakeAsync(() => {
      changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
      changeListService.explorationChangeList.length = 0;
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'emit'
      ).and.callThrough();

      changeListService.addState('state', 'content_1', 'dafault_outcome_4');
      flush();

      expect(saveSpy).toHaveBeenCalled();
    })
  );

  it('should add Written Translation', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    changeListService.addWrittenTranslation(
      'contentId',
      'dataFormat',
      'languageCode',
      'stateName',
      'translationHtml'
    );

    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    changeListService.addState('state', 'content_1', 'dafault_outcome_4');
    flush();

    expect(saveSpy).toHaveBeenCalled();
  }));

  it('should add change for markTranslationsAsNeedingUpdate', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    changeListService.markTranslationsAsNeedingUpdate('content_id_1');
    flush();
    expect(saveSpy).toHaveBeenCalled();
  }));

  it('should add change for markTranslationAsNeedingUpdateForLanguage', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    changeListService.markTranslationAsNeedingUpdateForLanguage(
      'content_id_1',
      'fr'
    );
    flush();
    expect(saveSpy).toHaveBeenCalled();
  }));

  it('should add change for removeTranslations', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    changeListService.removeTranslations('content_id_1');
    flush();
    expect(saveSpy).toHaveBeenCalled();
  }));

  it('should add change for edit translations', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    changeListService.editTranslation(
      'content_id_1',
      'en',
      new TranslatedContent('Translated content', 'unicode', false)
    );
    flush();
    expect(saveSpy).toHaveBeenCalled();
    expect(changeListService.explorationChangeList.length).toEqual(1);
  }));

  it('should get all translation changelist', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    changeListService.editTranslation(
      'content_id_1',
      'en',
      new TranslatedContent('Translated content', 'unicode', false)
    );
    changeListService.addState('state_2', 'content_id_2', 'content_id_default');
    changeListService.removeTranslations('content_id_3');
    changeListService.markTranslationsAsNeedingUpdate('content_id_4');
    flush();

    expect(changeListService.explorationChangeList.length).toEqual(4);
    const translationChangeList = changeListService.getTranslationChangeList();
    expect(translationChangeList.length).toEqual(3);
    expect(translationChangeList.map(change => change.cmd)).toEqual(
      jasmine.arrayWithExactContents([
        'remove_translations',
        'edit_translation',
        'mark_translations_needs_update',
      ])
    );
  }));

  it('should add change for edit voiceovers', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    let voiceover: VoiceoverBackendDict = {
      filename: 'b.mp3',
      file_size_bytes: 100000,
      needs_update: false,
      duration_secs: 12.0,
    };
    let voiceoverTypeToVoiceovers = {
      manual: voiceover,
    };

    changeListService.editVoiceovers(
      'content_id_1',
      'en-US',
      voiceoverTypeToVoiceovers
    );

    flush();
    expect(saveSpy).toHaveBeenCalled();
    expect(changeListService.explorationChangeList.length).toEqual(1);
  }));

  it('should get all voiceover changelist', fakeAsync(() => {
    changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
    changeListService.explorationChangeList.length = 0;
    changeListService.loadingMessage = '';
    spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.callThrough();

    let voiceover: VoiceoverBackendDict = {
      filename: 'b.mp3',
      file_size_bytes: 100000,
      needs_update: false,
      duration_secs: 12.0,
    };
    let voiceoverTypeToVoiceovers = {
      manual: voiceover,
    };

    changeListService.editVoiceovers(
      'content_id_1',
      'en-US',
      voiceoverTypeToVoiceovers
    );

    changeListService.addState('state_2', 'content_id_2', 'content_id_default');
    flush();

    expect(changeListService.explorationChangeList.length).toEqual(2);
    const voiceoverChangeList = changeListService.getVoiceoverChangeList();
    expect(voiceoverChangeList.length).toEqual(1);
    expect(voiceoverChangeList.map(change => change.cmd)).toEqual(
      jasmine.arrayWithExactContents(['update_voiceovers'])
    );
  }));

  it(
    'should save changes after renaming a state ' +
      "when calling 'renameState'",
    fakeAsync(() => {
      changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
      changeListService.explorationChangeList.length = 0;
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'emit'
      ).and.callThrough();

      changeListService.renameState('oldState', 'newState');
      flush();

      expect(saveSpy).toHaveBeenCalled();
    })
  );

  it(
    'should save changes after editing exploration property ' +
      "when calling 'editExplorationProperty'",
    fakeAsync(() => {
      changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
      changeListService.explorationChangeList.length = 0;
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'emit'
      ).and.callThrough();

      changeListService.editExplorationProperty(
        'language_code',
        'oldValue',
        'newValue'
      );
      flush();

      expect(saveSpy).toHaveBeenCalled();
    })
  );

  it(
    'should save changes after editing state property ' +
      "when calling 'editExplorationProperty'",
    fakeAsync(() => {
      changeListService.changeListAddedTimeoutId = setTimeout(() => {}, 10);
      changeListService.explorationChangeList.length = 0;
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'emit'
      ).and.callThrough();

      changeListService.editStateProperty(
        'state',
        'solution',
        'oldValue',
        'newValue'
      );
      flush();

      expect(saveSpy).toHaveBeenCalled();
    })
  );

  it(
    'should not save changes after deleting a state ' +
      'if loading message is being shown',
    () => {
      changeListService.explorationChangeList.length = 0;
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'emit'
      ).and.callThrough();

      // Setting loading message.
      changeListService.loadingMessage = 'loadingMessage';
      changeListService.deleteState('state');

      expect(saveSpy).not.toHaveBeenCalled();
    }
  );

  it(
    'should not save changes after deleting a state ' +
      'if internet is offline',
    () => {
      changeListService.explorationChangeList.length = 0;
      let saveSpy = spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'emit'
      ).and.callThrough();
      // Setting internet to offline.
      spyOn(internetConnectivityService, 'isOnline').and.returnValue(false);

      changeListService.deleteState('state');

      expect(saveSpy).not.toHaveBeenCalled();
    }
  );

  it('should discard all changes ' + "when calling 'discardAllChanges'", () => {
    let discardSpy = spyOn(
      mockExplorationDataService,
      'discardDraftAsync'
    ).and.callThrough();

    changeListService.discardAllChanges();

    expect(discardSpy).toHaveBeenCalled();
  });

  it(
    'should show alert message if we try to edit ' +
      'an exploration with invalid property',
    () => {
      changeListService.editExplorationProperty(
        'prop1',
        'oldValue',
        'newValue'
      );

      expect(alertsSpy).toHaveBeenCalledWith(
        'Invalid exploration property: prop1'
      );
    }
  );

  it(
    'should show alert message if we try to edit ' +
      'an state with invalid property',
    () => {
      changeListService.editStateProperty(
        'stateName',
        // This throws "Argument of type 'prop1' is not assignable to parameter
        // of type 'StatePropertyNames'.". We need to suppress this error because
        // we want to test passing wrong values.
        // @ts-expect-error
        'prop1',
        'oldValue',
        'newValue'
      );

      expect(alertsSpy).toHaveBeenCalledWith('Invalid state property: prop1');
    }
  );

  it(
    'should check whether exploration locked for editing ' +
      "when calling 'isExplorationLockedForEditing'",
    () => {
      changeListService.explorationChangeList.length = 2;
      expect(changeListService.isExplorationLockedForEditing()).toBe(true);

      changeListService.explorationChangeList.length = 0;
      expect(changeListService.isExplorationLockedForEditing()).toBe(false);
    }
  );
});

describe('Change List Service when changes are not mergable', () => {
  let changeListService: ChangeListService;
  let alertsService: AlertsService;
  let mockWindowRef: MockWindowRef;
  let autosaveInfoModalsService: AutosaveInfoModalsService;

  let alertsSpy: jasmine.Spy;
  let mockExplorationDataService: MockExplorationDataService1;

  beforeEach(async(() => {
    mockWindowRef = new MockWindowRef();
    mockExplorationDataService = new MockExplorationDataService2();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: mockExplorationDataService,
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
    });
  }));

  beforeEach(() => {
    changeListService = TestBed.inject(ChangeListService);
    autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
    alertsService = TestBed.inject(AlertsService);

    spyOn(
      autosaveInfoModalsService,
      'showVersionMismatchModal'
    ).and.returnValue();
    spyOn(
      autosaveInfoModalsService,
      'showNonStrictValidationFailModal'
    ).and.returnValue();
    alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue();
  });

  it("should undo and save changes when calling 'undoLastChange'", () => {
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.returnValue();
    changeListService.explorationChangeList.length = 2;

    changeListService.undoLastChange();

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should not undo changes when there are no changes', () => {
    changeListService.explorationChangeList.length = 0;

    changeListService.undoLastChange();

    expect(alertsSpy).toHaveBeenCalledWith('There are no changes to undo.');
  });
});

describe('Change List Service when internet is available', () => {
  let changeListService: ChangeListService;
  let alertsService: AlertsService;
  let mockWindowRef: MockWindowRef;
  let onInternetStateChangeEventEmitter = new EventEmitter();

  let alertsSpy: jasmine.Spy;
  let mockExplorationDataService: MockExplorationDataService3;
  let mockAutosaveInfoModalsService: MockAutosaveInfoModalsService;

  beforeEach(async(() => {
    mockWindowRef = new MockWindowRef();
    mockExplorationDataService = new MockExplorationDataService3();
    mockAutosaveInfoModalsService = new MockAutosaveInfoModalsService();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: mockExplorationDataService,
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: AutosaveInfoModalsService,
          useValue: mockAutosaveInfoModalsService,
        },
        {
          provide: InternetConnectivityService,
          useValue: {
            onInternetStateChange: onInternetStateChangeEventEmitter,
            isOnline() {
              return true;
            },
          },
        },
      ],
    });
  }));

  beforeEach(() => {
    changeListService = TestBed.inject(ChangeListService);
    alertsService = TestBed.inject(AlertsService);
    alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue();
  });

  it("should undo and save changes when calling 'undoLastChange'", () => {
    let saveSpy = spyOn(
      changeListService.autosaveInProgressEventEmitter,
      'emit'
    ).and.returnValue();
    changeListService.temporaryListOfChanges = [
      {
        cmd: 'add_state',
        state_name: 'stateName',
        content_id_for_state_content: 'content_0',
        content_id_for_default_outcome: 'default_outcome_1',
      },
    ];
    changeListService.explorationChangeList.length = 2;

    onInternetStateChangeEventEmitter.emit(true);
    changeListService.undoLastChange();

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should not undo changes when there are no changes', () => {
    changeListService.temporaryListOfChanges = [
      {
        cmd: 'add_state',
        state_name: 'stateName',
        content_id_for_state_content: 'content_0',
        content_id_for_default_outcome: 'default_outcome_1',
      },
    ];

    changeListService.undoLastChange();

    expect(alertsSpy).toHaveBeenCalledWith('There are no changes to undo.');
  });
});
