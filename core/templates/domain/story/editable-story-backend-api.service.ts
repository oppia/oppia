// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to send changes to a story to the backend.
 */

// changes made for #8472
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { StoryDomainConstants } from 'domain/story/story-domain.constants';
import cloneDeep from 'lodash/cloneDeep';


@Injectable({
  providedIn: 'root'
})


export class EditableStoryBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService) {}
  private storyDataDict = null;
  private _fetchStory(
      storyId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: Object | Promise<Object>) => void): void {
    var editableStoryDataUrl = this.urlInterpolation.interpolateUrl(
      StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE, {
        story_id: storyId
      });
    this.http.get(
      editableStoryDataUrl, { observe: 'response'}).toPromise().then(
      (response) => {
        this.storyDataDict = cloneDeep(response.body);
        if (successCallback) {
          successCallback(this.storyDataDict);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error
          );
        }
      });
  }
    private _updateStory = function(
        storyId: string, storyVersion: string,
        commitMessage: string,
        changeList: string[],
        successCallback: (value?: Object | PromiseLike<Object>) =>void,
        errorCallback: (reason?: Object | PromiseLike<Object>) => void): void {
      var editableStoryDataUrl = this.urlInterpolation.interpolateUrl(
        StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE, {
          story_id: storyId
        });
      var putData = {
        version: storyVersion,
        commit_message: commitMessage,
        change_dicts: changeList
      };
      this.http.put(
        editableStoryDataUrl, putData).toPromise().then(
        (response) => {
          var story = cloneDeep( response.story );
          if ( successCallback ) {
            successCallback( story );
          }
        }, function( errorResponse ) {
          if ( errorCallback ) {
            errorCallback( errorResponse.error );
          }
        });
    };
    private _changeStoryPublicationStatus = function(
        storyId: string,
        newStoryStatusIsPublic: boolean,
        successCallback: (value?: Object | PromiseLike<Object>) =>void,
        errorCallback: (reason?: Object | PromiseLike<Object>) => void): void {
      var storyPublishUrl = this.urlInterpolation.interpolateUrl(
        StoryDomainConstants.STORY_PUBLISH_URL_TEMPLATE, {
          story_id: storyId
        });
      var putData = {
        new_story_status_is_public: newStoryStatusIsPublic
      };
      this.http.put(
        storyPublishUrl, putData).toPromise().then(
        (response) => {
          if (successCallback) {
            successCallback(response.status);
          }
        }, function(errorResponse) {
          if (errorCallback) {
            errorCallback(errorResponse.error);
          }
        });
    };


    private _validateExplorations = function(
        storyId: string,
        expIds: string[],
        successCallback: (value?: Object | PromiseLike<Object>) =>void,
        errorCallback: (reason?: Object | PromiseLike<Object>) => void): void {
      var validateExplorationsUrl = this.urlInterpolation.interpolateUrl(
        StoryDomainConstants.VALIDATE_EXPLORATIONS_URL_TEMPLATE, {
          story_id: storyId
        });

      this.http.get(
        validateExplorationsUrl, {
          params: {
            comma_separated_exp_ids: expIds.join(',')
          }
        })
        .toPromise().then(
          (response) => {
            if (successCallback) {
              successCallback(response.status);
            }
          }, function(errorResponse) {
            if (errorCallback) {
              errorCallback(errorResponse.error);
            }
          });
    };


    private _deleteStory = function(
        storyId: string,
        successCallback: (value?: Object | PromiseLike<Object>) =>void,
        errorCallback: (reason?: Object | PromiseLike<Object>) => void): void {
      var storyDataUrl = this.urlInterpolation.interpolateUrl(
        StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE, {
          story_id: storyId
        });
      this.http.request('delete',
        storyDataUrl).toPromise().then(
        (response) => {
          if (successCallback) {
            successCallback(response.status);
          }
        }, function(errorResponse) {
          if (errorCallback) {
            errorCallback(errorResponse.error);
          }
        });
    };
    //  return {
    fetchStory(storyId: string): Promise<object> {
      return new Promise((resolve, reject) => {
        this._fetchStory(storyId, resolve, reject);
      });
    }
    /**
       * Updates a story in the backend with the provided story ID.
       * The changes only apply to the story of the given version and the
       * request to update the story will fail if the provided story
       * version is older than the current version stored in the backend. Both
       * the changes and the message to associate with those changes are used
       * to commit a change to the story. The new story is passed to
       * the success callback, if one is provided to the returned promise
       * object. Errors are passed to the error callback, if one is provided.
       */
    updateStory(storyId: string, storyVersion: string,
        commitMessage: string,
        changeList: string[]):
      Promise<object> {
      return new Promise((resolve, reject) => {
        this._updateStory(
          storyId, storyVersion, commitMessage, changeList,
          resolve, reject);
      });
    }
    changeStoryPublicationStatus(storyId: string,
        newStoryStatusIsPublic: boolean):
    Promise<object> {
      return new Promise((resolve, reject) => {
        this._changeStoryPublicationStatus(
          storyId, newStoryStatusIsPublic, resolve, reject);
      });
    }
    validateExplorations(storyId: string, expIds: string[]): Promise<object> {
      return new Promise((resolve, reject) => {
        this._validateExplorations(
          storyId, expIds, resolve, reject);
      });
    }
    deleteStory(storyId: string): Promise<object> {
      return new Promise((resolve, reject) => {
        this._deleteStory(storyId, resolve, reject);
      });
    }
}
angular.module('oppia').factory(
  'EditableStoryBackendApiService', downgradeInjectable(
    EditableStoryBackendApiService));



// ends here-----------------------------------------------



