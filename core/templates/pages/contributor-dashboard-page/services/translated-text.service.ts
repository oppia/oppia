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
 * @fileoverview A service for getting the completed translations from backend
 * 
 */

 export class StateAndContent {
    constructor(
      private _stateName: string,
      private _contentID: string,
      private _contentText: string) {}
  
    get stateName(): string {
      return this._stateName;
    }
  
    set stateName(newStateName: string) {
      this._stateName = newStateName;
    }
  
    get contentID(): string {
      return this._contentID;
    }
  
    set contentID(newContentID: string) {
      this._contentID = newContentID;
    }
  
    get contentText(): string {
      return this._contentText;
    }
  
    set contentText(newContentText: string) {
      this._contentText = newContentText;
    }
  }
  
  angular.module('oppia').factory('TranslatedTextService', [
    '$http', function($http) {
      const STARTING_INDEX = -1;
      var stateWiseContents = null;
      var stateWiseContentIds = {};
      var stateAndContent = [];
      var stateNamesList = [];
      var activeExpId = null;
      var activeExpVersion = null;
      var activeIndex = STARTING_INDEX;
      var activeStateName = null;
      var activeContentId = null;
      var activeContentText = null;
      var recievedTranslationsList = [];
      var recievedContentList = [];
      
      const getTranslationsList = function(){
        return recievedTranslationsList;
      }

      const getContentList = function(){
        return recievedContentList;
      }
  
      return {
        init: function(expId, languageCode, successCallback) {
          stateWiseContents = null;
          stateWiseContentIds = {};
          stateNamesList = [];
          stateAndContent = [];
          activeIndex = STARTING_INDEX;
  
          activeExpId = expId;
          activeExpVersion = null;
  
          $http.get('/gettranslatedtexthandler', {
            params: {
              exp_id: expId,
              language_code: languageCode
            }
          }).then(function(response) {
            recievedTranslationsList = response.data.translations_list;
            recievedContentList = response.data.content_list;
            successCallback();
            console.log("Successfully made the http request");
            console.log(recievedContentList);
            console.log(recievedTranslationsList);
          });
          // recievedContentList = ['<p>Content 1</p>', '<p>Content 2</p>'];
          // recievedTranslationsList = ['<p>Translation 1</p>', '<p>Translation 2</p>'];
          // successCallback();
        },
        getTranslatedText: function() {
          return {
            translationsList: getTranslationsList(),
            contentList: getContentList()
          };
        }
      };
    }]);
  