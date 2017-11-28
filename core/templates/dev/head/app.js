// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Initialization and basic configuration for the Oppia module.
 */
// TODO(sll): Remove the check for window.GLOBALS. This check is currently
// only there so that the Karma tests run, since it looks like Karma doesn't
// 'see' the GLOBALS variable that is defined in base.html. We should fix this
// in order to make the testing and production environments match.
var oppia = angular.module(
  'oppia', [
    'ngMaterial', 'ngAnimate', 'ngAudio', 'ngSanitize', 'ngTouch', 'ngResource',
    'ui.bootstrap', 'ui.sortable', 'infinite-scroll', 'ngJoyRide', 'ngImgCrop',
    'ui.validate', 'textAngular', 'pascalprecht.translate', 'ngCookies',
    'toastr'
  ].concat(
    window.GLOBALS ? (window.GLOBALS.ADDITIONAL_ANGULAR_MODULES || []) : []));

for (var constantName in constants) {
  oppia.constant(constantName, constants[constantName]);
}

oppia.constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', '/explorationsummarieshandler/data');

// We use a slash because this character is forbidden in a state name.
oppia.constant('PLACEHOLDER_OUTCOME_DEST', '/');
oppia.constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');
oppia.constant('RULE_TYPE_CLASSIFIER', 'FuzzyMatches');
oppia.constant('OBJECT_EDITOR_URL_PREFIX', '/object_editor_template/');
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
oppia.constant('ENABLE_ML_CLASSIFIERS', false);
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
oppia.constant('ENABLE_NEW_STATS_FRAMEWORK', false);
// Feature still in development.
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID',
  'The current solution does not lead to another card.');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_VALID',
  'The solution is now valid!');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
  'The current solution is no longer valid.');
oppia.constant('PARAMETER_TYPES', {
  REAL: 'Real',
  UNICODE_STRING: 'UnicodeString'
});
oppia.constant('ACTION_ACCEPT_SUGGESTION', 'accept');
oppia.constant('ACTION_REJECT_SUGGESTION', 'reject');

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', 15);

// If an $http request fails with the following error codes, a warning is
// displayed.
oppia.constant('FATAL_ERROR_CODES', [400, 401, 404, 500]);

oppia.constant('EVENT_ACTIVE_CARD_CHANGED', 'activeCardChanged');

oppia.constant('RTE_COMPONENT_SPECS', richTextComponents);

// Add RTE extensions to textAngular toolbar options.
oppia.config(['$provide', function($provide) {
  $provide.decorator('taOptions', [
    '$delegate', '$document', '$modal', '$timeout', 'FocusManagerService',
    'taRegisterTool', 'rteHelperService', 'AlertsService',
    'ExplorationContextService', 'PAGE_CONTEXT',
    'UrlInterpolationService',
    function(
      taOptions, $document, $modal, $timeout, FocusManagerService,
      taRegisterTool, rteHelperService, AlertsService,
      ExplorationContextService, PAGE_CONTEXT,
      UrlInterpolationService) {
      taOptions.disableSanitizer = true;
      taOptions.forceTextAngularSanitize = false;
      taOptions.classes.textEditor = 'form-control oppia-rte-content';
      taOptions.setup.textEditorSetup = function($element) {
        $timeout(function() {
          $element.trigger('focus');
        });
      };

      // The refocusFn arg is a function that restores focus to the text editor
      // after exiting the modal, and moves the cursor back to where it was
      // before the modal was opened.
      var _openCustomizationModal = function(
        customizationArgSpecs, attrsCustomizationArgsDict, onSubmitCallback,
        onDismissCallback, refocusFn) {
        $document[0].execCommand('enableObjectResizing', false, false);
        var modalDialog = $modal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/forms/customize_rte_component_modal_directive.html'),
          backdrop: 'static',
          resolve: {},
          controller: [
            '$scope', '$modalInstance', '$timeout',
            function($scope, $modalInstance, $timeout) {
              $scope.customizationArgSpecs = customizationArgSpecs;

              // Without this code, the focus will remain in the background RTE
              // even after the modal loads. This switches the focus to a
              // temporary field in the modal which is then removed from the
              // DOM.
              // TODO(sll): Make this switch to the first input field in the
              // modal instead.
              $scope.modalIsLoading = true;
              FocusManagerService.setFocus('tmpFocusPoint');
              $timeout(function() {
                $scope.modalIsLoading = false;
              });

              $scope.tmpCustomizationArgs = [];
              for (var i = 0; i < customizationArgSpecs.length; i++) {
                var caName = customizationArgSpecs[i].name;
                $scope.tmpCustomizationArgs.push({
                  name: caName,
                  value: (
                    attrsCustomizationArgsDict.hasOwnProperty(caName) ?
                      attrsCustomizationArgsDict[caName] :
                      customizationArgSpecs[i].default_value)
                });
              }

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };

              $scope.save = function() {
                $scope.$broadcast('externalSave');

                var customizationArgsDict = {};
                for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                  var caName = $scope.tmpCustomizationArgs[i].name;
                  customizationArgsDict[caName] = (
                    $scope.tmpCustomizationArgs[i].value);
                }

                $modalInstance.close(customizationArgsDict);
              };
            }
          ]
        });

        modalDialog.result.then(onSubmitCallback, onDismissCallback);
        // 'finally' is a JS keyword. If it is just used in its ".finally" form,
        // the minification process throws an error.
        modalDialog.result['finally'](refocusFn);
      };

      rteHelperService.getRichTextComponents().forEach(function(componentDefn) {
        var buttonDisplay = rteHelperService.createToolbarIcon(componentDefn);
        var canUseFs = ExplorationContextService.getPageContext() ===
          PAGE_CONTEXT.EDITOR;

        taRegisterTool(componentDefn.id, {
          display: buttonDisplay.outerHTML,
          tooltiptext: componentDefn.tooltip,
          disabled: function() {
            // Disable components that affect fs for non-editors.
            return !canUseFs && componentDefn.requiresFs;
          },
          onElementSelect: {
            element: 'img',
            filter: function(elt) {
              return elt.hasClass('oppia-noninteractive-' + componentDefn.id);
            },
            action: function(event, $element) {
              event.preventDefault();
              var textAngular = this;

              if (!canUseFs && componentDefn.requiresFs) {
                var FS_UNAUTHORIZED_WARNING = 'Unfortunately, only ' +
                  'exploration authors can make changes involving files.';
                AlertsService.addWarning(FS_UNAUTHORIZED_WARNING);
                // Without this, the view will not update to show the warning.
                textAngular.$editor().$parent.$apply();
                return;
              }

              // Move the cursor to be immediately after the clicked widget.
              // This prevents users from overwriting the widget.
              var elRange = rangy.createRange();
              elRange.setStartAfter($element.get(0));
              elRange.setEndAfter($element.get(0));
              var elSelection = rangy.getSelection();
              elSelection.removeAllRanges();
              elSelection.addRange(elRange);
              var savedSelection = rangy.saveSelection();

              // Temporarily pauses sanitizer so rangy markers save position
              textAngular.$editor().$parent.isCustomizationModalOpen = true;
              _openCustomizationModal(
                componentDefn.customizationArgSpecs,
                rteHelperService.createCustomizationArgDictFromAttrs(
                  $element[0].attributes),
                function(customizationArgsDict) {
                  var el = rteHelperService.createRteElement(
                    componentDefn, customizationArgsDict);
                  $element[0].parentNode.replaceChild(el, $element[0]);
                  textAngular.$editor().updateTaBindtaTextElement();
                },
                function() {},
                function() {
                  // Re-enables the sanitizer now that the modal is closed.
                  textAngular.$editor(
                  ).$parent.isCustomizationModalOpen = false;
                  textAngular.$editor().displayElements.text[0].focus();
                  rangy.restoreSelection(savedSelection);
                });
              return false;
            }
          },
          action: function() {
            var textAngular = this;
            var savedSelection = rangy.saveSelection();
            textAngular.$editor().wrapSelection(
              'insertHtml', '<span class="insertionPoint"></span>');

            // Temporarily pauses sanitizer so rangy markers save position.
            textAngular.$editor().$parent.isCustomizationModalOpen = true;
            _openCustomizationModal(
              componentDefn.customizationArgSpecs,
              {},
              function(customizationArgsDict) {
                var el = rteHelperService.createRteElement(
                  componentDefn, customizationArgsDict);
                var insertionPoint = (
                  textAngular.$editor().displayElements.text[0].querySelector(
                    '.insertionPoint'));
                var parent = insertionPoint.parentNode;
                parent.replaceChild(el, insertionPoint);
                textAngular.$editor().updateTaBindtaTextElement();
              },
              function() {
                // Clean up the insertion point if no widget was inserted.
                var insertionPoint = (
                  textAngular.$editor().displayElements.text[0].querySelector(
                    '.insertionPoint'));
                if (insertionPoint !== null) {
                  insertionPoint.remove();
                }
              },
              function() {
                // Re-enables the sanitizer now that the modal is closed.
                textAngular.$editor().$parent.isCustomizationModalOpen = false;
                textAngular.$editor().displayElements.text[0].focus();
                rangy.restoreSelection(savedSelection);
              }
            );
          }
        });
      });

      return taOptions;
    }
  ]);
}]);

oppia.config([
  '$compileProvider', '$httpProvider', '$interpolateProvider',
  '$locationProvider',
  function(
      $compileProvider, $httpProvider, $interpolateProvider,
      $locationProvider) {
    // This improves performance by disabling debug data. For more details,
    // see https://code.angularjs.org/1.5.5/docs/guide/production
    $compileProvider.debugInfoEnabled(false);

    // Set the AngularJS interpolators as <[ and ]>, to not conflict with
    // Jinja2 templates.
    $interpolateProvider.startSymbol('<[');
    $interpolateProvider.endSymbol(']>');

    // Prevent the search page from reloading if the search query is changed.
    $locationProvider.html5Mode(false);
    if (window.location.pathname === '/search/find') {
      $locationProvider.html5Mode(true);
    }

    // Set default headers for POST and PUT requests.
    $httpProvider.defaults.headers.post = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    $httpProvider.defaults.headers.put = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add an interceptor to convert requests to strings and to log and show
    // warnings for error responses.
    $httpProvider.interceptors.push([
      '$q', '$log', 'AlertsService', function($q, $log, AlertsService) {
        return {
          request: function(config) {
            if (config.data) {
              config.data = $.param({
                csrf_token: GLOBALS.csrf_token,
                payload: JSON.stringify(config.data),
                source: document.URL
              }, true);
            }
            return config;
          },
          responseError: function(rejection) {
            // A rejection status of -1 seems to indicate (it's hard to find
            // documentation) that the response has not completed,
            // which can occur if the user navigates away from the page
            // while the response is pending, This should not be considered
            // an error.
            if (rejection.status !== -1) {
              $log.error(rejection.data);

              var warningMessage = 'Error communicating with server.';
              if (rejection.data && rejection.data.error) {
                warningMessage = rejection.data.error;
              }
              AlertsService.addWarning(warningMessage);
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

oppia.config(['$provide', function($provide) {
  $provide.decorator('$log', ['$delegate', function($delegate) {
    var _originalError = $delegate.error;

    if (window.GLOBALS && !window.GLOBALS.DEV_MODE) {
      $delegate.log = function() {};
      $delegate.info = function() {};
      // TODO(sll): Send errors (and maybe warnings) to the backend.
      $delegate.warn = function() { };
      $delegate.error = function(message) {
        if (String(message).indexOf('$digest already in progress') === -1) {
          _originalError(message);
        }
      };
      // This keeps angular-mocks happy (in tests).
      $delegate.error.logs = [];
    }

    return $delegate;
  }]);
}]);

oppia.config(['toastrConfig', function(toastrConfig) {
  angular.extend(toastrConfig, {
    allowHtml: false,
    iconClasses: {
      error: 'toast-error',
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning'
    },
    positionClass: 'toast-bottom-right',
    messageClass: 'toast-message',
    progressBar: false,
    tapToDismiss: true,
    timeOut: 1500,
    titleClass: 'toast-title'
  });
}]);

// Overwrite the built-in exceptionHandler service to log errors to the backend
// (so that they can be fixed).
oppia.factory('$exceptionHandler', ['$log', function($log) {
  return function(exception, cause) {
    var messageAndSourceAndStackTrace = [
      '',
      'Cause: ' + cause,
      exception.message,
      String(exception.stack),
      '    at URL: ' + window.location.href
    ].join('\n');

    // Catch all errors, to guard against infinite recursive loops.
    try {
      // We use jQuery here instead of Angular's $http, since the latter
      // creates a circular dependency.
      $.ajax({
        type: 'POST',
        url: '/frontend_errors',
        data: $.param({
          csrf_token: GLOBALS.csrf_token,
          payload: JSON.stringify({
            error: messageAndSourceAndStackTrace
          }),
          source: document.URL
        }, true),
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'text',
        async: true
      });
    } catch (loggingError) {
      $log.warn('Error logging failed.');
    }

    $log.error.apply($log, arguments);
  };
}]);

// Service for converting dates in milliseconds since the Epoch to
// human-readable dates.
oppia.factory('oppiaDatetimeFormatter', ['$filter', function($filter) {
  return {
    // Returns just the time if the local datetime representation has the
    // same date as the current date. Otherwise, returns just the date if the
    // local datetime representation has the same year as the current date.
    // Otherwise, returns the full date (with the year abbreviated).
    getLocaleAbbreviatedDatetimeString: function(millisSinceEpoch) {
      var date = new Date(millisSinceEpoch);
      if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
        return date.toLocaleTimeString([], {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      } else if (date.getFullYear() === new Date().getFullYear()) {
        return $filter('date')(date, 'MMM d');
      } else {
        return $filter('date')(date, 'shortDate');
      }
    },
    // Returns just the date.
    getLocaleDateString: function(millisSinceEpoch) {
      var date = new Date(millisSinceEpoch);
      return date.toLocaleDateString();
    },
    // Returns whether the date is at most one week before the current date.
    isRecent: function(millisSinceEpoch) {
      var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
      return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
    }
  };
}]);

oppia.factory('rteHelperService', [
  '$filter', '$log', '$interpolate', 'ExplorationContextService',
  'RTE_COMPONENT_SPECS', 'HtmlEscaperService', 'UrlInterpolationService',
  function(
      $filter, $log, $interpolate, ExplorationContextService,
      RTE_COMPONENT_SPECS, HtmlEscaperService, UrlInterpolationService) {
    var _RICH_TEXT_COMPONENTS = [];

    Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function(componentId) {
      _RICH_TEXT_COMPONENTS.push({
        backendId: RTE_COMPONENT_SPECS[componentId].backend_id,
        customizationArgSpecs: angular.copy(
          RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
        id: RTE_COMPONENT_SPECS[componentId].frontend_id,
        iconDataUrl: RTE_COMPONENT_SPECS[componentId].icon_data_url,
        previewUrlTemplate:
        RTE_COMPONENT_SPECS[componentId].preview_url_template,
        isComplex: RTE_COMPONENT_SPECS[componentId].is_complex,
        isBlockElement: RTE_COMPONENT_SPECS[componentId].is_block_element,
        requiresFs: RTE_COMPONENT_SPECS[componentId].requires_fs,
        tooltip: RTE_COMPONENT_SPECS[componentId].tooltip
      });
    });

    var _createCustomizationArgDictFromAttrs = function(attrs) {
      var customizationArgsDict = {};
      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (attr.name === 'class' || attr.name === 'src' ||
          attr.name === '_moz_resizing') {
          continue;
        }
        var separatorLocation = attr.name.indexOf('-with-value');
        if (separatorLocation === -1) {
          $log.error('RTE Error: invalid customization attribute ' + attr.name);
          continue;
        }
        var argName = attr.name.substring(0, separatorLocation);
        customizationArgsDict[argName] = HtmlEscaperService.escapedJsonToObj(
          attr.value);
      }
      return customizationArgsDict;
    };

    return {
      createCustomizationArgDictFromAttrs: function(attrs) {
        return _createCustomizationArgDictFromAttrs(attrs);
      },
      createToolbarIcon: function(componentDefn) {
        var el = $('<img/>');
        el.attr(
          'src', UrlInterpolationService.getExtensionResourceUrl(
            componentDefn.iconDataUrl));
        el.addClass('oppia-rte-toolbar-image');
        return el.get(0);
      },
      // Returns a DOM node.
      createRteElement: function(componentDefn, customizationArgsDict) {
        var el = $('<img/>');
        if (ExplorationContextService.isInExplorationContext()) {
          // TODO(sll): This extra key was introduced in commit
          // 19a934ce20d592a3fc46bd97a2f05f41d33e3d66 in order to retrieve an
          // image for RTE previews. However, it has had the unfortunate side-
          // effect of adding an extra tag to the exploration RTE tags stored
          // in the datastore. We are now removing this key in
          // convertRteToHtml(), but we need to find a less invasive way to
          // handle previews.
          customizationArgsDict = angular.extend(customizationArgsDict, {
            explorationId: ExplorationContextService.getExplorationId()
          });
        }
        var componentPreviewUrlTemplate = componentDefn.previewUrlTemplate;
        if (componentDefn.previewUrlTemplate.indexOf(
            '/rich_text_components') === 0) {
          var interpolatedUrl = UrlInterpolationService.getExtensionResourceUrl(
            componentPreviewUrlTemplate);
        } else {
          var interpolatedUrl = ($interpolate(
            componentPreviewUrlTemplate, false, null, true)(
              customizationArgsDict));
        }

        if (!interpolatedUrl) {
          $log.error(
            'Error interpolating url : ' + componentDefn.previewUrlTemplate);
        } else {
          el.attr('src', interpolatedUrl);
        }
        el.addClass('oppia-noninteractive-' + componentDefn.id);
        if (componentDefn.isBlockElement) {
          el.addClass('block-element');
        }
        for (var attrName in customizationArgsDict) {
          el.attr(
            $filter('camelCaseToHyphens')(attrName) + '-with-value',
            HtmlEscaperService.objToEscapedJson(
              customizationArgsDict[attrName]));
        }

        return el.get(0);
      },
      // Replace <oppia-noninteractive> tags with <img> tags.
      convertHtmlToRte: function(html) {
        // If an undefined or empty html value is passed in, then the same type
        // of value should be returned. Without this check,
        // convertHtmlToRte(undefined) would return 'undefined', which is not
        // ideal.
        if (!html) {
          return html;
        }

        var elt = $('<div>' + html + '</div>');
        var that = this;

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          elt.find('oppia-noninteractive-' + componentDefn.id).replaceWith(
            function() {
              return that.createRteElement(
                componentDefn,
                _createCustomizationArgDictFromAttrs(this.attributes));
            }
          );
        });

        return elt.html();
      },
      // Replace <img> tags with <oppia-noninteractive> tags.
      convertRteToHtml: function(rte) {
        // If an undefined or empty rte value is passed in, then the same type
        // of value should be returned. Without this check,
        // convertRteToHtml(undefined) would return 'undefined', which is not
        // ideal.
        if (!rte) {
          return rte;
        }

        var elt = $('<div>' + rte + '</div>');

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          elt.find(
            'img.oppia-noninteractive-' + componentDefn.id
          ).replaceWith(function() {
            // Look for a class name starting with oppia-noninteractive-*.
            var tagNameMatch = /(^|\s)(oppia-noninteractive-[a-z0-9\-]+)/.exec(
              this.className);
            if (!tagNameMatch) {
              $log.error('RTE Error: invalid class name ' + this.className);
            }
            var jQueryElt = $('<' + tagNameMatch[2] + '/>');
            for (var i = 0; i < this.attributes.length; i++) {
              var attr = this.attributes[i];
              // The exploration-id-with-value attribute was added in
              // createRteElement(), and should be stripped. See commit
              // 19a934ce20d592a3fc46bd97a2f05f41d33e3d66.
              if (attr.name !== 'class' && attr.name !== 'src' &&
                attr.name !== 'exploration-id-with-value') {
                jQueryElt.attr(attr.name, attr.value);
              }
            }
            return jQueryElt.get(0);
          });
        });

        return elt.html();
      },
      getRichTextComponents: function() {
        return angular.copy(_RICH_TEXT_COMPONENTS);
      }
    };
  }
]);

oppia.constant('LABEL_FOR_CLEARING_FOCUS', 'labelForClearingFocus');

// Service for manipulating the page URL.
oppia.factory('urlService', ['$window', function($window) {
  return {
    getUrlParams: function() {
      var params = {};
      var parts = $window.location.href.replace(
        /[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
          params[key] = value;
        }
      );
      return params;
    },
    isIframed: function() {
      var pathname = this.getPathname();
      var urlParts = pathname.split('/');
      return urlParts[1] === 'embed';
    },
    getPathname: function() {
      return window.location.pathname;
    }
  };
}]);

// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.
oppia.factory('siteAnalyticsService', ['$window', function($window) {
  var CAN_SEND_ANALYTICS_EVENTS = constants.CAN_SEND_ANALYTICS_EVENTS;
  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/events
  var _sendEventToGoogleAnalytics = function(
      eventCategory, eventAction, eventLabel) {
    if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
      $window.ga('send', 'event', eventCategory, eventAction, eventLabel);
    }
  };

  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/
  //   social-interactions
  var _sendSocialEventToGoogleAnalytics = function(
      network, action, targetUrl) {
    if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
      $window.ga('send', 'social', network, action, targetUrl);
    }
  };

  return {
    // The srcElement refers to the element on the page that is clicked.
    registerStartLoginEvent: function(srcElement) {
      _sendEventToGoogleAnalytics(
        'LoginButton', 'click', $window.location.pathname + ' ' + srcElement);
    },
    registerNewSignupEvent: function() {
      _sendEventToGoogleAnalytics('SignupButton', 'click', '');
    },
    registerClickBrowseLibraryButtonEvent: function() {
      _sendEventToGoogleAnalytics(
        'BrowseLibraryButton', 'click', $window.location.pathname);
    },
    registerGoToDonationSiteEvent: function(donationSiteName) {
      _sendEventToGoogleAnalytics(
        'GoToDonationSite', 'click', donationSiteName);
    },
    registerApplyToTeachWithOppiaEvent: function() {
      _sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
    },
    registerClickCreateExplorationButtonEvent: function() {
      _sendEventToGoogleAnalytics(
        'CreateExplorationButton', 'click', $window.location.pathname);
    },
    registerCreateNewExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
    },
    registerCreateNewExplorationInCollectionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'NewExplorationFromCollection', 'create', explorationId);
    },
    registerCreateNewCollectionEvent: function(collectionId) {
      _sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
    },
    registerCommitChangesToPrivateExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'CommitToPrivateExploration', 'click', explorationId);
    },
    registerShareExplorationEvent: function(network) {
      _sendSocialEventToGoogleAnalytics(
        network, 'share', $window.location.pathname);
    },
    registerShareCollectionEvent: function(network) {
      _sendSocialEventToGoogleAnalytics(
        network, 'share', $window.location.pathname);
    },
    registerOpenEmbedInfoEvent: function(explorationId) {
      _sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
    },
    registerCommitChangesToPublicExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'CommitToPublicExploration', 'click', explorationId);
    },
    // Metrics for tutorial on first creating exploration
    registerTutorialModalOpenEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'TutorialModalOpen', 'open', explorationId);
    },
    registerDeclineTutorialModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'DeclineTutorialModal', 'click', explorationId);
    },
    registerAcceptTutorialModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'AcceptTutorialModal', 'click', explorationId);
    },
    // Metrics for visiting the help center
    registerClickHelpButtonEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'ClickHelpButton', 'click', explorationId);
    },
    registerVisitHelpCenterEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'VisitHelpCenter', 'click', explorationId);
    },
    registerOpenTutorialFromHelpCenterEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'OpenTutorialFromHelpCenter', 'click', explorationId);
    },
    // Metrics for exiting the tutorial
    registerSkipTutorialEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'SkipTutorial', 'click', explorationId);
    },
    registerFinishTutorialEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FinishTutorial', 'click', explorationId);
    },
    // Metrics for first time editor use
    registerEditorFirstEntryEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstEnterEditor', 'open', explorationId);
    },
    registerFirstOpenContentBoxEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstOpenContentBox', 'open', explorationId);
    },
    registerFirstSaveContentEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveContent', 'click', explorationId);
    },
    registerFirstClickAddInteractionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstClickAddInteraction', 'click', explorationId);
    },
    registerFirstSelectInteractionTypeEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSelectInteractionType', 'click', explorationId);
    },
    registerFirstSaveInteractionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveInteraction', 'click', explorationId);
    },
    registerFirstSaveRuleEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveRule', 'click', explorationId);
    },
    registerFirstCreateSecondStateEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstCreateSecondState', 'create', explorationId);
    },
    // Metrics for publishing explorations
    registerSavePlayableExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'SavePlayableExploration', 'save', explorationId);
    },
    registerOpenPublishExplorationModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'PublishExplorationModal', 'open', explorationId);
    },
    registerPublishExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'PublishExploration', 'click', explorationId);
    },
    registerVisitOppiaFromIframeEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'VisitOppiaFromIframe', 'click', explorationId);
    },
    registerNewCard: function(cardNum) {
      if (cardNum <= 10 || cardNum % 10 === 0) {
        _sendEventToGoogleAnalytics('PlayerNewCard', 'click', cardNum);
      }
    },
    registerFinishExploration: function() {
      _sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
    }
  };
}]);

// Service for assembling extension tags (for interactions).
oppia.factory('extensionTagAssemblerService', [
  '$filter', 'HtmlEscaperService', function($filter, HtmlEscaperService) {
    return {
      formatCustomizationArgAttrs: function(element, customizationArgSpecs) {
        for (var caSpecName in customizationArgSpecs) {
          var caSpecValue = customizationArgSpecs[caSpecName].value;
          element.attr(
            $filter('camelCaseToHyphens')(caSpecName) + '-with-value',
            HtmlEscaperService.objToEscapedJson(caSpecValue));
        }
        return element;
      }
    };
  }
]);

// Add a String.prototype.trim() polyfill for IE8.
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

// Add an Object.create() polyfill for IE8.
if (typeof Object.create !== 'function') {
  (function() {
    var F = function() {};
    Object.create = function(o) {
      if (arguments.length > 1) {
        throw Error('Second argument for Object.create() is not supported');
      }
      if (o === null) {
        throw Error('Cannot set a null [[Prototype]]');
      }
      if (typeof o !== 'object') {
        throw TypeError('Argument must be an object');
      }
      F.prototype = o;
      return new F();
    };
  })();
}
