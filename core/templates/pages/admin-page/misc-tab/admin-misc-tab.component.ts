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
 * @fileoverview Component for the miscellaneous tab in the admin panel.
 */

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {AppConstants} from 'app.constants';
import {AdminBackendApiService} from 'domain/admin/admin-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AdminPageConstants} from '../admin-page.constants';
import {AdminTaskManagerService} from '../services/admin-task-manager.service';

@Component({
  selector: 'oppia-admin-misc-tab',
  templateUrl: './admin-misc-tab.component.html',
})
export class AdminMiscTabComponent implements OnInit {
  @Output() setStatusMessage: EventEmitter<string> = new EventEmitter();
  DATA_EXTRACTION_QUERY_HANDLER_URL: string =
    '/explorationdataextractionhandler';

  irreversibleActionMessage: string =
    'This action is irreversible. Are you sure?';

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  dataExtractionQueryStatusMessage!: string;
  oldUsername!: string;
  newUsername!: string;
  usernameToGrant!: string;
  usernameToRevoke!: string;
  userIdToGet!: string;
  userIdToDelete!: string;
  usernameToDelete!: string;
  expVersion!: number;
  stateName!: string;
  numAnswers!: number;
  expId!: string;
  topicIdForRegeneratingOpportunities!: string;
  expIdToRollback!: string;
  blogPostId!: string;
  authorUsername!: string;
  publishedOn!: string;
  showDataExtractionQueryStatus: boolean = false;
  MAX_USERNAME_LENGTH: number = AppConstants.MAX_USERNAME_LENGTH;
  message: string = '';
  expIdToGetInteractionIdsFor!: string;
  explorationInteractionIds: string[] = [];
  voiceoverAutogenerationIsEnabled!: boolean;

  constructor(
    private adminBackendApiService: AdminBackendApiService,
    private adminTaskManagerService: AdminTaskManagerService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.adminBackendApiService
      .getAdminConfigForAutomaticVoiceoversAsync()
      .then(voiceoverAutogenerationIsEnabled => {
        this.voiceoverAutogenerationIsEnabled =
          voiceoverAutogenerationIsEnabled;
      });
  }

  clearSearchIndex(): void {
    if (
      this.adminTaskManagerService.isTaskRunning() ||
      !this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)
    ) {
      return;
    }

    this.setStatusMessage.emit('Clearing search index...');

    this.adminTaskManagerService.startTask();
    this.adminBackendApiService.clearSearchIndexAsync().then(
      () => {
        this.setStatusMessage.emit('Index successfully cleared.');
        this.adminTaskManagerService.finishTask();
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
        this.adminTaskManagerService.finishTask();
      }
    );
  }

  regenerateOpportunitiesRelatedToTopic(): void {
    if (
      this.adminTaskManagerService.isTaskRunning() ||
      !this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)
    ) {
      return;
    }
    this.setStatusMessage.emit('Regenerating opportunities...');
    this.adminBackendApiService
      .regenerateOpportunitiesRelatedToTopicAsync(
        this.topicIdForRegeneratingOpportunities
      )
      .then(
        response => {
          this.setStatusMessage.emit(
            'No. of opportunities model created: ' +
              response.opportunities_count
          );
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  rollbackExploration(): void {
    if (
      this.adminTaskManagerService.isTaskRunning() ||
      !this.windowRef.nativeWindow.confirm(this.irreversibleActionMessage)
    ) {
      return;
    }
    this.setStatusMessage.emit(
      `Rollingback exploration ${this.expIdToRollback}...`
    );
    this.adminBackendApiService
      .rollbackExplorationToSafeState(this.expIdToRollback)
      .then(
        response => {
          this.setStatusMessage.emit(
            'Exploration rolledback to version: ' + response
          );
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  uploadTopicSimilaritiesFile(): void {
    // 'getElementById' can return null if the element provided as
    // an argument is invalid.
    let element = document.getElementById(
      'topicSimilaritiesFile'
    ) as HTMLInputElement;
    if (element === null) {
      throw new Error('No element with id topicSimilaritiesFile found.');
    }
    if (element.files === null) {
      throw new Error('No files found.');
    }
    let file = element.files[0];
    let reader = new FileReader();
    reader.onload = e => {
      let data = (e.target as FileReader).result;
      this.adminBackendApiService
        .uploadTopicSimilaritiesAsync(data as string)
        .then(
          () => {
            this.setStatusMessage.emit(
              'Topic similarities uploaded successfully.'
            );
          },
          errorResponse => {
            this.setStatusMessage.emit('Server error: ' + errorResponse);
          }
        );
    };
    reader.readAsText(file);
  }

  downloadTopicSimilaritiesFile(): void {
    this.windowRef.nativeWindow.location.href =
      AdminPageConstants.ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
  }

  setDataExtractionQueryStatusMessage(message: string): void {
    this.showDataExtractionQueryStatus = true;
    this.dataExtractionQueryStatusMessage = message;
  }

  sendDummyMailToAdmin(): void {
    this.adminBackendApiService.sendDummyMailToAdminAsync().then(
      () => {
        this.setStatusMessage.emit('Success! Mail sent to admin.');
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
    );
  }

  updateUsername(): void {
    this.setStatusMessage.emit('Updating username...');
    this.adminBackendApiService
      .updateUserNameAsync(this.oldUsername, this.newUsername)
      .then(
        () => {
          this.setStatusMessage.emit(
            'Successfully renamed ' +
              this.oldUsername +
              ' to ' +
              this.newUsername +
              '!'
          );
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  updateBlogPostData(): void {
    this.setStatusMessage.emit('Updating blog post data...');
    this.adminBackendApiService
      .updateBlogPostDataAsync(
        this.blogPostId,
        this.authorUsername,
        this.publishedOn
      )
      .then(
        () => {
          this.setStatusMessage.emit('Successfully updated blog post data');
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  regenerateTopicSummaries(): void {
    this.setStatusMessage.emit('Regenerating all topic summaries...');
    this.adminBackendApiService.regenerateTopicSummariesAsync().then(
      () => {
        this.setStatusMessage.emit(
          'Successfully regenerated all topic summaries.'
        );
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
    );
  }

  getNumberOfPendingDeletionRequestModels(): void {
    this.setStatusMessage.emit(
      'Getting the number of users that are being deleted...'
    );
    this.adminBackendApiService.getNumberOfPendingDeletionRequestAsync().then(
      pendingDeletionRequests => {
        this.setStatusMessage.emit(
          'The number of users that are being deleted is: ' +
            pendingDeletionRequests.number_of_pending_deletion_models
        );
      },
      errorResponse => {
        this.setStatusMessage.emit('Server error: ' + errorResponse);
      }
    );
  }

  grantSuperAdminPrivileges(): void {
    this.setStatusMessage.emit('Communicating with Firebase server...');
    this.adminBackendApiService
      .grantSuperAdminPrivilegesAsync(this.usernameToGrant)
      .then(
        () => {
          this.setStatusMessage.emit('Success!');
        },
        errorResponse => {
          this.setStatusMessage.emit(
            'Server error: ' + errorResponse.error.error
          );
        }
      );
  }

  revokeSuperAdminPrivileges(): void {
    this.setStatusMessage.emit('Communicating with Firebase server...');
    this.adminBackendApiService
      .revokeSuperAdminPrivilegesAsync(this.usernameToRevoke)
      .then(
        () => {
          this.setStatusMessage.emit('Success!');
        },
        errorResponse => {
          this.setStatusMessage.emit(
            'Server error: ' + errorResponse.error.error
          );
        }
      );
  }

  updateAutomaticVoiceoverSynthesisUsingAzure(): void {
    this.setStatusMessage.emit('Communicating with Firebase server...');
    this.adminBackendApiService
      .updateAutomaticVoiceoverSynthesisConfigAsync(
        this.voiceoverAutogenerationIsEnabled
      )
      .then(
        () => {
          this.setStatusMessage.emit('Success!');
        },
        errorResponse => {
          this.setStatusMessage.emit(
            'Server error: ' + errorResponse.error.error
          );
        }
      );
  }

  getModelsRelatedToUser(): void {
    this.setStatusMessage.emit('Getting the models related to user...');
    this.adminBackendApiService
      .getModelsRelatedToUserAsync(this.userIdToGet)
      .then(
        isModal => {
          if (isModal) {
            this.setStatusMessage.emit(
              'Some related models exist, see logs ' +
                'to find out the exact models'
            );
          } else {
            this.setStatusMessage.emit('No related models exist');
          }
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  deleteUser(): void {
    this.setStatusMessage.emit('Starting the deletion of the user...');
    this.adminBackendApiService
      .deleteUserAsync(this.userIdToDelete, this.usernameToDelete)
      .then(
        () => {
          this.setStatusMessage.emit('The deletion process was started.');
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  submitQuery(): void {
    let STATUS_PENDING =
      'Data extraction query has been submitted. Please wait.';

    this.setDataExtractionQueryStatusMessage(STATUS_PENDING);

    let downloadUrl = this.DATA_EXTRACTION_QUERY_HANDLER_URL + '?';

    downloadUrl += 'exp_id=' + encodeURIComponent(this.expId);
    downloadUrl += '&exp_version=' + encodeURIComponent(this.expVersion);
    downloadUrl += '&state_name=' + encodeURIComponent(this.stateName);
    downloadUrl += '&num_answers=' + encodeURIComponent(this.numAnswers);

    this.windowRef.nativeWindow.open(downloadUrl);
  }

  retrieveExplorationInteractionIds(): void {
    this.explorationInteractionIds = [];
    this.setStatusMessage.emit('Retrieving interactions in exploration ...');
    this.adminBackendApiService
      .retrieveExplorationInteractionIdsAsync(this.expIdToGetInteractionIdsFor)
      .then(
        response => {
          if (response.interaction_ids.length > 0) {
            this.setStatusMessage.emit(
              'Successfully fetched interactionIds in exploration.'
            );
            this.explorationInteractionIds = response.interaction_ids;
          } else {
            this.setStatusMessage.emit(
              'No interactionIds found in exploration.'
            );
          }
        },
        errorResponse => {
          this.setStatusMessage.emit('Server error: ' + errorResponse);
        }
      );
  }

  resetForm(): void {
    this.expId = '';
    this.expVersion = 0;
    this.stateName = '';
    this.numAnswers = 0;
    this.showDataExtractionQueryStatus = false;
  }
}
