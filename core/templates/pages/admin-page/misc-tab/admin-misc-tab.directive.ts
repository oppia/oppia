// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the miscellaneous tab in the admin panel.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('services/image-upload-helper.service.ts');
require('services/alerts.service.ts');
require('services/contextual/logger.service');
require('mathjaxConfig.ts');
require('constants.ts');
require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminMiscTab', [
  '$http', '$window', 'AdminDataService',
  'AdminTaskManagerService', 'AlertsService', 'ImageUploadHelperService',
  'LoggerService', 'UrlInterpolationService', 'ADMIN_HANDLER_URL',
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', 'MAX_USERNAME_LENGTH',
  function(
      $http, $window, AdminDataService,
      AdminTaskManagerService, AlertsService, ImageUploadHelperService,
      LoggerService, UrlInterpolationService, ADMIN_HANDLER_URL,
      ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL, MAX_USERNAME_LENGTH) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/misc-tab/admin-misc-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        var DATA_EXTRACTION_QUERY_HANDLER_URL = (
          '/explorationdataextractionhandler');
        var SEND_DUMMY_MAIL_HANDLER_URL = (
          '/senddummymailtoadminhandler');
        var FLUSH_MEMORY_CACHE_URL = '/refreshmemorycache';
        var UPDATE_USERNAME_HANDLER_URL = '/updateusernamehandler';
        var EXPLORATIONS_LATEX_SVG_HANDLER = '/explorationslatexsvghandler';
        var irreversibleActionMessage = (
          'This action is irreversible. Are you sure?');

        ctrl.MAX_USERNAME_LENGTH = MAX_USERNAME_LENGTH;

        ctrl.clearSearchIndex = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }

          ctrl.setStatusMessage('Clearing search index...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'clear_search_index'
          }).then(function() {
            ctrl.setStatusMessage('Index successfully cleared.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        ctrl.flushMigrationBotContributions = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }

          ctrl.setStatusMessage('Flushing migration bot contributions...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'flush_migration_bot_contribution_data'
          }).then(function() {
            ctrl.setStatusMessage(
              'Migration bot contributions successfully flushed.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        ctrl.regenerateOpportunitiesRelatedToTopic = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }
          ctrl.regenerationMessage = 'Regenerating opportunities...';
          $http.post(ADMIN_HANDLER_URL, {
            action: 'regenerate_topic_related_opportunities',
            topic_id: ctrl.topicIdForRegeneratingOpportunities
          }).then(function(response) {
            ctrl.regenerationMessage = (
              'No. of opportunities model created: ' +
              response.data.opportunities_count);
          }, function(errorResponse) {
            ctrl.regenerationMessage = (
              'Server error: ' + errorResponse.data.error);
          });
        };

        ctrl.uploadTopicSimilaritiesFile = function() {
          var file = (
            <HTMLInputElement>document.getElementById(
              'topicSimilaritiesFile')).files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var data = (<FileReader>e.target).result;
            $http.post(ADMIN_HANDLER_URL, {
              action: 'upload_topic_similarities',
              data: data
            }).then(function() {
              ctrl.setStatusMessage(
                'Topic similarities uploaded successfully.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
          };
          reader.readAsText(file);
        };

        ctrl.downloadTopicSimilaritiesFile = function() {
          $window.location.href = ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
        };

        var setDataExtractionQueryStatusMessage = function(message) {
          ctrl.showDataExtractionQueryStatus = true;
          ctrl.dataExtractionQueryStatusMessage = message;
        };


        ctrl.sendDummyMailToAdmin = function() {
          $http.post(SEND_DUMMY_MAIL_HANDLER_URL)
            .then(function(response) {
              ctrl.setStatusMessage('Success! Mail sent to admin.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.flushMemoryCache = function() {
          $http.post(FLUSH_MEMORY_CACHE_URL)
            .then(function(response) {
              ctrl.setStatusMessage('Success! Memory Cache Flushed.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.getMemoryCacheProfile = function() {
          $http.get(FLUSH_MEMORY_CACHE_URL)
            .then(function(response) {
              ctrl.result = {
                totalAllocatedInBytes: response.data.total_allocation,
                peakAllocatedInBytes: response.data.peak_allocation,
                totalKeysStored: response.data.total_keys_stored
              };
              ctrl.memoryCacheDataFetched = true;
              ctrl.setStatusMessage('Success!');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        // TODO(#10197): Upgrade to MathJax 3, after proper investigation
        // and testing. MathJax 3 provides a faster and more cleaner way to
        // convert a LaTeX string to an SVG.
        // TODO(#10045): Remove this function once all the math-rich text
        // components in explorations have a valid math SVG stored in the
        // datastore.
        var convertLatexToSvgFile = function(inputLatexString) {
          return new Promise((resolve, reject) => {
            var emptyDiv = document.createElement('div');
            var outputElement = angular.element(emptyDiv);
            // We need to append the element with a script tag so that Mathjax
            // can typeset and convert this element. The typesetting is not
            // possible if we don't add a script tag. The code below is similar
            // to how the math equations are rendered in the mathjaxBind
            // directive (see mathjax-bind.directive.ts).
            var $script = angular.element(
              '<script type="math/tex">'
            ).html(inputLatexString === undefined ? '' : inputLatexString);
            outputElement.html('');
            outputElement.append($script);
            // Naturally MathJax works asynchronously, but we can add processes
            // which we want to happen synchronously into the MathJax Hub Queue.
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, outputElement[0]]);
            MathJax.Hub.Queue(function() {
              var svgString = (
                outputElement[0].getElementsByTagName('svg')[0].outerHTML);
              var cleanedSvgString = (
                ImageUploadHelperService.cleanMathExpressionSvgString(
                  svgString));
              var dimensions = (
                ImageUploadHelperService.
                  extractDimensionsFromMathExpressionSvgString(
                    cleanedSvgString));
              // We need use unescape and encodeURIComponent in order to
              // handle the case when SVGs have non-ascii unicode characters.
              var dataURI = (
                'data:image/svg+xml;base64,' +
                btoa(unescape(encodeURIComponent(cleanedSvgString))));

              var invalidTagsAndAttributes = (
                ImageUploadHelperService.getInvalidSvgTagsAndAttrs(dataURI));
              var tags = invalidTagsAndAttributes.tags;
              var attrs = invalidTagsAndAttributes.attrs;
              if (tags.length === 0 && attrs.length === 0) {
                var resampledFile = (
                  ImageUploadHelperService.convertImageDataToImageFile(
                    dataURI));
                var date = new Date();
                var now = date.getTime();
                // This temporary Id will be used for adding and retrieving the
                // raw image for each LaTeX string from the request body. For
                // more details refer to the docstring in
                // sendMathSvgsToBackend() in AdminBackendApiService.
                var latexId = (
                  now.toString(36).substr(2, 6) +
                  Math.random().toString(36).substr(4));
                resolve ({
                  file: resampledFile,
                  dimensions: {
                    encoded_height_string: dimensions.height,
                    encoded_width_string: dimensions.width,
                    encoded_vertical_padding_string: dimensions.verticalPadding
                  },
                  latexId: latexId
                });
              } else {
                AlertsService.addWarning(
                  'SVG failed validation for LaTeX ' + inputLatexString);
                reject();
              }
            });
            // This will catch and log any error that occurs internally in
            // MathJax.
            MathJax.Hub.Register.MessageHook(
              'Math Processing Error', function(message) {
                LoggerService.error(message[2]);
                LoggerService.error('Cannot convert Latex:' + inputLatexString);
                reject();
              });
          });
        };

        var latexMapping;
        var expIdToLatexMapping = null;
        var numberOfLatexStrings = 0;

        // TODO(#10045): Remove this function once all the math-rich text
        // components in explorations have a valid math SVG stored in the
        // datastore.

        ctrl.fetchAndGenerateSvgsForExplorations = async function() {
          ctrl.generateSvgs = true;
          while (ctrl.generateSvgs) {
            if (ctrl.numberOfExplorationsLeftToUpdate === '0') {
              ctrl.setStatusMessage('SVGs generated for all explorations .');
              $scope.$apply();
              return;
            }
            var response = await $http.get(
              EXPLORATIONS_LATEX_SVG_HANDLER, {
                params: {
                  item_to_fetch: 'exp_id_to_latex_mapping'
                }
              });
            var numberOfExplorationsFetched = 0;
            numberOfLatexStrings = 0;
            expIdToLatexMapping = (
              response.data.latex_strings_to_exp_id_mapping);
            for (var expId in expIdToLatexMapping) {
              numberOfExplorationsFetched++;
              numberOfLatexStrings += Object.keys(
                expIdToLatexMapping[expId]).length;
            }
            ctrl.setStatusMessage(
              numberOfLatexStrings.toString() +
              ' LaTeX strings fetched from backend for ' +
              numberOfExplorationsFetched.toString() + ' explorations.' +
              ' Generating SVGs.....');
            $scope.$apply();

            var countOfSvgsGenerated = 0;
            latexMapping = {};
            for (var expId in expIdToLatexMapping) {
              var latexStrings = expIdToLatexMapping[expId];
              latexMapping[expId] = {};
              for (var i = 0; i < latexStrings.length; i++) {
                LoggerService.info(
                  'Trying to generate SVG for Latex: ' +
                  latexStrings[i] + '  Exploration: ' + expId );
                var svgFile = await convertLatexToSvgFile(latexStrings[i]);
                countOfSvgsGenerated++;
                LoggerService.info(
                  'generated ' + countOfSvgsGenerated.toString() + ' SVGs' +
                  ' out of ' + numberOfLatexStrings.toString());
                latexMapping[expId][latexStrings[i]] = svgFile;
              }
            }
            ctrl.setStatusMessage(
              'SVGs generated for ' + countOfSvgsGenerated.toString() +
              ' LaTeX strings. Saving to backend ....');
            $scope.$apply();
            if (!ctrl.generateSvgs) {
              ctrl.setStatusMessage('Aborting...');
              $scope.$apply();
              return;
            }
            try {
              var saveResponse = (
                await AdminDataService.sendMathSvgsToBackendAsync(
                  latexMapping));
            } catch (e) {
              ctrl.setStatusMessage(
                'Server error:' + e.error.error);
              $scope.$apply();
              return;
            }
            var numberOfExplorationsUpdated = (
              saveResponse.number_of_explorations_updated);
            ctrl.numberOfExplorationsLeftToUpdate = (
              saveResponse.number_of_explorations_left_to_update);
            $scope.$apply();
            ctrl.setStatusMessage(
              'Successfully updated ' + numberOfExplorationsUpdated +
              ' explorations, ' + ctrl.numberOfExplorationsLeftToUpdate +
              ' left');
            $scope.$apply();
          }
        };
        // TODO(#10045): Remove this function once all the math-rich text
        // components in explorations have a valid math SVG stored in the
        // datastore.

        ctrl.stopGeneration = function() {
          ctrl.generateSvgs = false;
        };

        ctrl.updateUsername = function() {
          ctrl.setStatusMessage('Updating username...');
          $http.put(
            UPDATE_USERNAME_HANDLER_URL, {
              old_username: ctrl.oldUsername,
              new_username: ctrl.newUsername
            }).then(
            function(response) {
              ctrl.setStatusMessage(
                'Successfully renamed ' + ctrl.oldUsername + ' to ' +
                  ctrl.newUsername + '!');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            }
          );
        };

        ctrl.submitQuery = function() {
          var STATUS_PENDING = (
            'Data extraction query has been submitted. Please wait.');
          var STATUS_FINISHED = 'Loading the extracted data ...';
          var STATUS_FAILED = 'Error, ';

          setDataExtractionQueryStatusMessage(STATUS_PENDING);

          var downloadUrl = DATA_EXTRACTION_QUERY_HANDLER_URL + '?';

          downloadUrl += 'exp_id=' + encodeURIComponent(ctrl.expId);
          downloadUrl += '&exp_version=' + encodeURIComponent(
            ctrl.expVersion);
          downloadUrl += '&state_name=' + encodeURIComponent(
            ctrl.stateName);
          downloadUrl += '&num_answers=' + encodeURIComponent(
            ctrl.numAnswers);

          $window.open(downloadUrl);
        };

        ctrl.resetForm = function() {
          ctrl.expId = '';
          ctrl.expVersion = 0;
          ctrl.stateName = '';
          ctrl.numAnswers = 0;
          ctrl.showDataExtractionQueryStatus = false;
        };
        ctrl.$onInit = function() {
          ctrl.numberOfExplorationsLeftToUpdate;
          $http.get(
            EXPLORATIONS_LATEX_SVG_HANDLER, {
              params: {
                item_to_fetch: 'number_of_explorations_left_to_update'
              }
            }).then(function(response) {
            ctrl.numberOfExplorationsLeftToUpdate = (
              response.data.number_of_explorations_left_to_update);
          });

          ctrl.generateSvgs = true;
          ctrl.topicIdForRegeneratingOpportunities = null;
          ctrl.regenerationMessage = null;
          ctrl.oldUsername = null;
          ctrl.newUsername = null;
        };
      }]
    };
  }
]);
