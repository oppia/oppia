// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for showing and reviewing contributions.
 */
require(
  'pages/community-dashboard-page/login-required-message/' +
  'login-required-message.directive.ts');

require(
  'pages/community-dashboard-page/services/' +
  'contribution-and-review.services.ts');
require('services/audio-player.service.ts');
require('services/suggestion-modal.service.ts');

require('filters/format-rte-preview.filter.ts');

angular.module('oppia').directive('contributionsAndReview', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/community-dashboard-page/contributions-and-review/' +
        'contributions-and-review.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$filter', '$uibModal', 'AudioPlayerService',
        'ContributionAndReviewService', 'LanguageUtilService', 'UserService',
        function(
            $filter, $uibModal, AudioPlayerService,
            ContributionAndReviewService, LanguageUtilService, UserService) {
          var SUGGESTION_LABELS = {
            review: {
              text: 'Awaiting review',
              color: '#eeeeee'
            },
            accepted: {
              text: 'Accepted',
              color: '#8ed274'
            },
            rejected: {
              text: 'Rejected',
              color: '#e76c8c'
            }
          };
          var activeTabItem = null;
          var username = null;
          var TRANSLATIONS_SUGGESTION_ITEM = 'Translations Suggestion';
          var VOICEOVER_APPLICATIONS_ITEM = 'Voiceover Applications';
          var itemsList = [
            TRANSLATIONS_SUGGESTION_ITEM, VOICEOVER_APPLICATIONS_ITEM];
          var itemsData = {};

          var ctrl = this;
          ctrl.activeTabName = null;
          ctrl.THINGS_TO_DO = 'THINGS_TO_DO';
          ctrl.CONTRIBUTION_TABS = 'CONTRIBUTION_TABS';
          ctrl.tabsName = {};
          ctrl.tabsName[ctrl.THINGS_TO_DO] = itemsList;
          ctrl.tabsName[ctrl.CONTRIBUTION_TABS] = itemsList;
          ctrl.isAdmin = false;
          ctrl.userDeatilsLoading = true;
          ctrl.userIsLoggedIn = false;
          ctrl.itemList = [];

          ctrl.isActiveTab = function(tabName, item) {
            return ctrl.activeTabName === tabName && activeTabItem === item;
          };
          var activeTabTofetcherFunction = {
            [ctrl.CONTRIBUTION_TABS]: {
              [TRANSLATIONS_SUGGESTION_ITEM]: (
                ContributionAndReviewService
                  .getUserCreatedTranslationSuggestions),
              [VOICEOVER_APPLICATIONS_ITEM]: (
                ContributionAndReviewService
                  .getUserSubmittedVoiceoverApplications)
            },
            [ctrl.THINGS_TO_DO]: {
              [TRANSLATIONS_SUGGESTION_ITEM]: (
                ContributionAndReviewService
                  .getReviewableTranslationSuggestions),
              [VOICEOVER_APPLICATIONS_ITEM]: (
                ContributionAndReviewService
                  .getReviewableVoiceoverApplications)
            }
          };

          ctrl.switchTab = function(tabName, item) {
            activeTabItem = item;
            ctrl.activeTabName = tabName;
            ctrl.itemList = [];
            activeTabTofetcherFunction[tabName][item](populateTabData);
          };


          var getTranslationSuggestionsPresentationData = function(data) {
            itemsData = data;
            var translationContributionsSummaryList = [];
            Object.keys(data).forEach(function(key) {
              var suggestion = data[key].suggestion;
              var details = data[key].details;
              var change = suggestion.change;
              var requiredData = {
                id: suggestion.suggestion_id,
                heading: $filter('formatRtePreview')(change.translation_html),
                subheading: (details.topic_name + ' / ' + details.story_title +
                  ' / ' + details.chapter_title),
                labelText: SUGGESTION_LABELS[suggestion.status].text,
                labelColor: SUGGESTION_LABELS[suggestion.status].color,
                actionButtonTitle: (
                  ctrl.activeTabName === ctrl.THINGS_TO_DO ? 'Review' : 'View')
              };
              translationContributionsSummaryList.push(requiredData);
            });
            return translationContributionsSummaryList;
          };

          var getVoiceoverApplicationsPresentationData = function(data) {
            itemsData = data;
            var voiceoverApplications = [];
            var buttonTitle = (
              ctrl.activeTabName === ctrl.THINGS_TO_DO ? 'Review' : 'View');
            Object.keys(data).forEach(function(key) {
              var voiceoverApplication = data[key];
              if (voiceoverApplication.status === 'accepted') {
                buttonTitle = 'Voiceover';
              }
              var requiredData = {
                id: voiceoverApplication.voiceover_application_id,
                heading: $filter('formatRtePreview')(
                  voiceoverApplication.content),
                subheading: 'Language ' + (
                  LanguageUtilService.getAudioLanguageDescription(
                    voiceoverApplication.language_code)),
                labelText: SUGGESTION_LABELS[voiceoverApplication.status].text,
                labelColor: (
                  SUGGESTION_LABELS[voiceoverApplication.status].color),
                actionButtonTitle: buttonTitle
              };
              voiceoverApplications.push(requiredData);
            });
            return voiceoverApplications;
          };
          var populateTabData = function(data) {
            if (activeTabItem === TRANSLATIONS_SUGGESTION_ITEM) {
              ctrl.itemList = getTranslationSuggestionsPresentationData(data);
            } else if (activeTabItem === VOICEOVER_APPLICATIONS_ITEM) {
              ctrl.itemList = getVoiceoverApplicationsPresentationData(data);
            }
          };

          var removeContributionToReview = function(itemId) {
            ctrl.itemList = (
              ctrl.itemList.filter(function(item) {
                if (item.id === itemId) {
                  return false;
                }
                return true;
              }));
          };

          var _showTranslationSuggestionModal = function(
              targetId, suggestionId, contentHtml, translationHtml,
              reviewable) {
            var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/community-dashboard-page/modal-templates/' +
              'translation-suggestion-review.directive.html');

            $uibModal.open({
              templateUrl: _templateUrl,
              backdrop: true,
              size: 'lg',
              resolve: {
                translationHtml: function() {
                  return translationHtml;
                },
                contentHtml: function() {
                  return contentHtml;
                },
                reviewable: function() {
                  return reviewable;
                }
              },
              controller: [
                '$scope', '$uibModalInstance', 'SuggestionModalService',
                'reviewable', 'translationHtml', 'contentHtml',
                function($scope, $uibModalInstance, SuggestionModalService,
                    reviewable, translationHtml, contentHtml) {
                  $scope.translationHtml = translationHtml;
                  $scope.contentHtml = contentHtml;
                  $scope.reviewable = reviewable;
                  $scope.commitMessage = '';
                  $scope.reviewMessage = '';

                  $scope.accept = function() {
                    SuggestionModalService.acceptSuggestion(
                      $uibModalInstance,
                      {
                        action: SuggestionModalService.ACTION_ACCEPT_SUGGESTION,
                        commitMessage: $scope.commitMessage,
                        reviewMessage: $scope.reviewMessage
                      });
                  };

                  $scope.reject = function() {
                    SuggestionModalService.rejectSuggestion(
                      $uibModalInstance,
                      {
                        action: SuggestionModalService.ACTION_REJECT_SUGGESTION,
                        reviewMessage: $scope.reviewMessage
                      });
                  };
                  $scope.cancel = function() {
                    SuggestionModalService.cancelSuggestion($uibModalInstance);
                  };
                }
              ]
            }).result.then(function(result) {
              ContributionAndReviewService.resolveSuggestion(
                targetId, suggestionId, result.action, result.reviewMessage,
                result.commitMessage, removeContributionToReview);
            });
          };

          var _showVoiceoverApplicationModal = function(voiceoverApplication) {
            if (voiceoverApplication.status === 'accepted') {
              var url = (
                'http://localhost:8181/create/' +
                voiceoverApplication.target_id + '#/translation');
              var win = window.open(url, '_blank');
              win.focus();
              return;
            }
            var contentHtml = voiceoverApplication.content;
            var audioFilename = voiceoverApplication.filename;
            var targetId = voiceoverApplication.target_id;
            var voiceoverApplicationId = (
              voiceoverApplication.voiceover_application_id);
            var reviewable = ctrl.activeTabName === ctrl.THINGS_TO_DO;
            var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/community-dashboard-page/modal-templates/' +
              'voiceover-application-review-modal.directive.html');

            $uibModal.open({
              templateUrl: _templateUrl,
              backdrop: true,
              size: 'lg',
              resolve: {
                audioFilename: function() {
                  return audioFilename;
                },
                contentHtml: function() {
                  return contentHtml;
                },
                reviewable: function() {
                  return reviewable;
                },
                targetId: function() {
                  return targetId;
                }
              },
              controller: [
                '$scope', '$uibModalInstance', 'AudioPlayerService',
                'SuggestionModalService',
                'reviewable', 'audioFilename', 'contentHtml', 'targetId',
                function($scope, $uibModalInstance, AudioPlayerService,
                    SuggestionModalService,
                    reviewable, audioFilename, contentHtml, targetId) {
                  $scope.audioFilename = audioFilename;
                  $scope.contentHtml = contentHtml;
                  $scope.reviewable = reviewable;
                  $scope.reviewMessage = '';
                  $scope.audioLoadingIndicatorIsShown = true;
                  AudioPlayerService.load(
                    'voiceover_application', targetId, audioFilename)
                    .then(function(argument) {
                      $scope.audioLoadingIndicatorIsShown = false;
                    });
                  $scope.track = {
                    progress: function(progressPercentage) {
                      if (angular.isDefined(progressPercentage)) {
                        AudioPlayerService.setProgress(
                          progressPercentage / 100);
                      }
                      return AudioPlayerService.getProgress() * 100;
                    }
                  };
                  $scope.playPauseVoiceover = function() {
                    if (!AudioPlayerService.isPlaying()) {
                      if (AudioPlayerService.isTrackLoaded()) {
                        AudioPlayerService.play();
                      } else {
                        loadAndPlayAudioTranslation();
                      }
                    } else {
                      AudioPlayerService.pause();
                    }
                  };

                  $scope.accept = function() {
                    SuggestionModalService.acceptSuggestion(
                      $uibModalInstance, {
                        action: SuggestionModalService.ACTION_ACCEPT_SUGGESTION,
                        reviewMessage: null
                      });
                  };

                  $scope.reject = function() {
                    SuggestionModalService.rejectSuggestion(
                      $uibModalInstance, {
                        action: SuggestionModalService.ACTION_REJECT_SUGGESTION,
                        reviewMessage: $scope.reviewMessage
                      });
                  };
                  $scope.cancel = function() {
                    SuggestionModalService.cancelSuggestion($uibModalInstance);
                  };
                }
              ]
            }).result.then(function(result) {
              ContributionAndReviewService.resolveVoiceoverApplication(
                voiceoverApplicationId, result.action, result.reviewMessage,
                result.commitMessage, removeContributionToReview);
            }, function() {
              AudioPlayerService.clear();
            });
          };

          ctrl.onClickActionButton = function(itemId) {
            if (activeTabItem === TRANSLATIONS_SUGGESTION_ITEM) {
              var suggestion = itemsData[itemId].suggestion;
              _showTranslationSuggestionModal(
                suggestion.target_id, suggestion.suggestion_id,
                suggestion.change.content_html,
                suggestion.change.translation_html, ctrl.reviewTabActive);
            } else if (activeTabItem === VOICEOVER_APPLICATIONS_ITEM) {
              var voiceoverApplication = itemsData[itemId];
              _showVoiceoverApplicationModal(voiceoverApplication);
            }
          };


          UserService.getUserInfoAsync().then(function(userInfo) {
            ctrl.isAdmin = userInfo.isAdmin();
            ctrl.userIsLoggedIn = userInfo.isLoggedIn();
            ctrl.userDeatilsLoading = false;
            username = userInfo.getUsername();
            if (ctrl.isAdmin) {
              ctrl.switchTab(ctrl.THINGS_TO_DO, TRANSLATIONS_SUGGESTION_ITEM);
            } else if (ctrl.userIsLoggedIn) {
              ctrl.switchTab(
                ctrl.CONTRIBUTION_TABS, TRANSLATIONS_SUGGESTION_ITEM);
            }
          });
        }
      ]
    };
  }]);
