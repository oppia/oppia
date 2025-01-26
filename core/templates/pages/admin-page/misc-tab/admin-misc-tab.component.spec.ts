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
 * @fileoverview UnitTests for Admin misc tab component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {AdminBackendApiService} from 'domain/admin/admin-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AdminTaskManagerService} from '../services/admin-task-manager.service';
import {AdminMiscTabComponent} from './admin-misc-tab.component';

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash',
    },
    open() {
      return;
    },
  };
}

class MockReaderObject {
  result = null;
  onload: {(arg0: {target: {result: string}}): void; (): string};
  constructor() {
    this.onload = () => {
      return 'Fake onload executed';
    };
  }

  readAsText() {
    this.onload({target: {result: 'result'}});
    return 'The file is loaded';
  }
}

describe('Admin misc tab component ', () => {
  let component: AdminMiscTabComponent;
  let fixture: ComponentFixture<AdminMiscTabComponent>;

  let adminBackendApiService: AdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let mockWindowRef: MockWindowRef;

  let statusMessageSpy: jasmine.Spy;
  let confirmSpy: jasmine.Spy;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [AdminMiscTabComponent],
      providers: [
        AdminBackendApiService,
        AdminTaskManagerService,
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMiscTabComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    adminTaskManagerService = TestBed.inject(AdminTaskManagerService);

    statusMessageSpy = spyOn(
      component.setStatusMessage,
      'emit'
    ).and.returnValue();
    spyOn(adminTaskManagerService, 'startTask').and.returnValue();
    spyOn(adminTaskManagerService, 'finishTask').and.returnValue();
    confirmSpy = spyOn(mockWindowRef.nativeWindow, 'confirm');
    // This throws "Argument of type 'mockReaderObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());
  });

  describe('when clicking on clear search index button ', () => {
    it('should clear search index successfully', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let clearSearchIndexSpy = spyOn(
        adminBackendApiService,
        'clearSearchIndexAsync'
      ).and.resolveTo();

      component.clearSearchIndex();
      tick();

      expect(clearSearchIndexSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Index successfully cleared.'
      );
    }));

    it(
      'should not clear search index in case of backend ' + 'error',
      fakeAsync(() => {
        confirmSpy.and.returnValue(true);
        let clearSearchIndexSpy = spyOn(
          adminBackendApiService,
          'clearSearchIndexAsync'
        ).and.rejectWith('Internal Server Error.');

        component.clearSearchIndex();
        tick();

        expect(clearSearchIndexSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );

    it(
      'should not request backend to clear search index if ' +
        'a task is still running in the queue',
      fakeAsync(() => {
        confirmSpy.and.returnValue(true);
        let clearSearchIndexSpy = spyOn(
          adminBackendApiService,
          'clearSearchIndexAsync'
        );

        // Setting task is still running to be true.
        spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

        component.clearSearchIndex();
        tick();

        expect(clearSearchIndexSpy).not.toHaveBeenCalled();
      })
    );

    it(
      'should not request backend to clear search index if ' +
        'cancel button is clicked in the alert',
      fakeAsync(() => {
        confirmSpy.and.returnValue(false);
        let clearSearchIndexSpy = spyOn(
          adminBackendApiService,
          'clearSearchIndexAsync'
        );
        // Setting cancel button clicked to be true.

        component.clearSearchIndex();
        tick();

        expect(clearSearchIndexSpy).not.toHaveBeenCalled();
      })
    );
  });

  describe('when clicking on regenerate topic button ', () => {
    it('should regenerate topic successfully', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let regenerateTopicSpy = spyOn(
        adminBackendApiService,
        'regenerateOpportunitiesRelatedToTopicAsync'
      ).and.returnValue(Promise.resolve({opportunities_count: 10}));

      component.regenerateOpportunitiesRelatedToTopic();
      tick();

      expect(regenerateTopicSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'No. of opportunities model created: 10'
      );
    }));

    it(
      'should not regenerate topic in case of backend ' + 'error',
      fakeAsync(() => {
        confirmSpy.and.returnValue(true);
        let regenerateTopicSpy = spyOn(
          adminBackendApiService,
          'regenerateOpportunitiesRelatedToTopicAsync'
        ).and.rejectWith('Internal Server Error.');

        component.regenerateOpportunitiesRelatedToTopic();
        tick();

        expect(regenerateTopicSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );

    it(
      'should not request backend to regenerate topic if ' +
        'a task is still running in the queue',
      fakeAsync(() => {
        confirmSpy.and.returnValue(true);
        let regenerateTopicSpy = spyOn(
          adminBackendApiService,
          'regenerateOpportunitiesRelatedToTopicAsync'
        );

        // Setting task is still running to be true.
        spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

        component.regenerateOpportunitiesRelatedToTopic();
        tick();

        expect(regenerateTopicSpy).not.toHaveBeenCalled();
      })
    );

    it(
      'should not request backend to regenerate topic if ' +
        'cancel button is clicked in the alert',
      fakeAsync(() => {
        confirmSpy.and.returnValue(false);
        let regenerateTopicSpy = spyOn(
          adminBackendApiService,
          'regenerateOpportunitiesRelatedToTopicAsync'
        );
        // Setting cancel button clicked to be true.

        component.regenerateOpportunitiesRelatedToTopic();
        tick();

        expect(regenerateTopicSpy).not.toHaveBeenCalled();
      })
    );
  });

  describe('when clicking on rollback exploration button ', () => {
    it('should rollback exploration successfully', fakeAsync(() => {
      confirmSpy.and.returnValue(true);
      let regenerateTopicSpy = spyOn(
        adminBackendApiService,
        'rollbackExplorationToSafeState'
      ).and.returnValue(Promise.resolve(10));

      component.rollbackExploration();
      tick();

      expect(regenerateTopicSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Exploration rolledback to version: 10'
      );
    }));

    it(
      'should not rollback exploration in case of backend ' + 'error',
      fakeAsync(() => {
        confirmSpy.and.returnValue(true);
        let regenerateTopicSpy = spyOn(
          adminBackendApiService,
          'rollbackExplorationToSafeState'
        ).and.rejectWith('Internal Server Error.');

        component.rollbackExploration();
        tick();

        expect(regenerateTopicSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );

    it(
      'should not request backend to rollback exploration if ' +
        'a task is still running in the queue',
      fakeAsync(() => {
        confirmSpy.and.returnValue(true);
        let regenerateTopicSpy = spyOn(
          adminBackendApiService,
          'rollbackExplorationToSafeState'
        );

        // Setting task is still running to be true.
        spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

        component.rollbackExploration();
        tick();

        expect(regenerateTopicSpy).not.toHaveBeenCalled();
      })
    );

    it(
      'should not request backend to rollback exploration if ' +
        'cancel button is clicked in the alert',
      fakeAsync(() => {
        confirmSpy.and.returnValue(false);
        let regenerateTopicSpy = spyOn(
          adminBackendApiService,
          'rollbackExplorationToSafeState'
        );
        // Setting cancel button clicked to be true.

        component.rollbackExploration();
        tick();

        expect(regenerateTopicSpy).not.toHaveBeenCalled();
      })
    );
  });

  describe('when clicking on upload csv button ', () => {
    it('should upload csv file successfully', fakeAsync(() => {
      let uploadCsvSpy = spyOn(
        adminBackendApiService,
        'uploadTopicSimilaritiesAsync'
      ).and.returnValue(Promise.resolve());

      component.uploadTopicSimilaritiesFile();
      tick();

      expect(uploadCsvSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Topic similarities uploaded successfully.'
      );
    }));

    it(
      'should not upload csv file in case of backend ' + 'error',
      fakeAsync(() => {
        let uploadCsvSpy = spyOn(
          adminBackendApiService,
          'uploadTopicSimilaritiesAsync'
        ).and.rejectWith('Internal Server Error.');

        component.uploadTopicSimilaritiesFile();
        tick();

        expect(uploadCsvSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );

    it('should throw error if no label is found for uploading files', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      expect(() => {
        component.uploadTopicSimilaritiesFile();
      }).toThrowError('No element with id topicSimilaritiesFile found.');
    });

    it('should throw error if no files are uploaded', () => {
      // This throws "Argument of type '() => { files: { size: number;
      // name: string; }[]; }' is not assignable to parameter of type
      // '(elementId: string) => HTMLElement'.". This is because the
      // actual 'getElementById' returns more properties than just "files".
      // We need to suppress this error because we need only "files"
      // property for testing.
      // @ts-expect-error
      spyOn(document, 'getElementById').and.callFake(() => {
        return {
          files: null,
        };
      });
      expect(() => {
        component.uploadTopicSimilaritiesFile();
      }).toThrowError('No files found.');
    });
  });

  it(
    'should download topic similarities csv file ' +
      'on clicking download button',
    () => {
      let downloadHandler = '/admintopicscsvdownloadhandler';
      expect(mockWindowRef.nativeWindow.location.href).toEqual('href');
      component.downloadTopicSimilaritiesFile();
      expect(mockWindowRef.nativeWindow.location.href).toEqual(downloadHandler);
    }
  );

  it(
    'should set data extraction query message ' +
      'on clicking submit query button',
    () => {
      let message = 'message';
      // Pre-checks.
      expect(component.showDataExtractionQueryStatus).toBeFalse();
      expect(component.dataExtractionQueryStatusMessage).toBeUndefined();

      component.setDataExtractionQueryStatusMessage(message);

      expect(component.showDataExtractionQueryStatus).toBeTrue();
      expect(component.dataExtractionQueryStatusMessage).toBe(message);
    }
  );

  describe('when clicking on send mail to admin button ', () => {
    it('should send mail successfully', fakeAsync(() => {
      let sendMailSpy = spyOn(
        adminBackendApiService,
        'sendDummyMailToAdminAsync'
      ).and.returnValue(Promise.resolve());

      component.sendDummyMailToAdmin();
      tick();

      expect(sendMailSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Success! Mail sent to admin.'
      );
    }));

    it(
      'should not send mail to admin in case of backend ' + 'error',
      fakeAsync(() => {
        let sendMailSpy = spyOn(
          adminBackendApiService,
          'sendDummyMailToAdminAsync'
        ).and.rejectWith('Internal Server Error.');

        component.sendDummyMailToAdmin();
        tick();

        expect(sendMailSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when clicking on update username button ', () => {
    it('should update username successfully', fakeAsync(() => {
      component.oldUsername = 'oldUsername';
      component.newUsername = 'newUsername';
      let updateUsernameSpy = spyOn(
        adminBackendApiService,
        'updateUserNameAsync'
      ).and.returnValue(Promise.resolve());

      component.updateUsername();
      tick();

      expect(updateUsernameSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Successfully renamed oldUsername to newUsername!'
      );
    }));

    it(
      'should not update username in case of backend ' + 'error',
      fakeAsync(() => {
        component.oldUsername = 'oldUsername';
        component.newUsername = 'newUsername';
        let updateUsernameSpy = spyOn(
          adminBackendApiService,
          'updateUserNameAsync'
        ).and.rejectWith('Internal Server Error.');

        component.updateUsername();
        tick();

        expect(updateUsernameSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when clicking on update blog post button ', () => {
    it('should update blog post successfully', fakeAsync(() => {
      component.authorUsername = 'username';
      component.publishedOn = '05/09/2001';
      component.blogPostId = '123456sample';
      let updateBlogPostSpy = spyOn(
        adminBackendApiService,
        'updateBlogPostDataAsync'
      ).and.returnValue(Promise.resolve());

      component.updateBlogPostData();
      tick();

      expect(updateBlogPostSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Successfully updated blog post data'
      );
    }));

    it(
      'should not update blog post in case of backend ' + 'error',
      fakeAsync(() => {
        component.authorUsername = 'username';
        component.publishedOn = '05/09/2001';
        component.blogPostId = '123456sample';
        let updateBlogPostSpy = spyOn(
          adminBackendApiService,
          'updateBlogPostDataAsync'
        ).and.rejectWith('Internal Server Error.');

        component.updateBlogPostData();
        tick();

        expect(updateBlogPostSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when clicking on number of deletion requests button ', () => {
    it('should show number of deletion requests successfully', fakeAsync(() => {
      let updateUsernameSpy = spyOn(
        adminBackendApiService,
        'getNumberOfPendingDeletionRequestAsync'
      ).and.returnValue(
        Promise.resolve({number_of_pending_deletion_models: '5'})
      );

      component.getNumberOfPendingDeletionRequestModels();
      tick();

      expect(updateUsernameSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'The number of users that are being deleted is: 5'
      );
    }));

    it(
      'should not show number of deletion requests in case of backend ' +
        'error',
      fakeAsync(() => {
        let updateUsernameSpy = spyOn(
          adminBackendApiService,
          'getNumberOfPendingDeletionRequestAsync'
        ).and.rejectWith('Internal Server Error.');

        component.getNumberOfPendingDeletionRequestModels();
        tick();

        expect(updateUsernameSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when clicking on grant permissions button ', () => {
    it('should grant super admin permissions successfully', fakeAsync(() => {
      let permissionsSpy = spyOn(
        adminBackendApiService,
        'grantSuperAdminPrivilegesAsync'
      ).and.returnValue(Promise.resolve());

      component.grantSuperAdminPrivileges();
      tick();

      expect(permissionsSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith('Success!');
    }));

    it(
      'should not grant super admin permissions in case of backend ' + 'error',
      fakeAsync(() => {
        let permissionsSpy = spyOn(
          adminBackendApiService,
          'grantSuperAdminPrivilegesAsync'
        ).and.rejectWith({error: {error: 'Internal Server Error.'}});

        component.grantSuperAdminPrivileges();
        tick();

        expect(permissionsSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when clicking on revoke permissions button ', () => {
    it('should revoke super admin permissions successfully', fakeAsync(() => {
      let permissionsSpy = spyOn(
        adminBackendApiService,
        'revokeSuperAdminPrivilegesAsync'
      ).and.returnValue(Promise.resolve());

      component.revokeSuperAdminPrivileges();
      tick();

      expect(permissionsSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith('Success!');
    }));

    it(
      'should not revoke super admin permissions in case of backend ' + 'error',
      fakeAsync(() => {
        let permissionsSpy = spyOn(
          adminBackendApiService,
          'revokeSuperAdminPrivilegesAsync'
        ).and.rejectWith({error: {error: 'Internal Server Error.'}});

        component.revokeSuperAdminPrivileges();
        tick();

        expect(permissionsSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when clicking on get models related to users button ', () => {
    it('should return user models successfully if they exist', fakeAsync(() => {
      let uesrModelSpy = spyOn(
        adminBackendApiService,
        'getModelsRelatedToUserAsync'
      ).and.returnValue(Promise.resolve(true));

      component.getModelsRelatedToUser();
      tick();

      expect(uesrModelSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Some related models exist, see logs ' + 'to find out the exact models'
      );
    }));

    it('should not return user models if they does not exist', fakeAsync(() => {
      let uesrModelSpy = spyOn(
        adminBackendApiService,
        'getModelsRelatedToUserAsync'
      ).and.returnValue(Promise.resolve(false));

      component.getModelsRelatedToUser();
      tick();

      expect(uesrModelSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith('No related models exist');
    }));

    it(
      'should not return user models in case of backend ' + 'error',
      fakeAsync(() => {
        let uesrModelSpy = spyOn(
          adminBackendApiService,
          'getModelsRelatedToUserAsync'
        ).and.rejectWith('Internal Server Error.');

        component.getModelsRelatedToUser();
        tick();

        expect(uesrModelSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when clicking on delete user button ', () => {
    it('should delete the user account successfully', fakeAsync(() => {
      let uesrModelSpy = spyOn(
        adminBackendApiService,
        'deleteUserAsync'
      ).and.returnValue(Promise.resolve());

      component.deleteUser();
      tick();

      expect(uesrModelSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'The deletion process was started.'
      );
    }));

    it(
      'should not delete user account in case of backend ' + 'error',
      fakeAsync(() => {
        let uesrModelSpy = spyOn(
          adminBackendApiService,
          'deleteUserAsync'
        ).and.rejectWith('Internal Server Error.');

        component.deleteUser();
        tick();

        expect(uesrModelSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error.'
        );
      })
    );
  });

  describe('when regenerating topic summaries', () => {
    it('should regenerate all topic summaries successfully', fakeAsync(() => {
      const topicModelSpy = spyOn(
        adminBackendApiService,
        'regenerateTopicSummariesAsync'
      ).and.returnValue(Promise.resolve());

      component.regenerateTopicSummaries();
      tick();

      expect(topicModelSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Successfully regenerated all topic summaries.'
      );
    }));

    it(
      'should not regenerate topic summaries in case of ' + 'server error',
      fakeAsync(() => {
        const topicModelSpy = spyOn(
          adminBackendApiService,
          'regenerateTopicSummariesAsync'
        ).and.rejectWith('Internal Server Error');

        component.regenerateTopicSummaries();
        tick();

        expect(topicModelSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'Server error: Internal Server Error'
        );
      })
    );
  });

  it('should sumbit query when clicking on submit query button', () => {
    let setQueryDataSpy = spyOn(
      component,
      'setDataExtractionQueryStatusMessage'
    ).and.callThrough();

    component.submitQuery();

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      'Data extraction query has been submitted. Please wait.'
    );
  });

  it('should reset form data on clicking reset button', () => {
    component.showDataExtractionQueryStatus = true;
    component.expId = 'expId';
    component.expVersion = 10;
    component.stateName = 'stateName';

    component.resetForm();

    expect(component.showDataExtractionQueryStatus).toBe(false);
    expect(component.expId).toBe('');
    expect(component.expVersion).toBe(0);
    expect(component.stateName).toBe('');
  });

  describe('when clicking on the Lookup Exploration Interaction IDs button', () => {
    it('should return interaction IDs if the exploration exists', fakeAsync(() => {
      let interactionSpy = spyOn(
        adminBackendApiService,
        'retrieveExplorationInteractionIdsAsync'
      ).and.returnValue(Promise.resolve({interaction_ids: ['EndExploration']}));

      component.retrieveExplorationInteractionIds();
      tick();

      expect(interactionSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Successfully fetched interactionIds in exploration.'
      );
      expect(component.explorationInteractionIds).toEqual(['EndExploration']);
    }));

    it(
      'should return empty interaction IDs' +
        ' if no interactionIds are found in the exploration',
      fakeAsync(() => {
        let interactionSpy = spyOn(
          adminBackendApiService,
          'retrieveExplorationInteractionIdsAsync'
        ).and.returnValue(Promise.resolve({interaction_ids: []}));

        component.retrieveExplorationInteractionIds();
        tick();

        expect(interactionSpy).toHaveBeenCalled();
        expect(statusMessageSpy).toHaveBeenCalledWith(
          'No interactionIds found in exploration.'
        );
        expect(component.explorationInteractionIds).toEqual([]);
      })
    );

    it('should handle the case when the exploration does not exist', fakeAsync(() => {
      let intSpy = spyOn(
        adminBackendApiService,
        'retrieveExplorationInteractionIdsAsync'
      ).and.rejectWith('Exploration does not exist');

      component.retrieveExplorationInteractionIds();
      tick();

      expect(intSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Exploration does not exist'
      );
      expect(component.explorationInteractionIds).toEqual([]);
    }));

    it('should handle the case when expIdToGetInteractionIdsFor is empty', fakeAsync(() => {
      let intSpy = spyOn(
        adminBackendApiService,
        'retrieveExplorationInteractionIdsAsync'
      ).and.rejectWith('Exploration does not exist');

      component.retrieveExplorationInteractionIds();
      tick();

      expect(intSpy).toHaveBeenCalled();
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Exploration does not exist'
      );
      expect(component.explorationInteractionIds).toEqual([]);
    }));
  });

  describe('when controlling azure admin config', () => {
    it('should be able to get azure admin config data on load', fakeAsync(() => {
      component.voiceoverAutogenerationIsEnabled = false;

      let getAzureAdminConfigSpy = spyOn(
        adminBackendApiService,
        'getAdminConfigForAutomaticVoiceoversAsync'
      ).and.resolveTo(true);

      component.ngOnInit();
      tick();

      expect(getAzureAdminConfigSpy).toHaveBeenCalled();
      expect(component.voiceoverAutogenerationIsEnabled).toBeTrue();
    }));

    it('should be able to update azure admin config data', fakeAsync(() => {
      component.voiceoverAutogenerationIsEnabled = false;

      let updateAzureAdminConfigSpy = spyOn(
        adminBackendApiService,
        'updateAutomaticVoiceoverSynthesisConfigAsync'
      ).and.resolveTo();

      component.updateAutomaticVoiceoverSynthesisUsingAzure();
      tick();

      expect(updateAzureAdminConfigSpy).toHaveBeenCalledWith(false);
    }));

    it('should fail to update azure admin config data', fakeAsync(() => {
      component.voiceoverAutogenerationIsEnabled = false;

      let updateAzureAdminConfigSpy = spyOn(
        adminBackendApiService,
        'updateAutomaticVoiceoverSynthesisConfigAsync'
      ).and.rejectWith({
        error: {error: 'Failed to update Azure admin config.'},
      });

      component.updateAutomaticVoiceoverSynthesisUsingAzure();
      tick();

      expect(updateAzureAdminConfigSpy).toHaveBeenCalledWith(false);
      expect(statusMessageSpy).toHaveBeenCalledWith(
        'Server error: Failed to update Azure admin config.'
      );
    }));
  });
});
