/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"story_editor": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/story-editor-page/story-editor-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","vendors~admin~collection_editor~collection_player~creator_dashboard~exploration_editor~exploration_p~7f8bcc67","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~b9580ed0","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~d3595155","admin~exploration_editor~exploration_player~moderator~practice_session~review_test~skill_editor~stor~7734cddb","story_editor~topics_and_skills_dashboard","collection_editor~story_editor"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/domain/skill/skill-domain.constants.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/skill/skill-domain.constants.ts ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for skill domain.
 */
var SkillDomainConstants = /** @class */ (function () {
    function SkillDomainConstants() {
    }
    SkillDomainConstants.CONCEPT_CARD_DATA_URL_TEMPLATE = '/concept_card_handler/<comma_separated_skill_ids>';
    SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE = '/skill_editor_handler/data/<skill_id>';
    SkillDomainConstants.SKILL_DATA_URL_TEMPLATE = '/skill_data_handler/<comma_separated_skill_ids>';
    SkillDomainConstants.SKILL_EDITOR_QUESTION_URL_TEMPLATE = '/skill_editor_question_handler/<skill_id>?cursor=<cursor>';
    SkillDomainConstants.SKILL_MASTERY_DATA_URL_TEMPLATE = '/skill_mastery_handler/data';
    SkillDomainConstants.SKILL_PROPERTY_DESCRIPTION = 'description';
    SkillDomainConstants.SKILL_PROPERTY_LANGUAGE_CODE = 'language_code';
    SkillDomainConstants.SKILL_CONTENTS_PROPERTY_EXPLANATION = 'explanation';
    SkillDomainConstants.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES = 'worked_examples';
    SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NAME = 'name';
    SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NOTES = 'notes';
    SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK = 'feedback';
    SkillDomainConstants.CMD_UPDATE_SKILL_PROPERTY = 'update_skill_property';
    SkillDomainConstants.CMD_UPDATE_SKILL_CONTENTS_PROPERTY = 'update_skill_contents_property';
    SkillDomainConstants.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY = 'update_skill_misconceptions_property';
    SkillDomainConstants.CMD_ADD_SKILL_MISCONCEPTION = 'add_skill_misconception';
    SkillDomainConstants.CMD_DELETE_SKILL_MISCONCEPTION = 'delete_skill_misconception';
    SkillDomainConstants.CMD_UPDATE_RUBRICS = 'update_rubrics';
    return SkillDomainConstants;
}());
exports.SkillDomainConstants = SkillDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/domain/story/EditableStoryBackendApiService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/EditableStoryBackendApiService.ts ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! domain/story/story-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/story/story-domain.constants.ajs.ts");
angular.module('oppia').factory('EditableStoryBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'EDITABLE_STORY_DATA_URL_TEMPLATE', 'STORY_PUBLISH_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, EDITABLE_STORY_DATA_URL_TEMPLATE, STORY_PUBLISH_URL_TEMPLATE) {
        var _fetchStory = function (storyId, successCallback, errorCallback) {
            var storyDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_STORY_DATA_URL_TEMPLATE, {
                story_id: storyId
            });
            $http.get(storyDataUrl).then(function (response) {
                var story = angular.copy(response.data.story);
                var topicName = angular.copy(response.data.topic_name);
                var storyIsPublished = response.data.story_is_published;
                if (successCallback) {
                    successCallback({
                        story: story,
                        topicName: topicName,
                        storyIsPublished: storyIsPublished
                    });
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _updateStory = function (storyId, storyVersion, commitMessage, changeList, successCallback, errorCallback) {
            var editableStoryDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_STORY_DATA_URL_TEMPLATE, {
                story_id: storyId
            });
            var putData = {
                version: storyVersion,
                commit_message: commitMessage,
                change_dicts: changeList
            };
            $http.put(editableStoryDataUrl, putData).then(function (response) {
                // The returned data is an updated story dict.
                var story = angular.copy(response.data.story);
                if (successCallback) {
                    successCallback(story);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _changeStoryPublicationStatus = function (storyId, newStoryStatusIsPublic, successCallback, errorCallback) {
            var storyPublishUrl = UrlInterpolationService.interpolateUrl(STORY_PUBLISH_URL_TEMPLATE, {
                story_id: storyId
            });
            var putData = {
                new_story_status_is_public: newStoryStatusIsPublic
            };
            $http.put(storyPublishUrl, putData).then(function (response) {
                if (successCallback) {
                    successCallback();
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _deleteStory = function (storyId, successCallback, errorCallback) {
            var storyDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_STORY_DATA_URL_TEMPLATE, {
                story_id: storyId
            });
            $http['delete'](storyDataUrl).then(function (response) {
                if (successCallback) {
                    successCallback(response.status);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchStory: function (storyId) {
                return $q(function (resolve, reject) {
                    _fetchStory(storyId, resolve, reject);
                });
            },
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
            updateStory: function (storyId, storyVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateStory(storyId, storyVersion, commitMessage, changeList, resolve, reject);
                });
            },
            changeStoryPublicationStatus: function (storyId, newStoryStatusIsPublic) {
                return $q(function (resolve, reject) {
                    _changeStoryPublicationStatus(storyId, newStoryStatusIsPublic, resolve, reject);
                });
            },
            deleteStory: function (storyId) {
                return $q(function (resolve, reject) {
                    _deleteStory(storyId, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryContentsObjectFactory.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryContentsObjectFactory.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * story contents domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var story_editor_page_constants_1 = __webpack_require__(/*! pages/story-editor-page/story-editor-page.constants */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ts");
var StoryNodeObjectFactory_1 = __webpack_require__(/*! domain/story/StoryNodeObjectFactory */ "./core/templates/dev/head/domain/story/StoryNodeObjectFactory.ts");
var StoryContents = /** @class */ (function () {
    function StoryContents(initialNodeId, nodes, nextNodeId, storyNodeObjectFactoryInstance) {
        this._disconnectedNodeIds = [];
        this._initialNodeId = initialNodeId;
        this._nodes = nodes;
        this._nextNodeId = nextNodeId;
        this._storyNodeObjectFactoryInstance = storyNodeObjectFactoryInstance;
    }
    StoryContents.prototype.getIncrementedNodeId = function (nodeId) {
        var index = parseInt(nodeId.replace(story_editor_page_constants_1.StoryEditorPageConstants.NODE_ID_PREFIX, ''));
        ++index;
        return story_editor_page_constants_1.StoryEditorPageConstants.NODE_ID_PREFIX + index;
    };
    StoryContents.prototype.getInitialNodeId = function () {
        return this._initialNodeId;
    };
    StoryContents.prototype.getDisconnectedNodeIds = function () {
        return this._disconnectedNodeIds;
    };
    StoryContents.prototype.getNextNodeId = function () {
        return this._nextNodeId;
    };
    StoryContents.prototype.getNodes = function () {
        return this._nodes;
    };
    StoryContents.prototype.getNodeIdCorrespondingToTitle = function (title) {
        var nodes = this._nodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getTitle() === title) {
                return nodes[i].getId();
            }
        }
        return null;
    };
    StoryContents.prototype.getNodeIdsToTitleMap = function (nodeIds) {
        var nodes = this._nodes;
        var nodeTitles = {};
        for (var i = 0; i < nodes.length; i++) {
            if (nodeIds.indexOf(nodes[i].getId()) !== -1) {
                nodeTitles[nodes[i].getId()] = nodes[i].getTitle();
            }
        }
        if (Object.keys(nodeTitles).length !== nodeIds.length) {
            for (var i = 0; i < nodeIds.length; i++) {
                if (!nodeTitles.hasOwnProperty(nodeIds[i])) {
                    throw Error('The node with id ' + nodeIds[i] + ' is invalid');
                }
            }
        }
        return nodeTitles;
    };
    StoryContents.prototype.getNodeIds = function () {
        return this._nodes.map(function (node) {
            return node.getId();
        });
    };
    StoryContents.prototype.getNodeIndex = function (nodeId) {
        for (var i = 0; i < this._nodes.length; i++) {
            if (this._nodes[i].getId() === nodeId) {
                return i;
            }
        }
        return -1;
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a list with varying element types.
    StoryContents.prototype.validate = function () {
        this._disconnectedNodeIds = [];
        var issues = [];
        var nodes = this._nodes;
        for (var i = 0; i < nodes.length; i++) {
            var nodeIssues = nodes[i].validate();
            issues = issues.concat(nodeIssues);
        }
        if (issues.length > 0) {
            return issues;
        }
        // Provided the nodes list is valid and each node in it is valid, the
        // preliminary checks are done to see if the story node graph obtained is
        // valid.
        var nodeIds = nodes.map(function (node) {
            return node.getId();
        });
        var nodeTitles = nodes.map(function (node) {
            return node.getTitle();
        });
        for (var i = 0; i < nodeIds.length; i++) {
            var nodeId = nodeIds[i];
            if (nodeIds.indexOf(nodeId) < nodeIds.lastIndexOf(nodeId)) {
                throw Error('The node with id ' + nodeId + ' is duplicated in the story');
            }
        }
        var nextNodeIdNumber = parseInt(this._nextNodeId.replace(story_editor_page_constants_1.StoryEditorPageConstants.NODE_ID_PREFIX, ''));
        var initialNodeIsPresent = false;
        for (var i = 0; i < nodes.length; i++) {
            var nodeIdNumber = parseInt(nodes[i].getId().replace(story_editor_page_constants_1.StoryEditorPageConstants.NODE_ID_PREFIX, ''));
            if (nodes[i].getId() === this._initialNodeId) {
                initialNodeIsPresent = true;
            }
            if (nodeIdNumber > nextNodeIdNumber) {
                throw Error('Node id out of bounds for node with id ' + nodes[i].getId());
            }
            for (var j = 0; j < nodes[i].getDestinationNodeIds().length; j++) {
                if (nodeIds.indexOf(nodes[i].getDestinationNodeIds()[j]) === -1) {
                    issues.push('The node with id ' + nodes[i].getDestinationNodeIds()[j] +
                        ' doesn\'t exist');
                }
            }
        }
        if (nodes.length > 0) {
            if (!initialNodeIsPresent) {
                throw Error('Initial node - ' + this._initialNodeId +
                    ' - is not present in the story');
            }
            // All the validations above should be successfully completed before
            // going to validating the story node graph.
            if (issues.length > 0) {
                return issues;
            }
            // nodesQueue stores the pending nodes to visit in a queue form.
            var nodesQueue = [];
            var nodeIsVisited = new Array(nodeIds.length).fill(false);
            var startingNode = nodes[this.getNodeIndex(this._initialNodeId)];
            nodesQueue.push(startingNode.getId());
            // The user is assumed to have all the prerequisite skills of the
            // starting node before starting the story. Also, this list models the
            // skill IDs acquired by a learner as they progress through the story.
            var simulatedSkillIds = new Set(startingNode.getPrerequisiteSkillIds());
            // The following loop employs a Breadth First Search from the given
            // starting node and makes sure that the user has acquired all the
            // prerequisite skills required by the destination nodes 'unlocked' by
            // visiting a particular node by the time that node is finished.
            while (nodesQueue.length > 0) {
                var currentNodeIndex = this.getNodeIndex(nodesQueue.shift());
                nodeIsVisited[currentNodeIndex] = true;
                var currentNode = nodes[currentNodeIndex];
                startingNode.getAcquiredSkillIds().forEach(function (skillId) {
                    simulatedSkillIds.add(skillId);
                });
                for (var i = 0; i < currentNode.getDestinationNodeIds().length; i++) {
                    var nodeId = currentNode.getDestinationNodeIds()[i];
                    var nodeIndex = this.getNodeIndex(nodeId);
                    // The following condition checks whether the destination node
                    // for a particular node, has already been visited, in which case
                    // the story would have loops, which are not allowed.
                    if (nodeIsVisited[nodeIndex]) {
                        issues.push('Loops are not allowed in the node graph');
                        // If a loop is encountered, then all further checks are halted,
                        // since it can lead to same error being reported again.
                        return issues;
                    }
                    var destinationNode = nodes[nodeIndex];
                    destinationNode.getPrerequisiteSkillIds().forEach(function (skillId) {
                        if (!simulatedSkillIds.has(skillId)) {
                            issues.push('The prerequisite skill with id ' + skillId +
                                ' was not completed before node with id ' + nodeId +
                                ' was unlocked');
                        }
                    });
                    nodesQueue.push(nodeId);
                }
            }
            for (var i = 0; i < nodeIsVisited.length; i++) {
                if (!nodeIsVisited[i]) {
                    this._disconnectedNodeIds.push(nodeIds[i]);
                    issues.push('There is no way to get to the chapter with title ' +
                        nodeTitles[i] + ' from any other chapter');
                }
            }
        }
        return issues;
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is an assignment statement and should be
    // typed as void and the return statement should be removed.
    StoryContents.prototype.setInitialNodeId = function (nodeId) {
        if (this.getNodeIndex(nodeId) === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        return this._initialNodeId = nodeId;
    };
    StoryContents.prototype.addNode = function (title) {
        this._nodes.push(this._storyNodeObjectFactoryInstance.createFromIdAndTitle(this._nextNodeId, title));
        if (this._initialNodeId === null) {
            this._initialNodeId = this._nextNodeId;
        }
        this._nextNodeId = this.getIncrementedNodeId(this._nextNodeId);
    };
    StoryContents.prototype.deleteNode = function (nodeId) {
        if (this.getNodeIndex(nodeId) === -1) {
            throw Error('The node does not exist');
        }
        if (nodeId === this._initialNodeId) {
            if (this._nodes.length === 1) {
                this._initialNodeId = null;
            }
            else {
                throw Error('Cannot delete initial story node');
            }
        }
        for (var i = 0; i < this._nodes.length; i++) {
            if (this._nodes[i].getDestinationNodeIds().indexOf(nodeId) !== -1) {
                this._nodes[i].removeDestinationNodeId(nodeId);
            }
        }
        this._nodes.splice(this.getNodeIndex(nodeId), 1);
    };
    StoryContents.prototype.setNodeOutline = function (nodeId, outline) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].setOutline(outline);
    };
    StoryContents.prototype.setNodeTitle = function (nodeId, title) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].setTitle(title);
    };
    StoryContents.prototype.setNodeExplorationId = function (nodeId, explorationId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        else if (explorationId !== null || explorationId !== '') {
            for (var i = 0; i < this._nodes.length; i++) {
                if ((this._nodes[i].getExplorationId() === explorationId) && (i !== index)) {
                    throw Error('The given exploration already exists in the story.');
                }
            }
            this._nodes[index].setExplorationId(explorationId);
        }
    };
    StoryContents.prototype.markNodeOutlineAsFinalized = function (nodeId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].markOutlineAsFinalized();
    };
    StoryContents.prototype.markNodeOutlineAsNotFinalized = function (nodeId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].markOutlineAsNotFinalized();
    };
    StoryContents.prototype.addPrerequisiteSkillIdToNode = function (nodeId, skillId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].addPrerequisiteSkillId(skillId);
    };
    StoryContents.prototype.removePrerequisiteSkillIdFromNode = function (nodeId, skillId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].removePrerequisiteSkillId(skillId);
    };
    StoryContents.prototype.addAcquiredSkillIdToNode = function (nodeId, skillId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].addAcquiredSkillId(skillId);
    };
    StoryContents.prototype.removeAcquiredSkillIdFromNode = function (nodeId, skillId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].removeAcquiredSkillId(skillId);
    };
    StoryContents.prototype.addDestinationNodeIdToNode = function (nodeId, destinationNodeId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        if (this.getNodeIndex(destinationNodeId) === -1) {
            throw Error('The destination node with given id doesn\'t exist');
        }
        this._nodes[index].addDestinationNodeId(destinationNodeId);
    };
    StoryContents.prototype.removeDestinationNodeIdFromNode = function (nodeId, destinationNodeId) {
        var index = this.getNodeIndex(nodeId);
        if (index === -1) {
            throw Error('The node with given id doesn\'t exist');
        }
        this._nodes[index].removeDestinationNodeId(destinationNodeId);
    };
    return StoryContents;
}());
exports.StoryContents = StoryContents;
var StoryContentsObjectFactory = /** @class */ (function () {
    function StoryContentsObjectFactory(storyNodeObjectFactory) {
        this.storyNodeObjectFactory = storyNodeObjectFactory;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'storyContentsBackendObject' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    StoryContentsObjectFactory.prototype.createFromBackendDict = function (storyContentsBackendObject) {
        var nodes = [];
        for (var i = 0; i < storyContentsBackendObject.nodes.length; i++) {
            nodes.push(this.storyNodeObjectFactory.createFromBackendDict(storyContentsBackendObject.nodes[i]));
        }
        return new StoryContents(storyContentsBackendObject.initial_node_id, nodes, storyContentsBackendObject.next_node_id, this.storyNodeObjectFactory);
    };
    var _a;
    StoryContentsObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof StoryNodeObjectFactory_1.StoryNodeObjectFactory !== "undefined" && StoryNodeObjectFactory_1.StoryNodeObjectFactory) === "function" ? _a : Object])
    ], StoryContentsObjectFactory);
    return StoryContentsObjectFactory;
}());
exports.StoryContentsObjectFactory = StoryContentsObjectFactory;
angular.module('oppia').factory('StoryContentsObjectFactory', static_1.downgradeInjectable(StoryContentsObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryNodeObjectFactory.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryNodeObjectFactory.ts ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * story node domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var story_editor_page_constants_1 = __webpack_require__(/*! pages/story-editor-page/story-editor-page.constants */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ts");
var StoryNode = /** @class */ (function () {
    function StoryNode(id, title, destinationNodeIds, prerequisiteSkillIds, acquiredSkillIds, outline, outlineIsFinalized, explorationId) {
        this._id = id;
        this._title = title;
        this._destinationNodeIds = destinationNodeIds;
        this._prerequisiteSkillIds = prerequisiteSkillIds;
        this._acquiredSkillIds = acquiredSkillIds;
        this._outline = outline;
        this._outlineIsFinalized = outlineIsFinalized;
        this._explorationId = explorationId;
    }
    StoryNode.prototype._checkValidNodeId = function (nodeId) {
        if (typeof nodeId !== 'string') {
            return false;
        }
        var nodeIdPattern = new RegExp(story_editor_page_constants_1.StoryEditorPageConstants.NODE_ID_PREFIX + '[0-9]+', 'g');
        if (!nodeId.match(nodeIdPattern)) {
            return false;
        }
        return true;
    };
    StoryNode.prototype.getId = function () {
        return this._id;
    };
    StoryNode.prototype.getTitle = function () {
        return this._title;
    };
    StoryNode.prototype.getExplorationId = function () {
        return this._explorationId;
    };
    StoryNode.prototype.setExplorationId = function (explorationId) {
        this._explorationId = explorationId;
    };
    StoryNode.prototype.getOutline = function () {
        return this._outline;
    };
    StoryNode.prototype.setOutline = function (outline) {
        this._outline = outline;
    };
    StoryNode.prototype.setTitle = function (title) {
        this._title = title;
    };
    StoryNode.prototype.getOutlineStatus = function () {
        return this._outlineIsFinalized;
    };
    StoryNode.prototype.markOutlineAsFinalized = function () {
        this._outlineIsFinalized = true;
    };
    StoryNode.prototype.markOutlineAsNotFinalized = function () {
        this._outlineIsFinalized = false;
    };
    StoryNode.prototype.validate = function () {
        var issues = [];
        if (!this._checkValidNodeId(this._id)) {
            throw Error('The node id ' + this._id + ' is invalid.');
        }
        var prerequisiteSkillIds = this._prerequisiteSkillIds;
        var acquiredSkillIds = this._acquiredSkillIds;
        var destinationNodeIds = this._destinationNodeIds;
        for (var i = 0; i < prerequisiteSkillIds.length; i++) {
            var skillId = prerequisiteSkillIds[i];
            if (prerequisiteSkillIds.indexOf(skillId) <
                prerequisiteSkillIds.lastIndexOf(skillId)) {
                issues.push('The prerequisite skill with id ' + skillId + ' is duplicated in' +
                    ' node with id ' + this._id);
            }
        }
        for (var i = 0; i < acquiredSkillIds.length; i++) {
            var skillId = acquiredSkillIds[i];
            if (acquiredSkillIds.indexOf(skillId) <
                acquiredSkillIds.lastIndexOf(skillId)) {
                issues.push('The acquired skill with id ' + skillId + ' is duplicated in' +
                    ' node with id ' + this._id);
            }
        }
        for (var i = 0; i < prerequisiteSkillIds.length; i++) {
            if (acquiredSkillIds.indexOf(prerequisiteSkillIds[i]) !== -1) {
                issues.push('The skill with id ' + prerequisiteSkillIds[i] + ' is common ' +
                    'to both the acquired and prerequisite skill id list in node with' +
                    ' id ' + this._id);
            }
        }
        for (var i = 0; i < destinationNodeIds.length; i++) {
            if (!this._checkValidNodeId(destinationNodeIds[i])) {
                throw Error('The destination node id ' + destinationNodeIds[i] + ' is ' +
                    'invalid in node with id ' + this._id);
            }
        }
        var currentNodeId = this._id;
        if (destinationNodeIds.some(function (nodeId) {
            return nodeId === currentNodeId;
        })) {
            issues.push('The destination node id of node with id ' + this._id +
                ' points to itself.');
        }
        for (var i = 0; i < destinationNodeIds.length; i++) {
            var nodeId = destinationNodeIds[i];
            if (destinationNodeIds.indexOf(nodeId) <
                destinationNodeIds.lastIndexOf(nodeId)) {
                issues.push('The destination node with id ' + nodeId + ' is duplicated in' +
                    ' node with id ' + this._id);
            }
        }
        return issues;
    };
    StoryNode.prototype.getDestinationNodeIds = function () {
        return this._destinationNodeIds.slice();
    };
    StoryNode.prototype.addDestinationNodeId = function (destinationNodeid) {
        if (this._destinationNodeIds.indexOf(destinationNodeid) !== -1) {
            throw Error('The given node is already a destination node.');
        }
        this._destinationNodeIds.push(destinationNodeid);
    };
    StoryNode.prototype.removeDestinationNodeId = function (destinationNodeid) {
        var index = this._destinationNodeIds.indexOf(destinationNodeid);
        if (index === -1) {
            throw Error('The given node is not a destination node.');
        }
        this._destinationNodeIds.splice(index, 1);
    };
    StoryNode.prototype.getAcquiredSkillIds = function () {
        return this._acquiredSkillIds.slice();
    };
    StoryNode.prototype.addAcquiredSkillId = function (acquiredSkillid) {
        if (this._acquiredSkillIds.indexOf(acquiredSkillid) !== -1) {
            throw Error('The given skill is already an acquired skill.');
        }
        this._acquiredSkillIds.push(acquiredSkillid);
    };
    StoryNode.prototype.removeAcquiredSkillId = function (skillId) {
        var index = this._acquiredSkillIds.indexOf(skillId);
        if (index === -1) {
            throw Error('The given skill is not an acquired skill.');
        }
        this._acquiredSkillIds.splice(index, 1);
    };
    StoryNode.prototype.getPrerequisiteSkillIds = function () {
        return this._prerequisiteSkillIds.slice();
    };
    StoryNode.prototype.addPrerequisiteSkillId = function (skillId) {
        if (this._prerequisiteSkillIds.indexOf(skillId) !== -1) {
            throw Error('The given skill id is already a prerequisite skill.');
        }
        this._prerequisiteSkillIds.push(skillId);
    };
    StoryNode.prototype.removePrerequisiteSkillId = function (skillId) {
        var index = this._prerequisiteSkillIds.indexOf(skillId);
        if (index === -1) {
            throw Error('The given skill id is not a prerequisite skill.');
        }
        this._prerequisiteSkillIds.splice(index, 1);
    };
    return StoryNode;
}());
exports.StoryNode = StoryNode;
var StoryNodeObjectFactory = /** @class */ (function () {
    function StoryNodeObjectFactory() {
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'storyNodeBackendObject' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    StoryNodeObjectFactory.prototype.createFromBackendDict = function (storyNodeBackendObject) {
        return new StoryNode(storyNodeBackendObject.id, storyNodeBackendObject.title, storyNodeBackendObject.destination_node_ids, storyNodeBackendObject.prerequisite_skill_ids, storyNodeBackendObject.acquired_skill_ids, storyNodeBackendObject.outline, storyNodeBackendObject.outline_is_finalized, storyNodeBackendObject.exploration_id);
    };
    StoryNodeObjectFactory.prototype.createFromIdAndTitle = function (nodeId, title) {
        return new StoryNode(nodeId, title, [], [], [], '', false, null);
    };
    StoryNodeObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], StoryNodeObjectFactory);
    return StoryNodeObjectFactory;
}());
exports.StoryNodeObjectFactory = StoryNodeObjectFactory;
angular.module('oppia').factory('StoryNodeObjectFactory', static_1.downgradeInjectable(StoryNodeObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryObjectFactory.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryObjectFactory.ts ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * story domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var StoryContentsObjectFactory_1 = __webpack_require__(/*! domain/story/StoryContentsObjectFactory */ "./core/templates/dev/head/domain/story/StoryContentsObjectFactory.ts");
var Story = /** @class */ (function () {
    function Story(id, title, description, notes, storyContents, languageCode, version, correspondingTopicId) {
        this._id = id;
        this._title = title;
        this._description = description;
        this._notes = notes;
        this._storyContents = storyContents;
        this._languageCode = languageCode;
        this._version = version;
        this._correspondingTopicId = correspondingTopicId;
    }
    Story.prototype.getId = function () {
        return this._id;
    };
    Story.prototype.getTitle = function () {
        return this._title;
    };
    Story.prototype.setTitle = function (title) {
        this._title = title;
    };
    Story.prototype.getDescription = function () {
        return this._description;
    };
    Story.prototype.setDescription = function (description) {
        this._description = description;
    };
    Story.prototype.getNotes = function () {
        return this._notes;
    };
    Story.prototype.setNotes = function (notes) {
        this._notes = notes;
    };
    Story.prototype.getLanguageCode = function () {
        return this._languageCode;
    };
    Story.prototype.setLanguageCode = function (languageCode) {
        this._languageCode = languageCode;
    };
    Story.prototype.getVersion = function () {
        return this._version;
    };
    Story.prototype.getStoryContents = function () {
        return this._storyContents;
    };
    Story.prototype.getCorrespondingTopicId = function () {
        return this._correspondingTopicId;
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a list with varying element types.
    Story.prototype.validate = function () {
        var issues = [];
        if (this._title === '') {
            issues.push('Story title should not be empty');
        }
        issues = issues.concat(this._storyContents.validate());
        return issues;
    };
    // Reassigns all values within this story to match the existing
    // story. This is performed as a deep copy such that none of the
    // internal, bindable objects are changed within this story.
    Story.prototype.copyFromStory = function (otherStory) {
        this._id = otherStory.getId();
        this.setTitle(otherStory.getTitle());
        this.setDescription(otherStory.getDescription());
        this.setNotes(otherStory.getNotes());
        this.setLanguageCode(otherStory.getLanguageCode());
        this._version = otherStory.getVersion();
        this._storyContents = otherStory.getStoryContents();
        this._correspondingTopicId = otherStory.getCorrespondingTopicId();
    };
    return Story;
}());
exports.Story = Story;
var StoryObjectFactory = /** @class */ (function () {
    function StoryObjectFactory(storyContentsObjectFactory) {
        this.storyContentsObjectFactory = storyContentsObjectFactory;
    }
    StoryObjectFactory.prototype.createFromBackendDict = function (storyBackendDict) {
        return new Story(storyBackendDict.id, storyBackendDict.title, storyBackendDict.description, storyBackendDict.notes, this.storyContentsObjectFactory.createFromBackendDict(storyBackendDict.story_contents), storyBackendDict.language_code, storyBackendDict.version, storyBackendDict.corresponding_topic_id);
    };
    // Create an interstitial story that would be displayed in the editor until
    // the actual story is fetched from the backend.
    StoryObjectFactory.prototype.createInterstitialStory = function () {
        return new Story(null, 'Story title loading', 'Story description loading', 'Story notes loading', null, 'en', 1, null);
    };
    var _a;
    StoryObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof StoryContentsObjectFactory_1.StoryContentsObjectFactory !== "undefined" && StoryContentsObjectFactory_1.StoryContentsObjectFactory) === "function" ? _a : Object])
    ], StoryObjectFactory);
    return StoryObjectFactory;
}());
exports.StoryObjectFactory = StoryObjectFactory;
angular.module('oppia').factory('StoryObjectFactory', static_1.downgradeInjectable(StoryObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryUpdateService.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryUpdateService.ts ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Service to build changes to a story. These changes may
 * then be used by other services, such as a backend API service to update the
 * story in the backend. This service also registers all changes with the
 * undo/redo service.
 */
__webpack_require__(/*! domain/editor/undo_redo/ChangeObjectFactory.ts */ "./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/story/story-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/story/story-domain.constants.ajs.ts");
angular.module('oppia').factory('StoryUpdateService', [
    'ChangeObjectFactory', 'UndoRedoService',
    'CMD_ADD_STORY_NODE', 'CMD_DELETE_STORY_NODE',
    'CMD_UPDATE_STORY_CONTENTS_PROPERTY', 'CMD_UPDATE_STORY_NODE_OUTLINE_STATUS',
    'CMD_UPDATE_STORY_NODE_PROPERTY', 'CMD_UPDATE_STORY_PROPERTY',
    'INITIAL_NODE_ID', 'STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS',
    'STORY_NODE_PROPERTY_DESTINATION_NODE_IDS',
    'STORY_NODE_PROPERTY_EXPLORATION_ID',
    'STORY_NODE_PROPERTY_OUTLINE', 'STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS',
    'STORY_NODE_PROPERTY_TITLE', 'STORY_PROPERTY_DESCRIPTION',
    'STORY_PROPERTY_LANGUAGE_CODE', 'STORY_PROPERTY_NOTES',
    'STORY_PROPERTY_TITLE', function (ChangeObjectFactory, UndoRedoService, CMD_ADD_STORY_NODE, CMD_DELETE_STORY_NODE, CMD_UPDATE_STORY_CONTENTS_PROPERTY, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, CMD_UPDATE_STORY_NODE_PROPERTY, CMD_UPDATE_STORY_PROPERTY, INITIAL_NODE_ID, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, STORY_NODE_PROPERTY_EXPLORATION_ID, STORY_NODE_PROPERTY_OUTLINE, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, STORY_NODE_PROPERTY_TITLE, STORY_PROPERTY_DESCRIPTION, STORY_PROPERTY_LANGUAGE_CODE, STORY_PROPERTY_NOTES, STORY_PROPERTY_TITLE) {
        // Creates a change using an apply function, reverse function, a change
        // command and related parameters. The change is applied to a given
        // story.
        var _applyChange = function (story, command, params, apply, reverse) {
            var changeDict = angular.copy(params);
            changeDict.cmd = command;
            var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
            UndoRedoService.applyChange(changeObj, story);
        };
        var _getParameterFromChangeDict = function (changeDict, paramName) {
            return changeDict[paramName];
        };
        var _getNodeIdFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'node_id');
        };
        var _getStoryNode = function (storyContents, nodeId) {
            var storyNodeIndex = storyContents.getNodeIndex(nodeId);
            if (storyNodeIndex === -1) {
                throw Error('The given node doesn\'t exist');
            }
            return storyContents.getNodes()[storyNodeIndex];
        };
        // Applies a story property change, specifically. See _applyChange()
        // for details on the other behavior of this function.
        var _applyStoryPropertyChange = function (story, propertyName, oldValue, newValue, apply, reverse) {
            _applyChange(story, CMD_UPDATE_STORY_PROPERTY, {
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _applyStoryContentsPropertyChange = function (story, propertyName, oldValue, newValue, apply, reverse) {
            _applyChange(story, CMD_UPDATE_STORY_CONTENTS_PROPERTY, {
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _applyStoryNodePropertyChange = function (story, propertyName, nodeId, oldValue, newValue, apply, reverse) {
            _applyChange(story, CMD_UPDATE_STORY_NODE_PROPERTY, {
                node_id: nodeId,
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _getNewPropertyValueFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'new_value');
        };
        // These functions are associated with updates available in
        // core.domain.story_services.apply_change_list.
        return {
            /**
             * Changes the title of a story and records the change in the
             * undo/redo service.
             */
            setStoryTitle: function (story, title) {
                var oldTitle = angular.copy(story.getTitle());
                _applyStoryPropertyChange(story, STORY_PROPERTY_TITLE, oldTitle, title, function (changeDict, story) {
                    // Apply
                    var title = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setTitle(title);
                }, function (changeDict, story) {
                    // Undo.
                    story.setTitle(oldTitle);
                });
            },
            /**
             * Changes the description of a story and records the change in the
             * undo/redo service.
             */
            setStoryDescription: function (story, description) {
                var oldDescription = angular.copy(story.getDescription());
                _applyStoryPropertyChange(story, STORY_PROPERTY_DESCRIPTION, oldDescription, description, function (changeDict, story) {
                    // Apply
                    var description = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setDescription(description);
                }, function (changeDict, story) {
                    // Undo.
                    story.setDescription(oldDescription);
                });
            },
            /**
             * Changes the notes for a story and records the change in the
             * undo/redo service.
             */
            setStoryNotes: function (story, notes) {
                var oldNotes = angular.copy(story.getNotes());
                _applyStoryPropertyChange(story, STORY_PROPERTY_NOTES, oldNotes, notes, function (changeDict, story) {
                    // Apply
                    var notes = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setNotes(notes);
                }, function (changeDict, story) {
                    // Undo.
                    story.setNotes(oldNotes);
                });
            },
            /**
             * Changes the language code of a story and records the change in
             * the undo/redo service.
             */
            setStoryLanguageCode: function (story, languageCode) {
                var oldLanguageCode = angular.copy(story.getLanguageCode());
                _applyStoryPropertyChange(story, STORY_PROPERTY_LANGUAGE_CODE, oldLanguageCode, languageCode, function (changeDict, story) {
                    // Apply.
                    var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setLanguageCode(languageCode);
                }, function (changeDict, story) {
                    // Undo.
                    story.setLanguageCode(oldLanguageCode);
                });
            },
            /**
             * Sets the initial node of the story and records the change in
             * the undo/redo service.
             */
            setInitialNodeId: function (story, newInitialNodeId) {
                var oldInitialNodeId = angular.copy(story.getStoryContents().getInitialNodeId());
                _applyStoryContentsPropertyChange(story, INITIAL_NODE_ID, oldInitialNodeId, newInitialNodeId, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setInitialNodeId(newInitialNodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setInitialNodeId(oldInitialNodeId);
                });
            },
            /**
             * Creates a story node, adds it to the story and records the change in
             * the undo/redo service.
             */
            addStoryNode: function (story, nodeTitle) {
                var nextNodeId = story.getStoryContents().getNextNodeId();
                _applyChange(story, CMD_ADD_STORY_NODE, {
                    node_id: nextNodeId,
                    title: nodeTitle
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addNode(nodeTitle);
                }, function (changeDict, story) {
                    // Undo.
                    var nodeId = _getNodeIdFromChangeDict(changeDict);
                    story.getStoryContents().deleteNode(nodeId);
                });
            },
            /**
             * Removes a story node, and records the change in the undo/redo service.
             */
            deleteStoryNode: function (story, nodeId) {
                var nodeIndex = story.getStoryContents().getNodeIndex(nodeId);
                _applyChange(story, CMD_DELETE_STORY_NODE, {
                    node_id: nodeId
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().deleteNode(nodeId);
                }, function (changeDict, story) {
                    // Undo.
                    throw Error('A deleted story node cannot be restored.');
                });
            },
            /**
             * Marks the node outline of a node as finalized and records the change
             * in the undo/redo service.
             */
            finalizeStoryNodeOutline: function (story, nodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                if (storyNode.getOutlineStatus()) {
                    throw Error('Node outline is already finalized.');
                }
                _applyChange(story, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
                    node_id: nodeId,
                    old_value: false,
                    new_value: true
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
                });
            },
            /**
             * Marks the node outline of a node as not finalized and records the
             * change in the undo/redo service.
             */
            unfinalizeStoryNodeOutline: function (story, nodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                if (!storyNode.getOutlineStatus()) {
                    throw Error('Node outline is already not finalized.');
                }
                _applyChange(story, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
                    node_id: nodeId,
                    old_value: true,
                    new_value: false
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
                });
            },
            /**
             * Sets the outline of a node of the story and records the change
             * in the undo/redo service.
             */
            setStoryNodeOutline: function (story, nodeId, newOutline) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldOutline = storyNode.getOutline();
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_OUTLINE, nodeId, oldOutline, newOutline, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setNodeOutline(nodeId, newOutline);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setNodeOutline(nodeId, oldOutline);
                });
            },
            /**
             * Sets the title of a node of the story and records the change
             * in the undo/redo service.
             */
            setStoryNodeTitle: function (story, nodeId, newTitle) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldTitle = storyNode.getTitle();
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_TITLE, nodeId, oldTitle, newTitle, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setNodeTitle(nodeId, newTitle);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setNodeTitle(nodeId, oldTitle);
                });
            },
            /**
             * Sets the id of the exploration that of a node of the story is linked
             * to and records the change in the undo/redo service.
             */
            setStoryNodeExplorationId: function (story, nodeId, newExplorationId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldExplorationId = storyNode.getExplorationId();
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_EXPLORATION_ID, nodeId, oldExplorationId, newExplorationId, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setNodeExplorationId(nodeId, newExplorationId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setNodeExplorationId(nodeId, oldExplorationId);
                });
            },
            /**
             * Adds a destination node id to a node of a story and records the change
             * in the undo/redo service.
             */
            addDestinationNodeIdToNode: function (story, nodeId, destinationNodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldDestinationNodeIds = angular.copy(storyNode.getDestinationNodeIds());
                var newDestinationNodeIds = angular.copy(oldDestinationNodeIds);
                newDestinationNodeIds.push(destinationNodeId);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, nodeId, oldDestinationNodeIds, newDestinationNodeIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addDestinationNodeIdToNode(nodeId, destinationNodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().removeDestinationNodeIdFromNode(nodeId, destinationNodeId);
                });
            },
            /**
             * Removes a destination node id from a node of a story and records the
             * change in the undo/redo service.
             */
            removeDestinationNodeIdFromNode: function (story, nodeId, destinationNodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldDestinationNodeIds = angular.copy(storyNode.getDestinationNodeIds());
                var newDestinationNodeIds = angular.copy(oldDestinationNodeIds);
                var index = newDestinationNodeIds.indexOf(destinationNodeId);
                if (index === -1) {
                    throw Error('The given destination node is not part of the node');
                }
                newDestinationNodeIds.splice(index, 1);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, nodeId, oldDestinationNodeIds, newDestinationNodeIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().removeDestinationNodeIdFromNode(nodeId, destinationNodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().addDestinationNodeIdToNode(nodeId, destinationNodeId);
                });
            },
            /**
             * Adds a prerequisite skill id to a node of a story and records the
             * change in the undo/redo service.
             */
            addPrerequisiteSkillIdToNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldPrerequisiteSkillIds = angular.copy(storyNode.getPrerequisiteSkillIds());
                var newPrerequisiteSkillIds = angular.copy(oldPrerequisiteSkillIds);
                newPrerequisiteSkillIds.push(skillId);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, nodeId, oldPrerequisiteSkillIds, newPrerequisiteSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addPrerequisiteSkillIdToNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().removePrerequisiteSkillIdFromNode(nodeId, skillId);
                });
            },
            /**
             * Removes a prerequisite skill id from a node of a story and records the
             * change in the undo/redo service.
             */
            removePrerequisiteSkillIdFromNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldPrerequisiteSkillIds = angular.copy(storyNode.getPrerequisiteSkillIds());
                var newPrerequisiteSkillIds = angular.copy(oldPrerequisiteSkillIds);
                var index = newPrerequisiteSkillIds.indexOf(skillId);
                if (index === -1) {
                    throw Error('The given prerequisite skill is not part of the node');
                }
                newPrerequisiteSkillIds.splice(index, 1);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, nodeId, oldPrerequisiteSkillIds, newPrerequisiteSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().removePrerequisiteSkillIdFromNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().addPrerequisiteSkillIdToNode(nodeId, skillId);
                });
            },
            /**
             * Adds an acquired skill id to a node of a story and records the change
             * in the undo/redo service.
             */
            addAcquiredSkillIdToNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldAcquiredSkillIds = angular.copy(storyNode.getAcquiredSkillIds());
                var newAcquiredSkillIds = angular.copy(oldAcquiredSkillIds);
                newAcquiredSkillIds.push(skillId);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, nodeId, oldAcquiredSkillIds, newAcquiredSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addAcquiredSkillIdToNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().removeAcquiredSkillIdFromNode(nodeId, skillId);
                });
            },
            /**
             * Removes an acquired skill id from a node of a story and records the
             * change in the undo/redo service.
             */
            removeAcquiredSkillIdFromNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldAcquiredSkillIds = angular.copy(storyNode.getAcquiredSkillIds());
                var newAcquiredSkillIds = angular.copy(oldAcquiredSkillIds);
                var index = newAcquiredSkillIds.indexOf(skillId);
                if (index === -1) {
                    throw Error('The given acquired skill id is not part of the node');
                }
                newAcquiredSkillIds.splice(index, 1);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, nodeId, oldAcquiredSkillIds, newAcquiredSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().removeAcquiredSkillIdFromNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().addAcquiredSkillIdToNode(nodeId, skillId);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/story-domain.constants.ajs.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/story-domain.constants.ajs.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for story domain.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var story_domain_constants_1 = __webpack_require__(/*! domain/story/story-domain.constants */ "./core/templates/dev/head/domain/story/story-domain.constants.ts");
angular.module('oppia').constant('EDITABLE_STORY_DATA_URL_TEMPLATE', story_domain_constants_1.StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE);
angular.module('oppia').constant('STORY_PUBLISH_URL_TEMPLATE', story_domain_constants_1.StoryDomainConstants.STORY_PUBLISH_URL_TEMPLATE);
// These should match the constants defined in core.domain.story_domain.
angular.module('oppia').constant('CMD_ADD_STORY_NODE', story_domain_constants_1.StoryDomainConstants.CMD_ADD_STORY_NODE);
angular.module('oppia').constant('CMD_DELETE_STORY_NODE', story_domain_constants_1.StoryDomainConstants.CMD_DELETE_STORY_NODE);
angular.module('oppia').constant('CMD_UPDATE_STORY_NODE_OUTLINE_STATUS', story_domain_constants_1.StoryDomainConstants.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS);
angular.module('oppia').constant('CMD_UPDATE_STORY_PROPERTY', story_domain_constants_1.StoryDomainConstants.CMD_UPDATE_STORY_PROPERTY);
angular.module('oppia').constant('CMD_UPDATE_STORY_NODE_PROPERTY', story_domain_constants_1.StoryDomainConstants.CMD_UPDATE_STORY_NODE_PROPERTY);
angular.module('oppia').constant('CMD_UPDATE_STORY_CONTENTS_PROPERTY', story_domain_constants_1.StoryDomainConstants.CMD_UPDATE_STORY_CONTENTS_PROPERTY);
angular.module('oppia').constant('STORY_PROPERTY_TITLE', story_domain_constants_1.StoryDomainConstants.STORY_PROPERTY_TITLE);
angular.module('oppia').constant('STORY_PROPERTY_DESCRIPTION', story_domain_constants_1.StoryDomainConstants.STORY_PROPERTY_DESCRIPTION);
angular.module('oppia').constant('STORY_PROPERTY_NOTES', story_domain_constants_1.StoryDomainConstants.STORY_PROPERTY_NOTES);
angular.module('oppia').constant('STORY_PROPERTY_LANGUAGE_CODE', story_domain_constants_1.StoryDomainConstants.STORY_PROPERTY_LANGUAGE_CODE);
angular.module('oppia').constant('INITIAL_NODE_ID', story_domain_constants_1.StoryDomainConstants.INITIAL_NODE_ID);
angular.module('oppia').constant('STORY_NODE_PROPERTY_TITLE', story_domain_constants_1.StoryDomainConstants.STORY_NODE_PROPERTY_TITLE);
angular.module('oppia').constant('STORY_NODE_PROPERTY_OUTLINE', story_domain_constants_1.StoryDomainConstants.STORY_NODE_PROPERTY_OUTLINE);
angular.module('oppia').constant('STORY_NODE_PROPERTY_EXPLORATION_ID', story_domain_constants_1.StoryDomainConstants.STORY_NODE_PROPERTY_EXPLORATION_ID);
angular.module('oppia').constant('STORY_NODE_PROPERTY_DESTINATION_NODE_IDS', story_domain_constants_1.StoryDomainConstants.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS);
angular.module('oppia').constant('STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS', story_domain_constants_1.StoryDomainConstants.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS);
angular.module('oppia').constant('STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS', story_domain_constants_1.StoryDomainConstants.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/story-domain.constants.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/story-domain.constants.ts ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for story domain.
 */
var StoryDomainConstants = /** @class */ (function () {
    function StoryDomainConstants() {
    }
    StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE = '/story_editor_handler/data/<story_id>';
    StoryDomainConstants.STORY_PUBLISH_URL_TEMPLATE = '/story_publish_handler/<story_id>';
    // These should match the constants defined in core.domain.story_domain.
    StoryDomainConstants.CMD_ADD_STORY_NODE = 'add_story_node';
    StoryDomainConstants.CMD_DELETE_STORY_NODE = 'delete_story_node';
    StoryDomainConstants.CMD_UPDATE_STORY_NODE_OUTLINE_STATUS = 'update_story_node_outline_status';
    StoryDomainConstants.CMD_UPDATE_STORY_PROPERTY = 'update_story_property';
    StoryDomainConstants.CMD_UPDATE_STORY_NODE_PROPERTY = 'update_story_node_property';
    StoryDomainConstants.CMD_UPDATE_STORY_CONTENTS_PROPERTY = 'update_story_contents_property';
    StoryDomainConstants.STORY_PROPERTY_TITLE = 'title';
    StoryDomainConstants.STORY_PROPERTY_DESCRIPTION = 'description';
    StoryDomainConstants.STORY_PROPERTY_NOTES = 'notes';
    StoryDomainConstants.STORY_PROPERTY_LANGUAGE_CODE = 'language_code';
    StoryDomainConstants.INITIAL_NODE_ID = 'initial_node_id';
    StoryDomainConstants.STORY_NODE_PROPERTY_TITLE = 'title';
    StoryDomainConstants.STORY_NODE_PROPERTY_OUTLINE = 'outline';
    StoryDomainConstants.STORY_NODE_PROPERTY_EXPLORATION_ID = 'exploration_id';
    StoryDomainConstants.STORY_NODE_PROPERTY_DESTINATION_NODE_IDS = 'destination_node_ids';
    StoryDomainConstants.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS = 'acquired_skill_ids';
    StoryDomainConstants.STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS = 'prerequisite_skill_ids';
    return StoryDomainConstants;
}());
exports.StoryDomainConstants = StoryDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/editor-tab/story-editor.directive.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/editor-tab/story-editor.directive.ts ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Controller for the main story editor.
 */
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts");
__webpack_require__(/*! pages/story-editor-page/editor-tab/story-node-editor.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/editor-tab/story-node-editor.directive.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/story/StoryUpdateService.ts */ "./core/templates/dev/head/domain/story/StoryUpdateService.ts");
__webpack_require__(/*! pages/story-editor-page/services/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/services/story-editor-state.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts");
angular.module('oppia').directive('storyEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/editor-tab/story-editor.directive.html'),
            controller: [
                '$scope', 'StoryEditorStateService', 'StoryUpdateService',
                'UndoRedoService', 'EVENT_VIEW_STORY_NODE_EDITOR', '$uibModal',
                'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED', 'AlertsService',
                function ($scope, StoryEditorStateService, StoryUpdateService, UndoRedoService, EVENT_VIEW_STORY_NODE_EDITOR, $uibModal, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, AlertsService) {
                    var _init = function () {
                        $scope.story = StoryEditorStateService.getStory();
                        $scope.storyContents = $scope.story.getStoryContents();
                        if ($scope.storyContents) {
                            $scope.setNodeToEdit($scope.storyContents.getInitialNodeId());
                        }
                        _initEditor();
                    };
                    var _initEditor = function () {
                        $scope.story = StoryEditorStateService.getStory();
                        $scope.storyContents = $scope.story.getStoryContents();
                        $scope.disconnectedNodeIds = [];
                        if ($scope.storyContents) {
                            $scope.nodes = $scope.storyContents.getNodes();
                            $scope.disconnectedNodeIds =
                                $scope.storyContents.getDisconnectedNodeIds();
                        }
                        $scope.notesEditorIsShown = false;
                        $scope.storyTitleEditorIsShown = false;
                        $scope.editableTitle = $scope.story.getTitle();
                        $scope.editableNotes = $scope.story.getNotes();
                        $scope.editableDescription = $scope.story.getDescription();
                        $scope.editableDescriptionIsEmpty = ($scope.editableDescription === '');
                        $scope.storyDescriptionChanged = false;
                    };
                    $scope.setNodeToEdit = function (nodeId) {
                        $scope.idOfNodeToEdit = nodeId;
                    };
                    $scope.openNotesEditor = function () {
                        $scope.notesEditorIsShown = true;
                    };
                    $scope.closeNotesEditor = function () {
                        $scope.notesEditorIsShown = false;
                    };
                    $scope.isInitialNode = function (nodeId) {
                        return ($scope.story.getStoryContents().getInitialNodeId() === nodeId);
                    };
                    $scope.markAsInitialNode = function (nodeId) {
                        if ($scope.isInitialNode(nodeId)) {
                            return;
                        }
                        StoryUpdateService.setInitialNodeId($scope.story, nodeId);
                        _initEditor();
                    };
                    $scope.deleteNode = function (nodeId) {
                        if ($scope.isInitialNode(nodeId)) {
                            AlertsService.addInfoMessage('Cannot delete the first chapter of a story.', 3000);
                            return;
                        }
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/modal-templates/' +
                                'delete-chapter-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.confirmDeletion = function () {
                                        $uibModalInstance.close();
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (title) {
                            StoryUpdateService.deleteStoryNode($scope.story, nodeId);
                        });
                    };
                    $scope.createNode = function () {
                        var nodeTitles = $scope.nodes.map(function (node) {
                            return node.getTitle();
                        });
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/modal-templates/' +
                                'new-chapter-title-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.nodeTitle = '';
                                    $scope.nodeTitles = nodeTitles;
                                    $scope.errorMsg = null;
                                    $scope.resetErrorMsg = function () {
                                        $scope.errorMsg = null;
                                    };
                                    $scope.isNodeTitleEmpty = function (nodeTitle) {
                                        return (nodeTitle === '');
                                    };
                                    $scope.save = function (title) {
                                        if ($scope.nodeTitles.indexOf(title) !== -1) {
                                            $scope.errorMsg =
                                                'A chapter with this title already exists';
                                            return;
                                        }
                                        $uibModalInstance.close(title);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (title) {
                            StoryUpdateService.addStoryNode($scope.story, title);
                            _initEditor();
                            // If the first node is added, open it just after creation.
                            if ($scope.story.getStoryContents().getNodes().length === 1) {
                                $scope.setNodeToEdit($scope.story.getStoryContents().getInitialNodeId());
                            }
                        });
                    };
                    $scope.NOTES_SCHEMA = {
                        type: 'html',
                        ui_config: {
                            startupFocusEnabled: false
                        }
                    };
                    $scope.updateNotes = function (newNotes) {
                        if (newNotes === $scope.story.getNotes()) {
                            return;
                        }
                        StoryUpdateService.setStoryNotes($scope.story, newNotes);
                        _initEditor();
                    };
                    $scope.updateStoryDescriptionStatus = function (description) {
                        $scope.editableDescriptionIsEmpty = (description === '');
                        $scope.storyDescriptionChanged = true;
                    };
                    $scope.updateStoryTitle = function (newTitle) {
                        if (newTitle === $scope.story.getTitle()) {
                            return;
                        }
                        StoryUpdateService.setStoryTitle($scope.story, newTitle);
                    };
                    $scope.updateStoryDescription = function (newDescription) {
                        if (newDescription !== $scope.story.getDescription()) {
                            StoryUpdateService.setStoryDescription($scope.story, newDescription);
                        }
                    };
                    $scope.$on(EVENT_VIEW_STORY_NODE_EDITOR, function (evt, nodeId) {
                        $scope.setNodeToEdit(nodeId);
                    });
                    $scope.$on('storyGraphUpdated', function (evt, storyContents) {
                        _initEditor();
                    });
                    $scope.$on(EVENT_STORY_INITIALIZED, _init);
                    $scope.$on(EVENT_STORY_REINITIALIZED, _initEditor);
                    _init();
                    _initEditor();
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/editor-tab/story-node-editor.directive.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/editor-tab/story-node-editor.directive.ts ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Controller for the story node editor.
 */
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/story/StoryUpdateService.ts */ "./core/templates/dev/head/domain/story/StoryUpdateService.ts");
__webpack_require__(/*! pages/story-editor-page/services/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/services/story-editor-state.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts");
angular.module('oppia').directive('storyNodeEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getId: '&nodeId',
                getOutline: '&outline',
                getExplorationId: '&explorationId',
                isOutlineFinalized: '&outlineFinalized',
                getDestinationNodeIds: '&destinationNodeIds',
                getPrerequisiteSkillIds: '&prerequisiteSkillIds',
                getAcquiredSkillIds: '&acquiredSkillIds'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/editor-tab/story-node-editor.directive.html'),
            controller: [
                '$scope', '$rootScope', '$uibModal', 'StoryEditorStateService',
                'StoryUpdateService', 'UndoRedoService', 'EVENT_STORY_INITIALIZED',
                'EVENT_STORY_REINITIALIZED', 'EVENT_VIEW_STORY_NODE_EDITOR',
                'AlertsService',
                function ($scope, $rootScope, $uibModal, StoryEditorStateService, StoryUpdateService, UndoRedoService, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, EVENT_VIEW_STORY_NODE_EDITOR, AlertsService) {
                    var _recalculateAvailableNodes = function () {
                        $scope.newNodeId = null;
                        $scope.availableNodes = [];
                        for (var i = 0; i < $scope.storyNodeIds.length; i++) {
                            if ($scope.storyNodeIds[i] === $scope.getId()) {
                                continue;
                            }
                            if ($scope.getDestinationNodeIds().indexOf($scope.storyNodeIds[i]) !== -1) {
                                continue;
                            }
                            $scope.availableNodes.push({
                                id: $scope.storyNodeIds[i],
                                text: $scope.nodeIdToTitleMap[$scope.storyNodeIds[i]]
                            });
                        }
                    };
                    var _init = function () {
                        $scope.story = StoryEditorStateService.getStory();
                        $scope.storyNodeIds = $scope.story.getStoryContents().getNodeIds();
                        $scope.nodeIdToTitleMap =
                            $scope.story.getStoryContents().getNodeIdsToTitleMap($scope.storyNodeIds);
                        _recalculateAvailableNodes();
                        $scope.currentTitle = $scope.nodeIdToTitleMap[$scope.getId()];
                        $scope.editableTitle = $scope.currentTitle;
                        $scope.oldOutline = $scope.getOutline();
                        $scope.editableOutline = $scope.getOutline();
                        $scope.explorationId = $scope.getExplorationId();
                        $scope.currentExplorationId = $scope.explorationId;
                        $scope.nodeTitleEditorIsShown = false;
                        $scope.OUTLINE_SCHEMA = {
                            type: 'html',
                            ui_config: {
                                rows: 100
                            }
                        };
                    };
                    $scope.getSkillEditorUrl = function (skillId) {
                        return '/skill_editor/' + skillId;
                    };
                    // Regex pattern for exploration id, EXPLORATION_AND_SKILL_ID_PATTERN
                    // is not being used here, as the chapter of the story can be saved
                    // with empty exploration id.
                    $scope.explorationIdPattern = /^[a-zA-Z0-9_-]*$/;
                    $scope.canSaveExpId = true;
                    $scope.checkCanSaveExpId = function () {
                        $scope.canSaveExpId = $scope.explorationIdPattern.test($scope.explorationId);
                    };
                    $scope.updateTitle = function (newTitle) {
                        if (newTitle === $scope.currentTitle) {
                            return;
                        }
                        StoryUpdateService.setStoryNodeTitle($scope.story, $scope.getId(), newTitle);
                        $scope.currentTitle = newTitle;
                    };
                    $scope.viewNodeEditor = function (nodeId) {
                        $rootScope.$broadcast(EVENT_VIEW_STORY_NODE_EDITOR, nodeId);
                    };
                    $scope.finalizeOutline = function () {
                        StoryUpdateService.finalizeStoryNodeOutline($scope.story, $scope.getId());
                    };
                    $scope.updateExplorationId = function (explorationId) {
                        StoryUpdateService.setStoryNodeExplorationId($scope.story, $scope.getId(), explorationId);
                        $scope.currentExplorationId = explorationId;
                    };
                    $scope.addPrerequisiteSkillId = function (skillId) {
                        if (!skillId) {
                            return;
                        }
                        try {
                            StoryUpdateService.addPrerequisiteSkillIdToNode($scope.story, $scope.getId(), skillId);
                        }
                        catch (err) {
                            AlertsService.addWarning('Given skill is already a prerequisite skill');
                        }
                        $scope.prerequisiteSkillId = null;
                    };
                    $scope.removePrerequisiteSkillId = function (skillId) {
                        StoryUpdateService.removePrerequisiteSkillIdFromNode($scope.story, $scope.getId(), skillId);
                    };
                    $scope.addAcquiredSkillId = function (skillId) {
                        if (!skillId) {
                            return;
                        }
                        try {
                            StoryUpdateService.addAcquiredSkillIdToNode($scope.story, $scope.getId(), skillId);
                        }
                        catch (err) {
                            AlertsService.addWarning('Given skill is already an acquired skill');
                        }
                        $scope.acquiredSkillId = null;
                    };
                    $scope.removeAcquiredSkillId = function (skillId) {
                        StoryUpdateService.removeAcquiredSkillIdFromNode($scope.story, $scope.getId(), skillId);
                    };
                    $scope.unfinalizeOutline = function () {
                        StoryUpdateService.unfinalizeStoryNodeOutline($scope.story, $scope.getId());
                    };
                    $scope.addNewDestinationNode = function () {
                        var nodeTitles = $scope.story.getStoryContents().getNodes().map(function (node) {
                            return node.getTitle();
                        });
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/modal-templates/' +
                                'new-chapter-title-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.nodeTitle = '';
                                    $scope.nodeTitles = nodeTitles;
                                    $scope.errorMsg = null;
                                    $scope.resetErrorMsg = function () {
                                        $scope.errorMsg = null;
                                    };
                                    $scope.isNodeTitleEmpty = function (nodeTitle) {
                                        return (nodeTitle === '');
                                    };
                                    $scope.save = function (title) {
                                        if ($scope.nodeTitles.indexOf(title) !== -1) {
                                            $scope.errorMsg =
                                                'A chapter with this title already exists';
                                            return;
                                        }
                                        $uibModalInstance.close(title);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (title) {
                            var nextNodeId = $scope.story.getStoryContents().getNextNodeId();
                            StoryUpdateService.addStoryNode($scope.story, title);
                            StoryUpdateService.addDestinationNodeIdToNode($scope.story, $scope.getId(), nextNodeId);
                            _init();
                            _recalculateAvailableNodes();
                        });
                    };
                    $scope.addDestinationNode = function (nodeId) {
                        if (!nodeId) {
                            return;
                        }
                        if (nodeId === $scope.getId()) {
                            AlertsService.addInfoMessage('A chapter cannot lead to itself.', 3000);
                            return;
                        }
                        try {
                            StoryUpdateService.addDestinationNodeIdToNode($scope.story, $scope.getId(), nodeId);
                        }
                        catch (error) {
                            AlertsService.addInfoMessage('The given chapter is already a destination for current ' +
                                'chapter', 3000);
                            return;
                        }
                        $rootScope.$broadcast('storyGraphUpdated', $scope.story.getStoryContents());
                        _recalculateAvailableNodes();
                    };
                    $scope.removeDestinationNodeId = function (nodeId) {
                        StoryUpdateService.removeDestinationNodeIdFromNode($scope.story, $scope.getId(), nodeId);
                        $rootScope.$broadcast('storyGraphUpdated', $scope.story.getStoryContents());
                        _recalculateAvailableNodes();
                    };
                    $scope.openNodeTitleEditor = function () {
                        $scope.nodeTitleEditorIsShown = true;
                    };
                    $scope.closeNodeTitleEditor = function () {
                        $scope.nodeTitleEditorIsShown = false;
                    };
                    $scope.isOutlineModified = function (outline) {
                        return ($scope.oldOutline !== outline);
                    };
                    $scope.updateOutline = function (newOutline) {
                        if (!$scope.isOutlineModified(newOutline)) {
                            return;
                        }
                        StoryUpdateService.setStoryNodeOutline($scope.story, $scope.getId(), newOutline);
                        $scope.oldOutline = newOutline;
                    };
                    $scope.$on(EVENT_STORY_INITIALIZED, _init);
                    $scope.$on(EVENT_STORY_REINITIALIZED, _init);
                    _init();
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Controller for the navbar breadcrumb of the story editor.
 */
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/story-editor-page/services/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/services/story-editor-state.service.ts");
__webpack_require__(/*! pages/story-editor-page/editor-tab/story-editor.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/editor-tab/story-editor.directive.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts");
angular.module('oppia').directive('storyEditorNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/navbar/' +
                'story-editor-navbar-breadcrumb.directive.html'),
            controller: [
                '$scope', '$uibModal', '$window', 'UrlService',
                'UrlInterpolationService', 'UndoRedoService', 'StoryEditorStateService',
                'EVENT_STORY_INITIALIZED',
                function ($scope, $uibModal, $window, UrlService, UrlInterpolationService, UndoRedoService, StoryEditorStateService, EVENT_STORY_INITIALIZED) {
                    $scope.story = StoryEditorStateService.getStory();
                    var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
                    $scope.$on(EVENT_STORY_INITIALIZED, function () {
                        $scope.topicName = StoryEditorStateService.getTopicName();
                    });
                    $scope.returnToTopicEditorPage = function () {
                        if (UndoRedoService.getChangeCount() > 0) {
                            var modalInstance = $uibModal.open({
                                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/modal-templates/' +
                                    'save-pending-changes-modal.template.html'),
                                backdrop: true,
                                controller: [
                                    '$scope', '$uibModalInstance',
                                    function ($scope, $uibModalInstance) {
                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                    }
                                ]
                            });
                        }
                        else {
                            $window.open(UrlInterpolationService.interpolateUrl(TOPIC_EDITOR_URL_TEMPLATE, {
                                topicId: $scope.story.getCorrespondingTopicId()
                            }), '_self');
                        }
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar.directive.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar.directive.ts ***!
  \*************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for the navbar of the story editor.
 */
__webpack_require__(/*! components/common-layout-directives/common-elements/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts");
__webpack_require__(/*! domain/editor/undo_redo/BaseUndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/story-editor-page/services/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/services/story-editor-state.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts");
angular.module('oppia').directive('storyEditorNavbar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/navbar/story-editor-navbar.directive.html'),
            controller: [
                '$scope', '$rootScope', '$uibModal', 'AlertsService',
                'UndoRedoService', 'StoryEditorStateService', 'UrlService',
                'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
                'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
                function ($scope, $rootScope, $uibModal, AlertsService, UndoRedoService, StoryEditorStateService, UrlService, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
                    $scope.story = StoryEditorStateService.getStory();
                    $scope.isStoryPublished = StoryEditorStateService.isStoryPublished;
                    $scope.isSaveInProgress = StoryEditorStateService.isSavingStory;
                    $scope.validationIssues = [];
                    $scope.getChangeListLength = function () {
                        return UndoRedoService.getChangeCount();
                    };
                    $scope.getWarningsCount = function () {
                        return $scope.validationIssues.length;
                    };
                    $scope.isStorySaveable = function () {
                        return ($scope.getChangeListLength() > 0 &&
                            $scope.getWarningsCount() === 0);
                    };
                    $scope.discardChanges = function () {
                        UndoRedoService.clearChanges();
                        StoryEditorStateService.loadStory($scope.story.getId());
                    };
                    var _validateStory = function () {
                        $scope.validationIssues = $scope.story.validate();
                    };
                    $scope.saveChanges = function () {
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/modal-templates/' +
                                'story-editor-save-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.save = function (commitMessage) {
                                        $uibModalInstance.close(commitMessage);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (commitMessage) {
                            StoryEditorStateService.saveStory(commitMessage);
                        });
                    };
                    $scope.publishStory = function () {
                        StoryEditorStateService.changeStoryPublicationStatus(true, function () {
                            $scope.storyIsPublished =
                                StoryEditorStateService.isStoryPublished();
                        });
                    };
                    $scope.unpublishStory = function () {
                        StoryEditorStateService.changeStoryPublicationStatus(false, function () {
                            $scope.storyIsPublished =
                                StoryEditorStateService.isStoryPublished();
                        });
                    };
                    $scope.$on(EVENT_STORY_INITIALIZED, _validateStory);
                    $scope.$on(EVENT_STORY_REINITIALIZED, _validateStory);
                    $scope.$on(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateStory);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/services/story-editor-state.service.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/services/story-editor-state.service.ts ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Service to maintain the state of a single story shared
 * throughout the story editor. This service provides functionality for
 * retrieving the story, saving it, and listening for changes.
 */
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/story/EditableStoryBackendApiService.ts */ "./core/templates/dev/head/domain/story/EditableStoryBackendApiService.ts");
__webpack_require__(/*! domain/story/StoryObjectFactory.ts */ "./core/templates/dev/head/domain/story/StoryObjectFactory.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts");
angular.module('oppia').factory('StoryEditorStateService', [
    '$rootScope', 'AlertsService', 'EditableStoryBackendApiService',
    'StoryObjectFactory', 'UndoRedoService',
    'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
    function ($rootScope, AlertsService, EditableStoryBackendApiService, StoryObjectFactory, UndoRedoService, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED) {
        var _story = StoryObjectFactory.createInterstitialStory();
        var _storyIsInitialized = false;
        var _storyIsLoading = false;
        var _storyIsBeingSaved = false;
        var _topicName = null;
        var _storyIsPublished = false;
        var _setStory = function (story) {
            _story.copyFromStory(story);
            if (_storyIsInitialized) {
                $rootScope.$broadcast(EVENT_STORY_REINITIALIZED);
            }
            else {
                $rootScope.$broadcast(EVENT_STORY_INITIALIZED);
                _storyIsInitialized = true;
            }
        };
        var _setTopicName = function (topicName) {
            _topicName = topicName;
        };
        var _setStoryPublicationStatus = function (storyIsPublished) {
            _storyIsPublished = storyIsPublished;
        };
        var _updateStory = function (newBackendStoryObject) {
            _setStory(StoryObjectFactory.createFromBackendDict(newBackendStoryObject));
        };
        return {
            /**
             * Loads, or reloads, the story stored by this service given a
             * specified story ID. See setStory() for more information on
             * additional behavior of this function.
             */
            loadStory: function (storyId) {
                _storyIsLoading = true;
                EditableStoryBackendApiService.fetchStory(storyId).then(function (newBackendStoryObject) {
                    _setTopicName(newBackendStoryObject.topicName);
                    _updateStory(newBackendStoryObject.story);
                    _setStoryPublicationStatus(newBackendStoryObject.storyIsPublished);
                    _storyIsLoading = false;
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when loading the story.');
                    _storyIsLoading = false;
                });
            },
            /**
             * Returns whether this service is currently attempting to load the
             * story maintained by this service.
             */
            isLoadingStory: function () {
                return _storyIsLoading;
            },
            /**
             * Returns whether a story has yet been loaded using either
             * loadStory() or setStory().
             */
            hasLoadedStory: function () {
                return _storyIsInitialized;
            },
            /**
             * Returns the current story to be shared among the story
             * editor. Please note any changes to this story will be propogated
             * to all bindings to it. This story object will be retained for the
             * lifetime of the editor. This function never returns null, though it may
             * return an empty story object if the story has not yet been
             * loaded for this editor instance.
             */
            getStory: function () {
                return _story;
            },
            /**
             * Sets the story stored within this service, propogating changes to
             * all bindings to the story returned by getStory(). The first
             * time this is called it will fire a global event based on the
             * EVENT_STORY_INITIALIZED constant. All subsequent
             * calls will similarly fire a EVENT_STORY_REINITIALIZED event.
             */
            setStory: function (story) {
                _setStory(story);
            },
            getTopicName: function () {
                return _topicName;
            },
            isStoryPublished: function () {
                return _storyIsPublished;
            },
            /**
             * Attempts to save the current story given a commit message. This
             * function cannot be called until after a story has been initialized
             * in this service. Returns false if a save is not performed due to no
             * changes pending, or true if otherwise. This function, upon success,
             * will clear the UndoRedoService of pending changes. This function also
             * shares behavior with setStory(), when it succeeds.
             */
            saveStory: function (commitMessage, successCallback) {
                if (!_storyIsInitialized) {
                    AlertsService.fatalWarning('Cannot save a story before one is loaded.');
                }
                // Don't attempt to save the story if there are no changes pending.
                if (!UndoRedoService.hasChanges()) {
                    return false;
                }
                _storyIsBeingSaved = true;
                EditableStoryBackendApiService.updateStory(_story.getId(), _story.getVersion(), commitMessage, UndoRedoService.getCommittableChangeList()).then(function (storyBackendObject) {
                    _updateStory(storyBackendObject);
                    UndoRedoService.clearChanges();
                    _storyIsBeingSaved = false;
                    if (successCallback) {
                        successCallback();
                    }
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when saving the story.');
                    _storyIsBeingSaved = false;
                });
                return true;
            },
            changeStoryPublicationStatus: function (newStoryStatusIsPublic, successCallback) {
                if (!_storyIsInitialized) {
                    AlertsService.fatalWarning('Cannot publish a story before one is loaded.');
                }
                EditableStoryBackendApiService.changeStoryPublicationStatus(_story.getId(), newStoryStatusIsPublic).then(function (storyBackendObject) {
                    _setStoryPublicationStatus(newStoryStatusIsPublic);
                    if (successCallback) {
                        successCallback();
                    }
                }, function (error) {
                    AlertsService.addWarning(error ||
                        'There was an error when publishing/unpublishing the story.');
                });
                return true;
            },
            /**
             * Returns whether this service is currently attempting to save the
             * story maintained by this service.
             */
            isSavingStory: function () {
                return _storyIsBeingSaved;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Primary controller for the story editor page.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var story_editor_page_constants_1 = __webpack_require__(/*! pages/story-editor-page/story-editor-page.constants */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ts");
angular.module('oppia').constant('NODE_ID_PREFIX', story_editor_page_constants_1.StoryEditorPageConstants.NODE_ID_PREFIX);
angular.module('oppia').constant('EVENT_STORY_INITIALIZED', story_editor_page_constants_1.StoryEditorPageConstants.EVENT_STORY_INITIALIZED);
angular.module('oppia').constant('EVENT_STORY_REINITIALIZED', story_editor_page_constants_1.StoryEditorPageConstants.EVENT_STORY_REINITIALIZED);
angular.module('oppia').constant('EVENT_VIEW_STORY_NODE_EDITOR', story_editor_page_constants_1.StoryEditorPageConstants.EVENT_VIEW_STORY_NODE_EDITOR);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ts ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Primary controller for the story editor page.
 */
var StoryEditorPageConstants = /** @class */ (function () {
    function StoryEditorPageConstants() {
    }
    StoryEditorPageConstants.NODE_ID_PREFIX = 'node_';
    StoryEditorPageConstants.EVENT_STORY_INITIALIZED = 'storyInitialized';
    StoryEditorPageConstants.EVENT_STORY_REINITIALIZED = 'storyReinitialized';
    StoryEditorPageConstants.EVENT_VIEW_STORY_NODE_EDITOR = 'viewStoryNodeEditor';
    return StoryEditorPageConstants;
}());
exports.StoryEditorPageConstants = StoryEditorPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Primary controller for the story editor page.
 */
__webpack_require__(/*! objects/objectComponentsRequires.ts */ "./extensions/objects/objectComponentsRequires.ts");
__webpack_require__(/*! pages/interaction-specs.constants.ajs.ts */ "./core/templates/dev/head/pages/interaction-specs.constants.ajs.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts");
__webpack_require__(/*! directives/angular-html-bind.directive.ts */ "./core/templates/dev/head/directives/angular-html-bind.directive.ts");
__webpack_require__(/*! pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/story-editor-page/navbar/story-editor-navbar.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar.directive.ts");
__webpack_require__(/*! pages/story-editor-page/editor-tab/story-editor.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/editor-tab/story-editor.directive.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/story-editor-page/services/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/services/story-editor-state.service.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ajs.ts");
angular.module('oppia').directive('storyEditorPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$uibModal', '$window', 'PageTitleService',
                'StoryEditorStateService', 'UndoRedoService',
                'UrlInterpolationService', 'UrlService',
                'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
                function ($scope, $uibModal, $window, PageTitleService, StoryEditorStateService, UndoRedoService, UrlInterpolationService, UrlService, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED) {
                    var ctrl = this;
                    var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
                    StoryEditorStateService.loadStory(UrlService.getStoryIdFromUrl());
                    ctrl.returnToTopicEditorPage = function () {
                        if (UndoRedoService.getChangeCount() > 0) {
                            var modalInstance = $uibModal.open({
                                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/modal-templates/' +
                                    'save-pending-changes-modal.template.html'),
                                backdrop: true,
                                controller: [
                                    '$scope', '$uibModalInstance',
                                    function ($scope, $uibModalInstance) {
                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                    }
                                ]
                            });
                        }
                        else {
                            $window.open(UrlInterpolationService.interpolateUrl(TOPIC_EDITOR_URL_TEMPLATE, {
                                topicId: StoryEditorStateService.
                                    getStory().getCorrespondingTopicId()
                            }), '_self');
                        }
                    };
                    var setPageTitle = function () {
                        PageTitleService.setPageTitle(StoryEditorStateService.getStory().getTitle() + ' - Oppia');
                    };
                    $scope.$on(EVENT_STORY_INITIALIZED, setPageTitle);
                    $scope.$on(EVENT_STORY_REINITIALIZED, setPageTitle);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.module.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-page.module.ts ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Module for the story editor page.
 */
__webpack_require__(/*! core-js/es7/reflect */ "./node_modules/core-js/es7/reflect.js");
__webpack_require__(/*! zone.js */ "./node_modules/zone.js/dist/zone.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
// This component is needed to force-bootstrap Angular at the beginning of the
// app.
var ServiceBootstrapComponent = /** @class */ (function () {
    function ServiceBootstrapComponent() {
    }
    ServiceBootstrapComponent = __decorate([
        core_1.Component({
            selector: 'service-bootstrap',
            template: ''
        })
    ], ServiceBootstrapComponent);
    return ServiceBootstrapComponent;
}());
exports.ServiceBootstrapComponent = ServiceBootstrapComponent;
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var editor_domain_constants_1 = __webpack_require__(/*! domain/editor/editor-domain.constants */ "./core/templates/dev/head/domain/editor/editor-domain.constants.ts");
var interactions_extension_constants_1 = __webpack_require__(/*! interactions/interactions-extension.constants */ "./extensions/interactions/interactions-extension.constants.ts");
var objects_domain_constants_1 = __webpack_require__(/*! domain/objects/objects-domain.constants */ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts");
var services_constants_1 = __webpack_require__(/*! services/services.constants */ "./core/templates/dev/head/services/services.constants.ts");
var skill_domain_constants_1 = __webpack_require__(/*! domain/skill/skill-domain.constants */ "./core/templates/dev/head/domain/skill/skill-domain.constants.ts");
var story_domain_constants_1 = __webpack_require__(/*! domain/story/story-domain.constants */ "./core/templates/dev/head/domain/story/story-domain.constants.ts");
var story_editor_page_constants_1 = __webpack_require__(/*! pages/story-editor-page/story-editor-page.constants */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.constants.ts");
var StoryEditorPageModule = /** @class */ (function () {
    function StoryEditorPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    StoryEditorPageModule.prototype.ngDoBootstrap = function () { };
    StoryEditorPageModule = __decorate([
        core_1.NgModule({
            imports: [
                platform_browser_1.BrowserModule,
                http_1.HttpClientModule
            ],
            declarations: [
                ServiceBootstrapComponent
            ],
            entryComponents: [
                ServiceBootstrapComponent
            ],
            providers: [
                app_constants_1.AppConstants,
                interactions_extension_constants_1.InteractionsExtensionsConstants,
                editor_domain_constants_1.EditorDomainConstants,
                objects_domain_constants_1.ObjectsDomainConstants,
                services_constants_1.ServicesConstants,
                skill_domain_constants_1.SkillDomainConstants,
                story_domain_constants_1.StoryDomainConstants,
                story_editor_page_constants_1.StoryEditorPageConstants
            ]
        })
    ], StoryEditorPageModule);
    return StoryEditorPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(StoryEditorPageModule);
};
var downgradedModule = static_2.downgradeModule(bootstrapFn);
angular.module('oppia', [
    'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
    'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
    'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
    'toastr', 'ui.bootstrap', 'ui.codemirror', 'ui.sortable', 'ui.tree',
    'ui.validate', downgradedModule
])
    // This directive is the downgraded version of the Angular component to
    // bootstrap the Angular 8.
    .directive('serviceBootstrap', static_1.downgradeComponent({
    component: ServiceBootstrapComponent
}));


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.scripts.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-page.scripts.ts ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive scripts for the story editor page.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/story-editor-page/story-editor-page.module.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/story-editor-page/navbar/story-editor-navbar.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/navbar/story-editor-navbar.directive.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.controller.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts");


/***/ }),

/***/ "./core/templates/dev/head/services/PageTitleService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/PageTitleService.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service to set the title of the page.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var PageTitleService = /** @class */ (function () {
    function PageTitleService(titleService) {
        this.titleService = titleService;
    }
    PageTitleService.prototype.setPageTitle = function (title) {
        this.titleService.setTitle(title);
    };
    var _a;
    PageTitleService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof platform_browser_1.Title !== "undefined" && platform_browser_1.Title) === "function" ? _a : Object])
    ], PageTitleService);
    return PageTitleService;
}());
exports.PageTitleService = PageTitleService;
angular.module('oppia').factory('PageTitleService', static_1.downgradeInjectable(PageTitleService));


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3NraWxsL3NraWxsLWRvbWFpbi5jb25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5L0VkaXRhYmxlU3RvcnlCYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc3RvcnkvU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5L1N0b3J5Tm9kZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5L1N0b3J5T2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc3RvcnkvU3RvcnlVcGRhdGVTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9zdG9yeS9zdG9yeS1kb21haW4uY29uc3RhbnRzLmFqcy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc3Rvcnkvc3RvcnktZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiL3N0b3J5LWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvZWRpdG9yLXRhYi9zdG9yeS1ub2RlLWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbmF2YmFyL3N0b3J5LWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbmF2YmFyL3N0b3J5LWVkaXRvci1uYXZiYXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3NlcnZpY2VzL3N0b3J5LWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLnNjcmlwdHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvUGFnZVRpdGxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBUSxvQkFBb0I7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBaUIsNEJBQTRCO0FBQzdDO0FBQ0E7QUFDQSwwQkFBa0IsMkJBQTJCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQWdCLHVCQUF1QjtBQUN2Qzs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEOzs7Ozs7Ozs7Ozs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGlC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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIs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LENBQUM7QUFDRDtBQUNBIiwiZmlsZSI6InN0b3J5X2VkaXRvci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG5cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwic3RvcnlfZWRpdG9yXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3ItcGFnZS5zY3JpcHRzLnRzXCIsXCJ2ZW5kb3JzfmFib3V0fmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbW11bml0eV9kYXNoYm9hcmR+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2Fyfjc4NTZjMDVhXCIsXCJ2ZW5kb3JzfmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wfjdmOGJjYzY3XCIsXCJhYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmUwNmE0YTE3XCIsXCJhZG1pbn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfm1vZGVyYXRvcn5wcmFjdGljZV9zZXNzaW9ufnJldmlld190ZXN0fmI5NTgwZWQwXCIsXCJhZG1pbn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfm1vZGVyYXRvcn5wcmFjdGljZV9zZXNzaW9ufnJldmlld190ZXN0fmQzNTk1MTU1XCIsXCJhZG1pbn5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfm1vZGVyYXRvcn5wcmFjdGljZV9zZXNzaW9ufnJldmlld190ZXN0fnNraWxsX2VkaXRvcn5zdG9yfjc3MzRjZGRiXCIsXCJzdG9yeV9lZGl0b3J+dG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkXCIsXCJjb2xsZWN0aW9uX2VkaXRvcn5zdG9yeV9lZGl0b3JcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igc2tpbGwgZG9tYWluLlxuICovXG52YXIgU2tpbGxEb21haW5Db25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2tpbGxEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkNPTkNFUFRfQ0FSRF9EQVRBX1VSTF9URU1QTEFURSA9ICcvY29uY2VwdF9jYXJkX2hhbmRsZXIvPGNvbW1hX3NlcGFyYXRlZF9za2lsbF9pZHM+JztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5FRElUQUJMRV9TS0lMTF9EQVRBX1VSTF9URU1QTEFURSA9ICcvc2tpbGxfZWRpdG9yX2hhbmRsZXIvZGF0YS88c2tpbGxfaWQ+JztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9EQVRBX1VSTF9URU1QTEFURSA9ICcvc2tpbGxfZGF0YV9oYW5kbGVyLzxjb21tYV9zZXBhcmF0ZWRfc2tpbGxfaWRzPic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfRURJVE9SX1FVRVNUSU9OX1VSTF9URU1QTEFURSA9ICcvc2tpbGxfZWRpdG9yX3F1ZXN0aW9uX2hhbmRsZXIvPHNraWxsX2lkPj9jdXJzb3I9PGN1cnNvcj4nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX01BU1RFUllfREFUQV9VUkxfVEVNUExBVEUgPSAnL3NraWxsX21hc3RlcnlfaGFuZGxlci9kYXRhJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9QUk9QRVJUWV9ERVNDUklQVElPTiA9ICdkZXNjcmlwdGlvbic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfUFJPUEVSVFlfTEFOR1VBR0VfQ09ERSA9ICdsYW5ndWFnZV9jb2RlJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9DT05URU5UU19QUk9QRVJUWV9FWFBMQU5BVElPTiA9ICdleHBsYW5hdGlvbic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfQ09OVEVOVFNfUFJPUEVSVFlfV09SS0VEX0VYQU1QTEVTID0gJ3dvcmtlZF9leGFtcGxlcyc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfTkFNRSA9ICduYW1lJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWV9OT1RFUyA9ICdub3Rlcyc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfRkVFREJBQ0sgPSAnZmVlZGJhY2snO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfU0tJTExfUFJPUEVSVFkgPSAndXBkYXRlX3NraWxsX3Byb3BlcnR5JztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NLSUxMX0NPTlRFTlRTX1BST1BFUlRZID0gJ3VwZGF0ZV9za2lsbF9jb250ZW50c19wcm9wZXJ0eSc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWSA9ICd1cGRhdGVfc2tpbGxfbWlzY29uY2VwdGlvbnNfcHJvcGVydHknO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9BRERfU0tJTExfTUlTQ09OQ0VQVElPTiA9ICdhZGRfc2tpbGxfbWlzY29uY2VwdGlvbic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9TS0lMTF9NSVNDT05DRVBUSU9OID0gJ2RlbGV0ZV9za2lsbF9taXNjb25jZXB0aW9uJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1JVQlJJQ1MgPSAndXBkYXRlX3J1YnJpY3MnO1xuICAgIHJldHVybiBTa2lsbERvbWFpbkNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLlNraWxsRG9tYWluQ29uc3RhbnRzID0gU2tpbGxEb21haW5Db25zdGFudHM7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gc2VuZCBjaGFuZ2VzIHRvIGEgc3RvcnkgdG8gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9zdG9yeS9zdG9yeS1kb21haW4uY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0VESVRBQkxFX1NUT1JZX0RBVEFfVVJMX1RFTVBMQVRFJywgJ1NUT1JZX1BVQkxJU0hfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgRURJVEFCTEVfU1RPUllfREFUQV9VUkxfVEVNUExBVEUsIFNUT1JZX1BVQkxJU0hfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIHZhciBfZmV0Y2hTdG9yeSA9IGZ1bmN0aW9uIChzdG9yeUlkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBzdG9yeURhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9TVE9SWV9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHN0b3J5X2lkOiBzdG9yeUlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChzdG9yeURhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5ID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc3RvcnkpO1xuICAgICAgICAgICAgICAgIHZhciB0b3BpY05hbWUgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS50b3BpY19uYW1lKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlJc1B1Ymxpc2hlZCA9IHJlc3BvbnNlLmRhdGEuc3RvcnlfaXNfcHVibGlzaGVkO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5OiBzdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcGljTmFtZTogdG9waWNOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcnlJc1B1Ymxpc2hlZDogc3RvcnlJc1B1Ymxpc2hlZFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVTdG9yeSA9IGZ1bmN0aW9uIChzdG9yeUlkLCBzdG9yeVZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGVkaXRhYmxlU3RvcnlEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRURJVEFCTEVfU1RPUllfREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICBzdG9yeV9pZDogc3RvcnlJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcHV0RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBzdG9yeVZlcnNpb24sXG4gICAgICAgICAgICAgICAgY29tbWl0X21lc3NhZ2U6IGNvbW1pdE1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgY2hhbmdlX2RpY3RzOiBjaGFuZ2VMaXN0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJGh0dHAucHV0KGVkaXRhYmxlU3RvcnlEYXRhVXJsLCBwdXREYXRhKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSByZXR1cm5lZCBkYXRhIGlzIGFuIHVwZGF0ZWQgc3RvcnkgZGljdC5cbiAgICAgICAgICAgICAgICB2YXIgc3RvcnkgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5zdG9yeSk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soc3RvcnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2NoYW5nZVN0b3J5UHVibGljYXRpb25TdGF0dXMgPSBmdW5jdGlvbiAoc3RvcnlJZCwgbmV3U3RvcnlTdGF0dXNJc1B1YmxpYywgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgc3RvcnlQdWJsaXNoVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoU1RPUllfUFVCTElTSF9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICBzdG9yeV9pZDogc3RvcnlJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcHV0RGF0YSA9IHtcbiAgICAgICAgICAgICAgICBuZXdfc3Rvcnlfc3RhdHVzX2lzX3B1YmxpYzogbmV3U3RvcnlTdGF0dXNJc1B1YmxpY1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRodHRwLnB1dChzdG9yeVB1Ymxpc2hVcmwsIHB1dERhdGEpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9kZWxldGVTdG9yeSA9IGZ1bmN0aW9uIChzdG9yeUlkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBzdG9yeURhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9TVE9SWV9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHN0b3J5X2lkOiBzdG9yeUlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwWydkZWxldGUnXShzdG9yeURhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2Uuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoU3Rvcnk6IGZ1bmN0aW9uIChzdG9yeUlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoU3Rvcnkoc3RvcnlJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFVwZGF0ZXMgYSBzdG9yeSBpbiB0aGUgYmFja2VuZCB3aXRoIHRoZSBwcm92aWRlZCBzdG9yeSBJRC5cbiAgICAgICAgICAgICAqIFRoZSBjaGFuZ2VzIG9ubHkgYXBwbHkgdG8gdGhlIHN0b3J5IG9mIHRoZSBnaXZlbiB2ZXJzaW9uIGFuZCB0aGVcbiAgICAgICAgICAgICAqIHJlcXVlc3QgdG8gdXBkYXRlIHRoZSBzdG9yeSB3aWxsIGZhaWwgaWYgdGhlIHByb3ZpZGVkIHN0b3J5XG4gICAgICAgICAgICAgKiB2ZXJzaW9uIGlzIG9sZGVyIHRoYW4gdGhlIGN1cnJlbnQgdmVyc2lvbiBzdG9yZWQgaW4gdGhlIGJhY2tlbmQuIEJvdGhcbiAgICAgICAgICAgICAqIHRoZSBjaGFuZ2VzIGFuZCB0aGUgbWVzc2FnZSB0byBhc3NvY2lhdGUgd2l0aCB0aG9zZSBjaGFuZ2VzIGFyZSB1c2VkXG4gICAgICAgICAgICAgKiB0byBjb21taXQgYSBjaGFuZ2UgdG8gdGhlIHN0b3J5LiBUaGUgbmV3IHN0b3J5IGlzIHBhc3NlZCB0b1xuICAgICAgICAgICAgICogdGhlIHN1Y2Nlc3MgY2FsbGJhY2ssIGlmIG9uZSBpcyBwcm92aWRlZCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZVxuICAgICAgICAgICAgICogb2JqZWN0LiBFcnJvcnMgYXJlIHBhc3NlZCB0byB0aGUgZXJyb3IgY2FsbGJhY2ssIGlmIG9uZSBpcyBwcm92aWRlZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXBkYXRlU3Rvcnk6IGZ1bmN0aW9uIChzdG9yeUlkLCBzdG9yeVZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlU3Rvcnkoc3RvcnlJZCwgc3RvcnlWZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoYW5nZVN0b3J5UHVibGljYXRpb25TdGF0dXM6IGZ1bmN0aW9uIChzdG9yeUlkLCBuZXdTdG9yeVN0YXR1c0lzUHVibGljKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NoYW5nZVN0b3J5UHVibGljYXRpb25TdGF0dXMoc3RvcnlJZCwgbmV3U3RvcnlTdGF0dXNJc1B1YmxpYywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVTdG9yeTogZnVuY3Rpb24gKHN0b3J5SWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZGVsZXRlU3Rvcnkoc3RvcnlJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIHN0b3J5IGNvbnRlbnRzIGRvbWFpbiBvYmplY3RzLlxuICovXG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RvcnlfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuY29uc3RhbnRzXCIpO1xudmFyIFN0b3J5Tm9kZU9iamVjdEZhY3RvcnlfMSA9IHJlcXVpcmUoXCJkb21haW4vc3RvcnkvU3RvcnlOb2RlT2JqZWN0RmFjdG9yeVwiKTtcbnZhciBTdG9yeUNvbnRlbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0b3J5Q29udGVudHMoaW5pdGlhbE5vZGVJZCwgbm9kZXMsIG5leHROb2RlSWQsIHN0b3J5Tm9kZU9iamVjdEZhY3RvcnlJbnN0YW5jZSkge1xuICAgICAgICB0aGlzLl9kaXNjb25uZWN0ZWROb2RlSWRzID0gW107XG4gICAgICAgIHRoaXMuX2luaXRpYWxOb2RlSWQgPSBpbml0aWFsTm9kZUlkO1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5vZGVzO1xuICAgICAgICB0aGlzLl9uZXh0Tm9kZUlkID0gbmV4dE5vZGVJZDtcbiAgICAgICAgdGhpcy5fc3RvcnlOb2RlT2JqZWN0RmFjdG9yeUluc3RhbmNlID0gc3RvcnlOb2RlT2JqZWN0RmFjdG9yeUluc3RhbmNlO1xuICAgIH1cbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXRJbmNyZW1lbnRlZE5vZGVJZCA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQobm9kZUlkLnJlcGxhY2Uoc3RvcnlfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEuU3RvcnlFZGl0b3JQYWdlQ29uc3RhbnRzLk5PREVfSURfUFJFRklYLCAnJykpO1xuICAgICAgICArK2luZGV4O1xuICAgICAgICByZXR1cm4gc3RvcnlfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEuU3RvcnlFZGl0b3JQYWdlQ29uc3RhbnRzLk5PREVfSURfUFJFRklYICsgaW5kZXg7XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXRJbml0aWFsTm9kZUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faW5pdGlhbE5vZGVJZDtcbiAgICB9O1xuICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLmdldERpc2Nvbm5lY3RlZE5vZGVJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kaXNjb25uZWN0ZWROb2RlSWRzO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuZ2V0TmV4dE5vZGVJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25leHROb2RlSWQ7XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXROb2RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuZ2V0Tm9kZUlkQ29ycmVzcG9uZGluZ1RvVGl0bGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgdmFyIG5vZGVzID0gdGhpcy5fbm9kZXM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChub2Rlc1tpXS5nZXRUaXRsZSgpID09PSB0aXRsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2Rlc1tpXS5nZXRJZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuZ2V0Tm9kZUlkc1RvVGl0bGVNYXAgPSBmdW5jdGlvbiAobm9kZUlkcykge1xuICAgICAgICB2YXIgbm9kZXMgPSB0aGlzLl9ub2RlcztcbiAgICAgICAgdmFyIG5vZGVUaXRsZXMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5vZGVJZHMuaW5kZXhPZihub2Rlc1tpXS5nZXRJZCgpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBub2RlVGl0bGVzW25vZGVzW2ldLmdldElkKCldID0gbm9kZXNbaV0uZ2V0VGl0bGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoT2JqZWN0LmtleXMobm9kZVRpdGxlcykubGVuZ3RoICE9PSBub2RlSWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlVGl0bGVzLmhhc093blByb3BlcnR5KG5vZGVJZHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGlkICcgKyBub2RlSWRzW2ldICsgJyBpcyBpbnZhbGlkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlVGl0bGVzO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuZ2V0Tm9kZUlkcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0SWQoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXROb2RlSW5kZXggPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ub2Rlc1tpXS5nZXRJZCgpID09PSBub2RlSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlIHRoZSByZXR1cm4gdHlwZSBpcyBhIGxpc3Qgd2l0aCB2YXJ5aW5nIGVsZW1lbnQgdHlwZXMuXG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2Rpc2Nvbm5lY3RlZE5vZGVJZHMgPSBbXTtcbiAgICAgICAgdmFyIGlzc3VlcyA9IFtdO1xuICAgICAgICB2YXIgbm9kZXMgPSB0aGlzLl9ub2RlcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGVJc3N1ZXMgPSBub2Rlc1tpXS52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgaXNzdWVzID0gaXNzdWVzLmNvbmNhdChub2RlSXNzdWVzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBpc3N1ZXM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUHJvdmlkZWQgdGhlIG5vZGVzIGxpc3QgaXMgdmFsaWQgYW5kIGVhY2ggbm9kZSBpbiBpdCBpcyB2YWxpZCwgdGhlXG4gICAgICAgIC8vIHByZWxpbWluYXJ5IGNoZWNrcyBhcmUgZG9uZSB0byBzZWUgaWYgdGhlIHN0b3J5IG5vZGUgZ3JhcGggb2J0YWluZWQgaXNcbiAgICAgICAgLy8gdmFsaWQuXG4gICAgICAgIHZhciBub2RlSWRzID0gbm9kZXMubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5nZXRJZCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIG5vZGVUaXRsZXMgPSBub2Rlcy5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlLmdldFRpdGxlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlSWQgPSBub2RlSWRzW2ldO1xuICAgICAgICAgICAgaWYgKG5vZGVJZHMuaW5kZXhPZihub2RlSWQpIDwgbm9kZUlkcy5sYXN0SW5kZXhPZihub2RlSWQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggaWQgJyArIG5vZGVJZCArICcgaXMgZHVwbGljYXRlZCBpbiB0aGUgc3RvcnknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV4dE5vZGVJZE51bWJlciA9IHBhcnNlSW50KHRoaXMuX25leHROb2RlSWQucmVwbGFjZShzdG9yeV9lZGl0b3JfcGFnZV9jb25zdGFudHNfMS5TdG9yeUVkaXRvclBhZ2VDb25zdGFudHMuTk9ERV9JRF9QUkVGSVgsICcnKSk7XG4gICAgICAgIHZhciBpbml0aWFsTm9kZUlzUHJlc2VudCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZUlkTnVtYmVyID0gcGFyc2VJbnQobm9kZXNbaV0uZ2V0SWQoKS5yZXBsYWNlKHN0b3J5X2VkaXRvcl9wYWdlX2NvbnN0YW50c18xLlN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cy5OT0RFX0lEX1BSRUZJWCwgJycpKTtcbiAgICAgICAgICAgIGlmIChub2Rlc1tpXS5nZXRJZCgpID09PSB0aGlzLl9pbml0aWFsTm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbE5vZGVJc1ByZXNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGVJZE51bWJlciA+IG5leHROb2RlSWROdW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignTm9kZSBpZCBvdXQgb2YgYm91bmRzIGZvciBub2RlIHdpdGggaWQgJyArIG5vZGVzW2ldLmdldElkKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBub2Rlc1tpXS5nZXREZXN0aW5hdGlvbk5vZGVJZHMoKS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChub2RlSWRzLmluZGV4T2Yobm9kZXNbaV0uZ2V0RGVzdGluYXRpb25Ob2RlSWRzKClbal0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlIG5vZGUgd2l0aCBpZCAnICsgbm9kZXNbaV0uZ2V0RGVzdGluYXRpb25Ob2RlSWRzKClbal0gK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmICghaW5pdGlhbE5vZGVJc1ByZXNlbnQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW5pdGlhbCBub2RlIC0gJyArIHRoaXMuX2luaXRpYWxOb2RlSWQgK1xuICAgICAgICAgICAgICAgICAgICAnIC0gaXMgbm90IHByZXNlbnQgaW4gdGhlIHN0b3J5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBBbGwgdGhlIHZhbGlkYXRpb25zIGFib3ZlIHNob3VsZCBiZSBzdWNjZXNzZnVsbHkgY29tcGxldGVkIGJlZm9yZVxuICAgICAgICAgICAgLy8gZ29pbmcgdG8gdmFsaWRhdGluZyB0aGUgc3Rvcnkgbm9kZSBncmFwaC5cbiAgICAgICAgICAgIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc3N1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBub2Rlc1F1ZXVlIHN0b3JlcyB0aGUgcGVuZGluZyBub2RlcyB0byB2aXNpdCBpbiBhIHF1ZXVlIGZvcm0uXG4gICAgICAgICAgICB2YXIgbm9kZXNRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgdmFyIG5vZGVJc1Zpc2l0ZWQgPSBuZXcgQXJyYXkobm9kZUlkcy5sZW5ndGgpLmZpbGwoZmFsc2UpO1xuICAgICAgICAgICAgdmFyIHN0YXJ0aW5nTm9kZSA9IG5vZGVzW3RoaXMuZ2V0Tm9kZUluZGV4KHRoaXMuX2luaXRpYWxOb2RlSWQpXTtcbiAgICAgICAgICAgIG5vZGVzUXVldWUucHVzaChzdGFydGluZ05vZGUuZ2V0SWQoKSk7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhc3N1bWVkIHRvIGhhdmUgYWxsIHRoZSBwcmVyZXF1aXNpdGUgc2tpbGxzIG9mIHRoZVxuICAgICAgICAgICAgLy8gc3RhcnRpbmcgbm9kZSBiZWZvcmUgc3RhcnRpbmcgdGhlIHN0b3J5LiBBbHNvLCB0aGlzIGxpc3QgbW9kZWxzIHRoZVxuICAgICAgICAgICAgLy8gc2tpbGwgSURzIGFjcXVpcmVkIGJ5IGEgbGVhcm5lciBhcyB0aGV5IHByb2dyZXNzIHRocm91Z2ggdGhlIHN0b3J5LlxuICAgICAgICAgICAgdmFyIHNpbXVsYXRlZFNraWxsSWRzID0gbmV3IFNldChzdGFydGluZ05vZGUuZ2V0UHJlcmVxdWlzaXRlU2tpbGxJZHMoKSk7XG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGxvb3AgZW1wbG95cyBhIEJyZWFkdGggRmlyc3QgU2VhcmNoIGZyb20gdGhlIGdpdmVuXG4gICAgICAgICAgICAvLyBzdGFydGluZyBub2RlIGFuZCBtYWtlcyBzdXJlIHRoYXQgdGhlIHVzZXIgaGFzIGFjcXVpcmVkIGFsbCB0aGVcbiAgICAgICAgICAgIC8vIHByZXJlcXVpc2l0ZSBza2lsbHMgcmVxdWlyZWQgYnkgdGhlIGRlc3RpbmF0aW9uIG5vZGVzICd1bmxvY2tlZCcgYnlcbiAgICAgICAgICAgIC8vIHZpc2l0aW5nIGEgcGFydGljdWxhciBub2RlIGJ5IHRoZSB0aW1lIHRoYXQgbm9kZSBpcyBmaW5pc2hlZC5cbiAgICAgICAgICAgIHdoaWxlIChub2Rlc1F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudE5vZGVJbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVzUXVldWUuc2hpZnQoKSk7XG4gICAgICAgICAgICAgICAgbm9kZUlzVmlzaXRlZFtjdXJyZW50Tm9kZUluZGV4XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnROb2RlID0gbm9kZXNbY3VycmVudE5vZGVJbmRleF07XG4gICAgICAgICAgICAgICAgc3RhcnRpbmdOb2RlLmdldEFjcXVpcmVkU2tpbGxJZHMoKS5mb3JFYWNoKGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlZFNraWxsSWRzLmFkZChza2lsbElkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmdldERlc3RpbmF0aW9uTm9kZUlkcygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlSWQgPSBjdXJyZW50Tm9kZS5nZXREZXN0aW5hdGlvbk5vZGVJZHMoKVtpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVJbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgY29uZGl0aW9uIGNoZWNrcyB3aGV0aGVyIHRoZSBkZXN0aW5hdGlvbiBub2RlXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciBhIHBhcnRpY3VsYXIgbm9kZSwgaGFzIGFscmVhZHkgYmVlbiB2aXNpdGVkLCBpbiB3aGljaCBjYXNlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBzdG9yeSB3b3VsZCBoYXZlIGxvb3BzLCB3aGljaCBhcmUgbm90IGFsbG93ZWQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlSXNWaXNpdGVkW25vZGVJbmRleF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdMb29wcyBhcmUgbm90IGFsbG93ZWQgaW4gdGhlIG5vZGUgZ3JhcGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGEgbG9vcCBpcyBlbmNvdW50ZXJlZCwgdGhlbiBhbGwgZnVydGhlciBjaGVja3MgYXJlIGhhbHRlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmNlIGl0IGNhbiBsZWFkIHRvIHNhbWUgZXJyb3IgYmVpbmcgcmVwb3J0ZWQgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbk5vZGUgPSBub2Rlc1tub2RlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbk5vZGUuZ2V0UHJlcmVxdWlzaXRlU2tpbGxJZHMoKS5mb3JFYWNoKGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNpbXVsYXRlZFNraWxsSWRzLmhhcyhza2lsbElkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGUgcHJlcmVxdWlzaXRlIHNraWxsIHdpdGggaWQgJyArIHNraWxsSWQgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIHdhcyBub3QgY29tcGxldGVkIGJlZm9yZSBub2RlIHdpdGggaWQgJyArIG5vZGVJZCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgd2FzIHVubG9ja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1F1ZXVlLnB1c2gobm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVJc1Zpc2l0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJc1Zpc2l0ZWRbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGlzY29ubmVjdGVkTm9kZUlkcy5wdXNoKG5vZGVJZHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlcmUgaXMgbm8gd2F5IHRvIGdldCB0byB0aGUgY2hhcHRlciB3aXRoIHRpdGxlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVRpdGxlc1tpXSArICcgZnJvbSBhbnkgb3RoZXIgY2hhcHRlcicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSB0aGUgcmV0dXJuIHR5cGUgaXMgYW4gYXNzaWdubWVudCBzdGF0ZW1lbnQgYW5kIHNob3VsZCBiZVxuICAgIC8vIHR5cGVkIGFzIHZvaWQgYW5kIHRoZSByZXR1cm4gc3RhdGVtZW50IHNob3VsZCBiZSByZW1vdmVkLlxuICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLnNldEluaXRpYWxOb2RlSWQgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgIGlmICh0aGlzLmdldE5vZGVJbmRleChub2RlSWQpID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2luaXRpYWxOb2RlSWQgPSBub2RlSWQ7XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5hZGROb2RlID0gZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgIHRoaXMuX25vZGVzLnB1c2godGhpcy5fc3RvcnlOb2RlT2JqZWN0RmFjdG9yeUluc3RhbmNlLmNyZWF0ZUZyb21JZEFuZFRpdGxlKHRoaXMuX25leHROb2RlSWQsIHRpdGxlKSk7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsTm9kZUlkID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0aWFsTm9kZUlkID0gdGhpcy5fbmV4dE5vZGVJZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9uZXh0Tm9kZUlkID0gdGhpcy5nZXRJbmNyZW1lbnRlZE5vZGVJZCh0aGlzLl9uZXh0Tm9kZUlkKTtcbiAgICB9O1xuICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLmRlbGV0ZU5vZGUgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgIGlmICh0aGlzLmdldE5vZGVJbmRleChub2RlSWQpID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGVJZCA9PT0gdGhpcy5faW5pdGlhbE5vZGVJZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX25vZGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luaXRpYWxOb2RlSWQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCBkZWxldGUgaW5pdGlhbCBzdG9yeSBub2RlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX25vZGVzW2ldLmdldERlc3RpbmF0aW9uTm9kZUlkcygpLmluZGV4T2Yobm9kZUlkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9ub2Rlc1tpXS5yZW1vdmVEZXN0aW5hdGlvbk5vZGVJZChub2RlSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzLnNwbGljZSh0aGlzLmdldE5vZGVJbmRleChub2RlSWQpLCAxKTtcbiAgICB9O1xuICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLnNldE5vZGVPdXRsaW5lID0gZnVuY3Rpb24gKG5vZGVJZCwgb3V0bGluZSkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIG5vZGUgd2l0aCBnaXZlbiBpZCBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0uc2V0T3V0bGluZShvdXRsaW5lKTtcbiAgICB9O1xuICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLnNldE5vZGVUaXRsZSA9IGZ1bmN0aW9uIChub2RlSWQsIHRpdGxlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5zZXRUaXRsZSh0aXRsZSk7XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5zZXROb2RlRXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChub2RlSWQsIGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXROb2RlSW5kZXgobm9kZUlkKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXhwbG9yYXRpb25JZCAhPT0gbnVsbCB8fCBleHBsb3JhdGlvbklkICE9PSAnJykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICgodGhpcy5fbm9kZXNbaV0uZ2V0RXhwbG9yYXRpb25JZCgpID09PSBleHBsb3JhdGlvbklkKSAmJiAoaSAhPT0gaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gZXhwbG9yYXRpb24gYWxyZWFkeSBleGlzdHMgaW4gdGhlIHN0b3J5LicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5zZXRFeHBsb3JhdGlvbklkKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5tYXJrTm9kZU91dGxpbmVBc0ZpbmFsaXplZCA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXROb2RlSW5kZXgobm9kZUlkKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbm9kZXNbaW5kZXhdLm1hcmtPdXRsaW5lQXNGaW5hbGl6ZWQoKTtcbiAgICB9O1xuICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLm1hcmtOb2RlT3V0bGluZUFzTm90RmluYWxpemVkID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIG5vZGUgd2l0aCBnaXZlbiBpZCBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0ubWFya091dGxpbmVBc05vdEZpbmFsaXplZCgpO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuYWRkUHJlcmVxdWlzaXRlU2tpbGxJZFRvTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQsIHNraWxsSWQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXROb2RlSW5kZXgobm9kZUlkKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbm9kZXNbaW5kZXhdLmFkZFByZXJlcXVpc2l0ZVNraWxsSWQoc2tpbGxJZCk7XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5yZW1vdmVQcmVyZXF1aXNpdGVTa2lsbElkRnJvbU5vZGUgPSBmdW5jdGlvbiAobm9kZUlkLCBza2lsbElkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5yZW1vdmVQcmVyZXF1aXNpdGVTa2lsbElkKHNraWxsSWQpO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuYWRkQWNxdWlyZWRTa2lsbElkVG9Ob2RlID0gZnVuY3Rpb24gKG5vZGVJZCwgc2tpbGxJZCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIG5vZGUgd2l0aCBnaXZlbiBpZCBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0uYWRkQWNxdWlyZWRTa2lsbElkKHNraWxsSWQpO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUucmVtb3ZlQWNxdWlyZWRTa2lsbElkRnJvbU5vZGUgPSBmdW5jdGlvbiAobm9kZUlkLCBza2lsbElkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5yZW1vdmVBY3F1aXJlZFNraWxsSWQoc2tpbGxJZCk7XG4gICAgfTtcbiAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5hZGREZXN0aW5hdGlvbk5vZGVJZFRvTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQsIGRlc3RpbmF0aW9uTm9kZUlkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmdldE5vZGVJbmRleChkZXN0aW5hdGlvbk5vZGVJZCkgPT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIGRlc3RpbmF0aW9uIG5vZGUgd2l0aCBnaXZlbiBpZCBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0uYWRkRGVzdGluYXRpb25Ob2RlSWQoZGVzdGluYXRpb25Ob2RlSWQpO1xuICAgIH07XG4gICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUucmVtb3ZlRGVzdGluYXRpb25Ob2RlSWRGcm9tTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQsIGRlc3RpbmF0aW9uTm9kZUlkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5yZW1vdmVEZXN0aW5hdGlvbk5vZGVJZChkZXN0aW5hdGlvbk5vZGVJZCk7XG4gICAgfTtcbiAgICByZXR1cm4gU3RvcnlDb250ZW50cztcbn0oKSk7XG5leHBvcnRzLlN0b3J5Q29udGVudHMgPSBTdG9yeUNvbnRlbnRzO1xudmFyIFN0b3J5Q29udGVudHNPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0b3J5Q29udGVudHNPYmplY3RGYWN0b3J5KHN0b3J5Tm9kZU9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgdGhpcy5zdG9yeU5vZGVPYmplY3RGYWN0b3J5ID0gc3RvcnlOb2RlT2JqZWN0RmFjdG9yeTtcbiAgICB9XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnc3RvcnlDb250ZW50c0JhY2tlbmRPYmplY3QnIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWRcbiAgICAvLyBrZXlzIHdoaWNoIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mXG4gICAgLy8gY2FtZWxDYXNpbmcuXG4gICAgU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChzdG9yeUNvbnRlbnRzQmFja2VuZE9iamVjdCkge1xuICAgICAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdG9yeUNvbnRlbnRzQmFja2VuZE9iamVjdC5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZXMucHVzaCh0aGlzLnN0b3J5Tm9kZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHN0b3J5Q29udGVudHNCYWNrZW5kT2JqZWN0Lm5vZGVzW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBTdG9yeUNvbnRlbnRzKHN0b3J5Q29udGVudHNCYWNrZW5kT2JqZWN0LmluaXRpYWxfbm9kZV9pZCwgbm9kZXMsIHN0b3J5Q29udGVudHNCYWNrZW5kT2JqZWN0Lm5leHRfbm9kZV9pZCwgdGhpcy5zdG9yeU5vZGVPYmplY3RGYWN0b3J5KTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBTdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSksXG4gICAgICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbdHlwZW9mIChfYSA9IHR5cGVvZiBTdG9yeU5vZGVPYmplY3RGYWN0b3J5XzEuU3RvcnlOb2RlT2JqZWN0RmFjdG9yeSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBTdG9yeU5vZGVPYmplY3RGYWN0b3J5XzEuU3RvcnlOb2RlT2JqZWN0RmFjdG9yeSkgPT09IFwiZnVuY3Rpb25cIiA/IF9hIDogT2JqZWN0XSlcbiAgICBdLCBTdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIFN0b3J5Q29udGVudHNPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkgPSBTdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1N0b3J5Q29udGVudHNPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShTdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBhbmQgbXV0YXRpbmcgaW5zdGFuY2VzIG9mIGZyb250ZW5kXG4gKiBzdG9yeSBub2RlIGRvbWFpbiBvYmplY3RzLlxuICovXG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RvcnlfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuY29uc3RhbnRzXCIpO1xudmFyIFN0b3J5Tm9kZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdG9yeU5vZGUoaWQsIHRpdGxlLCBkZXN0aW5hdGlvbk5vZGVJZHMsIHByZXJlcXVpc2l0ZVNraWxsSWRzLCBhY3F1aXJlZFNraWxsSWRzLCBvdXRsaW5lLCBvdXRsaW5lSXNGaW5hbGl6ZWQsIGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgdGhpcy5faWQgPSBpZDtcbiAgICAgICAgdGhpcy5fdGl0bGUgPSB0aXRsZTtcbiAgICAgICAgdGhpcy5fZGVzdGluYXRpb25Ob2RlSWRzID0gZGVzdGluYXRpb25Ob2RlSWRzO1xuICAgICAgICB0aGlzLl9wcmVyZXF1aXNpdGVTa2lsbElkcyA9IHByZXJlcXVpc2l0ZVNraWxsSWRzO1xuICAgICAgICB0aGlzLl9hY3F1aXJlZFNraWxsSWRzID0gYWNxdWlyZWRTa2lsbElkcztcbiAgICAgICAgdGhpcy5fb3V0bGluZSA9IG91dGxpbmU7XG4gICAgICAgIHRoaXMuX291dGxpbmVJc0ZpbmFsaXplZCA9IG91dGxpbmVJc0ZpbmFsaXplZDtcbiAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZCA9IGV4cGxvcmF0aW9uSWQ7XG4gICAgfVxuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuX2NoZWNrVmFsaWROb2RlSWQgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygbm9kZUlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlSWRQYXR0ZXJuID0gbmV3IFJlZ0V4cChzdG9yeV9lZGl0b3JfcGFnZV9jb25zdGFudHNfMS5TdG9yeUVkaXRvclBhZ2VDb25zdGFudHMuTk9ERV9JRF9QUkVGSVggKyAnWzAtOV0rJywgJ2cnKTtcbiAgICAgICAgaWYgKCFub2RlSWQubWF0Y2gobm9kZUlkUGF0dGVybikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aXRsZTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0RXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uSWQ7XG4gICAgfTtcbiAgICBTdG9yeU5vZGUucHJvdG90eXBlLnNldEV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICB0aGlzLl9leHBsb3JhdGlvbklkID0gZXhwbG9yYXRpb25JZDtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0T3V0bGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX291dGxpbmU7XG4gICAgfTtcbiAgICBTdG9yeU5vZGUucHJvdG90eXBlLnNldE91dGxpbmUgPSBmdW5jdGlvbiAob3V0bGluZSkge1xuICAgICAgICB0aGlzLl9vdXRsaW5lID0gb3V0bGluZTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuc2V0VGl0bGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgdGhpcy5fdGl0bGUgPSB0aXRsZTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0T3V0bGluZVN0YXR1cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX291dGxpbmVJc0ZpbmFsaXplZDtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUubWFya091dGxpbmVBc0ZpbmFsaXplZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fb3V0bGluZUlzRmluYWxpemVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUubWFya091dGxpbmVBc05vdEZpbmFsaXplZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fb3V0bGluZUlzRmluYWxpemVkID0gZmFsc2U7XG4gICAgfTtcbiAgICBTdG9yeU5vZGUucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaXNzdWVzID0gW107XG4gICAgICAgIGlmICghdGhpcy5fY2hlY2tWYWxpZE5vZGVJZCh0aGlzLl9pZCkpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSBpZCAnICsgdGhpcy5faWQgKyAnIGlzIGludmFsaWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHByZXJlcXVpc2l0ZVNraWxsSWRzID0gdGhpcy5fcHJlcmVxdWlzaXRlU2tpbGxJZHM7XG4gICAgICAgIHZhciBhY3F1aXJlZFNraWxsSWRzID0gdGhpcy5fYWNxdWlyZWRTa2lsbElkcztcbiAgICAgICAgdmFyIGRlc3RpbmF0aW9uTm9kZUlkcyA9IHRoaXMuX2Rlc3RpbmF0aW9uTm9kZUlkcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmVyZXF1aXNpdGVTa2lsbElkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHNraWxsSWQgPSBwcmVyZXF1aXNpdGVTa2lsbElkc1tpXTtcbiAgICAgICAgICAgIGlmIChwcmVyZXF1aXNpdGVTa2lsbElkcy5pbmRleE9mKHNraWxsSWQpIDxcbiAgICAgICAgICAgICAgICBwcmVyZXF1aXNpdGVTa2lsbElkcy5sYXN0SW5kZXhPZihza2lsbElkKSkge1xuICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGUgcHJlcmVxdWlzaXRlIHNraWxsIHdpdGggaWQgJyArIHNraWxsSWQgKyAnIGlzIGR1cGxpY2F0ZWQgaW4nICtcbiAgICAgICAgICAgICAgICAgICAgJyBub2RlIHdpdGggaWQgJyArIHRoaXMuX2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjcXVpcmVkU2tpbGxJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBza2lsbElkID0gYWNxdWlyZWRTa2lsbElkc1tpXTtcbiAgICAgICAgICAgIGlmIChhY3F1aXJlZFNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCkgPFxuICAgICAgICAgICAgICAgIGFjcXVpcmVkU2tpbGxJZHMubGFzdEluZGV4T2Yoc2tpbGxJZCkpIHtcbiAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlIGFjcXVpcmVkIHNraWxsIHdpdGggaWQgJyArIHNraWxsSWQgKyAnIGlzIGR1cGxpY2F0ZWQgaW4nICtcbiAgICAgICAgICAgICAgICAgICAgJyBub2RlIHdpdGggaWQgJyArIHRoaXMuX2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByZXJlcXVpc2l0ZVNraWxsSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYWNxdWlyZWRTa2lsbElkcy5pbmRleE9mKHByZXJlcXVpc2l0ZVNraWxsSWRzW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlIHNraWxsIHdpdGggaWQgJyArIHByZXJlcXVpc2l0ZVNraWxsSWRzW2ldICsgJyBpcyBjb21tb24gJyArXG4gICAgICAgICAgICAgICAgICAgICd0byBib3RoIHRoZSBhY3F1aXJlZCBhbmQgcHJlcmVxdWlzaXRlIHNraWxsIGlkIGxpc3QgaW4gbm9kZSB3aXRoJyArXG4gICAgICAgICAgICAgICAgICAgICcgaWQgJyArIHRoaXMuX2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc3RpbmF0aW9uTm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9jaGVja1ZhbGlkTm9kZUlkKGRlc3RpbmF0aW9uTm9kZUlkc1tpXSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIGRlc3RpbmF0aW9uIG5vZGUgaWQgJyArIGRlc3RpbmF0aW9uTm9kZUlkc1tpXSArICcgaXMgJyArXG4gICAgICAgICAgICAgICAgICAgICdpbnZhbGlkIGluIG5vZGUgd2l0aCBpZCAnICsgdGhpcy5faWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBjdXJyZW50Tm9kZUlkID0gdGhpcy5faWQ7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvbk5vZGVJZHMuc29tZShmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZUlkID09PSBjdXJyZW50Tm9kZUlkO1xuICAgICAgICB9KSkge1xuICAgICAgICAgICAgaXNzdWVzLnB1c2goJ1RoZSBkZXN0aW5hdGlvbiBub2RlIGlkIG9mIG5vZGUgd2l0aCBpZCAnICsgdGhpcy5faWQgK1xuICAgICAgICAgICAgICAgICcgcG9pbnRzIHRvIGl0c2VsZi4nKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc3RpbmF0aW9uTm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGVJZCA9IGRlc3RpbmF0aW9uTm9kZUlkc1tpXTtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbk5vZGVJZHMuaW5kZXhPZihub2RlSWQpIDxcbiAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbk5vZGVJZHMubGFzdEluZGV4T2Yobm9kZUlkKSkge1xuICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGUgZGVzdGluYXRpb24gbm9kZSB3aXRoIGlkICcgKyBub2RlSWQgKyAnIGlzIGR1cGxpY2F0ZWQgaW4nICtcbiAgICAgICAgICAgICAgICAgICAgJyBub2RlIHdpdGggaWQgJyArIHRoaXMuX2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgIH07XG4gICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXREZXN0aW5hdGlvbk5vZGVJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZXN0aW5hdGlvbk5vZGVJZHMuc2xpY2UoKTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuYWRkRGVzdGluYXRpb25Ob2RlSWQgPSBmdW5jdGlvbiAoZGVzdGluYXRpb25Ob2RlaWQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Rlc3RpbmF0aW9uTm9kZUlkcy5pbmRleE9mKGRlc3RpbmF0aW9uTm9kZWlkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gbm9kZSBpcyBhbHJlYWR5IGEgZGVzdGluYXRpb24gbm9kZS4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kZXN0aW5hdGlvbk5vZGVJZHMucHVzaChkZXN0aW5hdGlvbk5vZGVpZCk7XG4gICAgfTtcbiAgICBTdG9yeU5vZGUucHJvdG90eXBlLnJlbW92ZURlc3RpbmF0aW9uTm9kZUlkID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uTm9kZWlkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2Rlc3RpbmF0aW9uTm9kZUlkcy5pbmRleE9mKGRlc3RpbmF0aW9uTm9kZWlkKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBnaXZlbiBub2RlIGlzIG5vdCBhIGRlc3RpbmF0aW9uIG5vZGUuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGVzdGluYXRpb25Ob2RlSWRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfTtcbiAgICBTdG9yeU5vZGUucHJvdG90eXBlLmdldEFjcXVpcmVkU2tpbGxJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3F1aXJlZFNraWxsSWRzLnNsaWNlKCk7XG4gICAgfTtcbiAgICBTdG9yeU5vZGUucHJvdG90eXBlLmFkZEFjcXVpcmVkU2tpbGxJZCA9IGZ1bmN0aW9uIChhY3F1aXJlZFNraWxsaWQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FjcXVpcmVkU2tpbGxJZHMuaW5kZXhPZihhY3F1aXJlZFNraWxsaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBnaXZlbiBza2lsbCBpcyBhbHJlYWR5IGFuIGFjcXVpcmVkIHNraWxsLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FjcXVpcmVkU2tpbGxJZHMucHVzaChhY3F1aXJlZFNraWxsaWQpO1xuICAgIH07XG4gICAgU3RvcnlOb2RlLnByb3RvdHlwZS5yZW1vdmVBY3F1aXJlZFNraWxsSWQgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9hY3F1aXJlZFNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gc2tpbGwgaXMgbm90IGFuIGFjcXVpcmVkIHNraWxsLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FjcXVpcmVkU2tpbGxJZHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0UHJlcmVxdWlzaXRlU2tpbGxJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcmVyZXF1aXNpdGVTa2lsbElkcy5zbGljZSgpO1xuICAgIH07XG4gICAgU3RvcnlOb2RlLnByb3RvdHlwZS5hZGRQcmVyZXF1aXNpdGVTa2lsbElkID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgaWYgKHRoaXMuX3ByZXJlcXVpc2l0ZVNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCkgIT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIGdpdmVuIHNraWxsIGlkIGlzIGFscmVhZHkgYSBwcmVyZXF1aXNpdGUgc2tpbGwuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcHJlcmVxdWlzaXRlU2tpbGxJZHMucHVzaChza2lsbElkKTtcbiAgICB9O1xuICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUucmVtb3ZlUHJlcmVxdWlzaXRlU2tpbGxJZCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuX3ByZXJlcXVpc2l0ZVNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gc2tpbGwgaWQgaXMgbm90IGEgcHJlcmVxdWlzaXRlIHNraWxsLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3ByZXJlcXVpc2l0ZVNraWxsSWRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfTtcbiAgICByZXR1cm4gU3RvcnlOb2RlO1xufSgpKTtcbmV4cG9ydHMuU3RvcnlOb2RlID0gU3RvcnlOb2RlO1xudmFyIFN0b3J5Tm9kZU9iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RvcnlOb2RlT2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnc3RvcnlOb2RlQmFja2VuZE9iamVjdCcgaXMgYSBkaWN0IHdpdGggdW5kZXJzY29yZV9jYXNlZFxuICAgIC8vIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2ZcbiAgICAvLyBjYW1lbENhc2luZy5cbiAgICBTdG9yeU5vZGVPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoc3RvcnlOb2RlQmFja2VuZE9iamVjdCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0b3J5Tm9kZShzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LmlkLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LnRpdGxlLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LmRlc3RpbmF0aW9uX25vZGVfaWRzLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LnByZXJlcXVpc2l0ZV9za2lsbF9pZHMsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QuYWNxdWlyZWRfc2tpbGxfaWRzLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0Lm91dGxpbmUsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3Qub3V0bGluZV9pc19maW5hbGl6ZWQsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QuZXhwbG9yYXRpb25faWQpO1xuICAgIH07XG4gICAgU3RvcnlOb2RlT2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlRnJvbUlkQW5kVGl0bGUgPSBmdW5jdGlvbiAobm9kZUlkLCB0aXRsZSkge1xuICAgICAgICByZXR1cm4gbmV3IFN0b3J5Tm9kZShub2RlSWQsIHRpdGxlLCBbXSwgW10sIFtdLCAnJywgZmFsc2UsIG51bGwpO1xuICAgIH07XG4gICAgU3RvcnlOb2RlT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBTdG9yeU5vZGVPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gU3RvcnlOb2RlT2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLlN0b3J5Tm9kZU9iamVjdEZhY3RvcnkgPSBTdG9yeU5vZGVPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnU3RvcnlOb2RlT2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoU3RvcnlOb2RlT2JqZWN0RmFjdG9yeSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgYW5kIG11dGF0aW5nIGluc3RhbmNlcyBvZiBmcm9udGVuZFxuICogc3RvcnkgZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBTdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeV8xID0gcmVxdWlyZShcImRvbWFpbi9zdG9yeS9TdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeVwiKTtcbnZhciBTdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdG9yeShpZCwgdGl0bGUsIGRlc2NyaXB0aW9uLCBub3Rlcywgc3RvcnlDb250ZW50cywgbGFuZ3VhZ2VDb2RlLCB2ZXJzaW9uLCBjb3JyZXNwb25kaW5nVG9waWNJZCkge1xuICAgICAgICB0aGlzLl9pZCA9IGlkO1xuICAgICAgICB0aGlzLl90aXRsZSA9IHRpdGxlO1xuICAgICAgICB0aGlzLl9kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICB0aGlzLl9ub3RlcyA9IG5vdGVzO1xuICAgICAgICB0aGlzLl9zdG9yeUNvbnRlbnRzID0gc3RvcnlDb250ZW50cztcbiAgICAgICAgdGhpcy5fbGFuZ3VhZ2VDb2RlID0gbGFuZ3VhZ2VDb2RlO1xuICAgICAgICB0aGlzLl92ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgdGhpcy5fY29ycmVzcG9uZGluZ1RvcGljSWQgPSBjb3JyZXNwb25kaW5nVG9waWNJZDtcbiAgICB9XG4gICAgU3RvcnkucHJvdG90eXBlLmdldElkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgfTtcbiAgICBTdG9yeS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aXRsZTtcbiAgICB9O1xuICAgIFN0b3J5LnByb3RvdHlwZS5zZXRUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICB0aGlzLl90aXRsZSA9IHRpdGxlO1xuICAgIH07XG4gICAgU3RvcnkucHJvdG90eXBlLmdldERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVzY3JpcHRpb247XG4gICAgfTtcbiAgICBTdG9yeS5wcm90b3R5cGUuc2V0RGVzY3JpcHRpb24gPSBmdW5jdGlvbiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5fZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcbiAgICB9O1xuICAgIFN0b3J5LnByb3RvdHlwZS5nZXROb3RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vdGVzO1xuICAgIH07XG4gICAgU3RvcnkucHJvdG90eXBlLnNldE5vdGVzID0gZnVuY3Rpb24gKG5vdGVzKSB7XG4gICAgICAgIHRoaXMuX25vdGVzID0gbm90ZXM7XG4gICAgfTtcbiAgICBTdG9yeS5wcm90b3R5cGUuZ2V0TGFuZ3VhZ2VDb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGFuZ3VhZ2VDb2RlO1xuICAgIH07XG4gICAgU3RvcnkucHJvdG90eXBlLnNldExhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgdGhpcy5fbGFuZ3VhZ2VDb2RlID0gbGFuZ3VhZ2VDb2RlO1xuICAgIH07XG4gICAgU3RvcnkucHJvdG90eXBlLmdldFZlcnNpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92ZXJzaW9uO1xuICAgIH07XG4gICAgU3RvcnkucHJvdG90eXBlLmdldFN0b3J5Q29udGVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yeUNvbnRlbnRzO1xuICAgIH07XG4gICAgU3RvcnkucHJvdG90eXBlLmdldENvcnJlc3BvbmRpbmdUb3BpY0lkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29ycmVzcG9uZGluZ1RvcGljSWQ7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlIHRoZSByZXR1cm4gdHlwZSBpcyBhIGxpc3Qgd2l0aCB2YXJ5aW5nIGVsZW1lbnQgdHlwZXMuXG4gICAgU3RvcnkucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaXNzdWVzID0gW107XG4gICAgICAgIGlmICh0aGlzLl90aXRsZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdTdG9yeSB0aXRsZSBzaG91bGQgbm90IGJlIGVtcHR5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaXNzdWVzID0gaXNzdWVzLmNvbmNhdCh0aGlzLl9zdG9yeUNvbnRlbnRzLnZhbGlkYXRlKCkpO1xuICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgIH07XG4gICAgLy8gUmVhc3NpZ25zIGFsbCB2YWx1ZXMgd2l0aGluIHRoaXMgc3RvcnkgdG8gbWF0Y2ggdGhlIGV4aXN0aW5nXG4gICAgLy8gc3RvcnkuIFRoaXMgaXMgcGVyZm9ybWVkIGFzIGEgZGVlcCBjb3B5IHN1Y2ggdGhhdCBub25lIG9mIHRoZVxuICAgIC8vIGludGVybmFsLCBiaW5kYWJsZSBvYmplY3RzIGFyZSBjaGFuZ2VkIHdpdGhpbiB0aGlzIHN0b3J5LlxuICAgIFN0b3J5LnByb3RvdHlwZS5jb3B5RnJvbVN0b3J5ID0gZnVuY3Rpb24gKG90aGVyU3RvcnkpIHtcbiAgICAgICAgdGhpcy5faWQgPSBvdGhlclN0b3J5LmdldElkKCk7XG4gICAgICAgIHRoaXMuc2V0VGl0bGUob3RoZXJTdG9yeS5nZXRUaXRsZSgpKTtcbiAgICAgICAgdGhpcy5zZXREZXNjcmlwdGlvbihvdGhlclN0b3J5LmdldERlc2NyaXB0aW9uKCkpO1xuICAgICAgICB0aGlzLnNldE5vdGVzKG90aGVyU3RvcnkuZ2V0Tm90ZXMoKSk7XG4gICAgICAgIHRoaXMuc2V0TGFuZ3VhZ2VDb2RlKG90aGVyU3RvcnkuZ2V0TGFuZ3VhZ2VDb2RlKCkpO1xuICAgICAgICB0aGlzLl92ZXJzaW9uID0gb3RoZXJTdG9yeS5nZXRWZXJzaW9uKCk7XG4gICAgICAgIHRoaXMuX3N0b3J5Q29udGVudHMgPSBvdGhlclN0b3J5LmdldFN0b3J5Q29udGVudHMoKTtcbiAgICAgICAgdGhpcy5fY29ycmVzcG9uZGluZ1RvcGljSWQgPSBvdGhlclN0b3J5LmdldENvcnJlc3BvbmRpbmdUb3BpY0lkKCk7XG4gICAgfTtcbiAgICByZXR1cm4gU3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5TdG9yeSA9IFN0b3J5O1xudmFyIFN0b3J5T2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdG9yeU9iamVjdEZhY3Rvcnkoc3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgdGhpcy5zdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeSA9IHN0b3J5Q29udGVudHNPYmplY3RGYWN0b3J5O1xuICAgIH1cbiAgICBTdG9yeU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChzdG9yeUJhY2tlbmREaWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgU3Rvcnkoc3RvcnlCYWNrZW5kRGljdC5pZCwgc3RvcnlCYWNrZW5kRGljdC50aXRsZSwgc3RvcnlCYWNrZW5kRGljdC5kZXNjcmlwdGlvbiwgc3RvcnlCYWNrZW5kRGljdC5ub3RlcywgdGhpcy5zdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc3RvcnlCYWNrZW5kRGljdC5zdG9yeV9jb250ZW50cyksIHN0b3J5QmFja2VuZERpY3QubGFuZ3VhZ2VfY29kZSwgc3RvcnlCYWNrZW5kRGljdC52ZXJzaW9uLCBzdG9yeUJhY2tlbmREaWN0LmNvcnJlc3BvbmRpbmdfdG9waWNfaWQpO1xuICAgIH07XG4gICAgLy8gQ3JlYXRlIGFuIGludGVyc3RpdGlhbCBzdG9yeSB0aGF0IHdvdWxkIGJlIGRpc3BsYXllZCBpbiB0aGUgZWRpdG9yIHVudGlsXG4gICAgLy8gdGhlIGFjdHVhbCBzdG9yeSBpcyBmZXRjaGVkIGZyb20gdGhlIGJhY2tlbmQuXG4gICAgU3RvcnlPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVJbnRlcnN0aXRpYWxTdG9yeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdG9yeShudWxsLCAnU3RvcnkgdGl0bGUgbG9hZGluZycsICdTdG9yeSBkZXNjcmlwdGlvbiBsb2FkaW5nJywgJ1N0b3J5IG5vdGVzIGxvYWRpbmcnLCBudWxsLCAnZW4nLCAxLCBudWxsKTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBTdG9yeU9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pLFxuICAgICAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW3R5cGVvZiAoX2EgPSB0eXBlb2YgU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnlfMS5TdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBTdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeV8xLlN0b3J5Q29udGVudHNPYmplY3RGYWN0b3J5KSA9PT0gXCJmdW5jdGlvblwiID8gX2EgOiBPYmplY3RdKVxuICAgIF0sIFN0b3J5T2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIFN0b3J5T2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLlN0b3J5T2JqZWN0RmFjdG9yeSA9IFN0b3J5T2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1N0b3J5T2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoU3RvcnlPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gYnVpbGQgY2hhbmdlcyB0byBhIHN0b3J5LiBUaGVzZSBjaGFuZ2VzIG1heVxuICogdGhlbiBiZSB1c2VkIGJ5IG90aGVyIHNlcnZpY2VzLCBzdWNoIGFzIGEgYmFja2VuZCBBUEkgc2VydmljZSB0byB1cGRhdGUgdGhlXG4gKiBzdG9yeSBpbiB0aGUgYmFja2VuZC4gVGhpcyBzZXJ2aWNlIGFsc28gcmVnaXN0ZXJzIGFsbCBjaGFuZ2VzIHdpdGggdGhlXG4gKiB1bmRvL3JlZG8gc2VydmljZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vQ2hhbmdlT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3Rvcnkvc3RvcnktZG9tYWluLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1N0b3J5VXBkYXRlU2VydmljZScsIFtcbiAgICAnQ2hhbmdlT2JqZWN0RmFjdG9yeScsICdVbmRvUmVkb1NlcnZpY2UnLFxuICAgICdDTURfQUREX1NUT1JZX05PREUnLCAnQ01EX0RFTEVURV9TVE9SWV9OT0RFJyxcbiAgICAnQ01EX1VQREFURV9TVE9SWV9DT05URU5UU19QUk9QRVJUWScsICdDTURfVVBEQVRFX1NUT1JZX05PREVfT1VUTElORV9TVEFUVVMnLFxuICAgICdDTURfVVBEQVRFX1NUT1JZX05PREVfUFJPUEVSVFknLCAnQ01EX1VQREFURV9TVE9SWV9QUk9QRVJUWScsXG4gICAgJ0lOSVRJQUxfTk9ERV9JRCcsICdTVE9SWV9OT0RFX1BST1BFUlRZX0FDUVVJUkVEX1NLSUxMX0lEUycsXG4gICAgJ1NUT1JZX05PREVfUFJPUEVSVFlfREVTVElOQVRJT05fTk9ERV9JRFMnLFxuICAgICdTVE9SWV9OT0RFX1BST1BFUlRZX0VYUExPUkFUSU9OX0lEJyxcbiAgICAnU1RPUllfTk9ERV9QUk9QRVJUWV9PVVRMSU5FJywgJ1NUT1JZX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUycsXG4gICAgJ1NUT1JZX05PREVfUFJPUEVSVFlfVElUTEUnLCAnU1RPUllfUFJPUEVSVFlfREVTQ1JJUFRJT04nLFxuICAgICdTVE9SWV9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFJywgJ1NUT1JZX1BST1BFUlRZX05PVEVTJyxcbiAgICAnU1RPUllfUFJPUEVSVFlfVElUTEUnLCBmdW5jdGlvbiAoQ2hhbmdlT2JqZWN0RmFjdG9yeSwgVW5kb1JlZG9TZXJ2aWNlLCBDTURfQUREX1NUT1JZX05PREUsIENNRF9ERUxFVEVfU1RPUllfTk9ERSwgQ01EX1VQREFURV9TVE9SWV9DT05URU5UU19QUk9QRVJUWSwgQ01EX1VQREFURV9TVE9SWV9OT0RFX09VVExJTkVfU1RBVFVTLCBDTURfVVBEQVRFX1NUT1JZX05PREVfUFJPUEVSVFksIENNRF9VUERBVEVfU1RPUllfUFJPUEVSVFksIElOSVRJQUxfTk9ERV9JRCwgU1RPUllfTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMsIFNUT1JZX05PREVfUFJPUEVSVFlfREVTVElOQVRJT05fTk9ERV9JRFMsIFNUT1JZX05PREVfUFJPUEVSVFlfRVhQTE9SQVRJT05fSUQsIFNUT1JZX05PREVfUFJPUEVSVFlfT1VUTElORSwgU1RPUllfTk9ERV9QUk9QRVJUWV9QUkVSRVFVSVNJVEVfU0tJTExfSURTLCBTVE9SWV9OT0RFX1BST1BFUlRZX1RJVExFLCBTVE9SWV9QUk9QRVJUWV9ERVNDUklQVElPTiwgU1RPUllfUFJPUEVSVFlfTEFOR1VBR0VfQ09ERSwgU1RPUllfUFJPUEVSVFlfTk9URVMsIFNUT1JZX1BST1BFUlRZX1RJVExFKSB7XG4gICAgICAgIC8vIENyZWF0ZXMgYSBjaGFuZ2UgdXNpbmcgYW4gYXBwbHkgZnVuY3Rpb24sIHJldmVyc2UgZnVuY3Rpb24sIGEgY2hhbmdlXG4gICAgICAgIC8vIGNvbW1hbmQgYW5kIHJlbGF0ZWQgcGFyYW1ldGVycy4gVGhlIGNoYW5nZSBpcyBhcHBsaWVkIHRvIGEgZ2l2ZW5cbiAgICAgICAgLy8gc3RvcnkuXG4gICAgICAgIHZhciBfYXBwbHlDaGFuZ2UgPSBmdW5jdGlvbiAoc3RvcnksIGNvbW1hbmQsIHBhcmFtcywgYXBwbHksIHJldmVyc2UpIHtcbiAgICAgICAgICAgIHZhciBjaGFuZ2VEaWN0ID0gYW5ndWxhci5jb3B5KHBhcmFtcyk7XG4gICAgICAgICAgICBjaGFuZ2VEaWN0LmNtZCA9IGNvbW1hbmQ7XG4gICAgICAgICAgICB2YXIgY2hhbmdlT2JqID0gQ2hhbmdlT2JqZWN0RmFjdG9yeS5jcmVhdGUoY2hhbmdlRGljdCwgYXBwbHksIHJldmVyc2UpO1xuICAgICAgICAgICAgVW5kb1JlZG9TZXJ2aWNlLmFwcGx5Q2hhbmdlKGNoYW5nZU9iaiwgc3RvcnkpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldFBhcmFtZXRlckZyb21DaGFuZ2VEaWN0ID0gZnVuY3Rpb24gKGNoYW5nZURpY3QsIHBhcmFtTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZURpY3RbcGFyYW1OYW1lXTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXROb2RlSWRGcm9tQ2hhbmdlRGljdCA9IGZ1bmN0aW9uIChjaGFuZ2VEaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gX2dldFBhcmFtZXRlckZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QsICdub2RlX2lkJyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZ2V0U3RvcnlOb2RlID0gZnVuY3Rpb24gKHN0b3J5Q29udGVudHMsIG5vZGVJZCkge1xuICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZUluZGV4ID0gc3RvcnlDb250ZW50cy5nZXROb2RlSW5kZXgobm9kZUlkKTtcbiAgICAgICAgICAgIGlmIChzdG9yeU5vZGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIGdpdmVuIG5vZGUgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RvcnlDb250ZW50cy5nZXROb2RlcygpW3N0b3J5Tm9kZUluZGV4XTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQXBwbGllcyBhIHN0b3J5IHByb3BlcnR5IGNoYW5nZSwgc3BlY2lmaWNhbGx5LiBTZWUgX2FwcGx5Q2hhbmdlKClcbiAgICAgICAgLy8gZm9yIGRldGFpbHMgb24gdGhlIG90aGVyIGJlaGF2aW9yIG9mIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgIHZhciBfYXBwbHlTdG9yeVByb3BlcnR5Q2hhbmdlID0gZnVuY3Rpb24gKHN0b3J5LCBwcm9wZXJ0eU5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgYXBwbHksIHJldmVyc2UpIHtcbiAgICAgICAgICAgIF9hcHBseUNoYW5nZShzdG9yeSwgQ01EX1VQREFURV9TVE9SWV9QUk9QRVJUWSwge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5X25hbWU6IHByb3BlcnR5TmFtZSxcbiAgICAgICAgICAgICAgICBuZXdfdmFsdWU6IGFuZ3VsYXIuY29weShuZXdWYWx1ZSksXG4gICAgICAgICAgICAgICAgb2xkX3ZhbHVlOiBhbmd1bGFyLmNvcHkob2xkVmFsdWUpXG4gICAgICAgICAgICB9LCBhcHBseSwgcmV2ZXJzZSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfYXBwbHlTdG9yeUNvbnRlbnRzUHJvcGVydHlDaGFuZ2UgPSBmdW5jdGlvbiAoc3RvcnksIHByb3BlcnR5TmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlLCBhcHBseSwgcmV2ZXJzZSkge1xuICAgICAgICAgICAgX2FwcGx5Q2hhbmdlKHN0b3J5LCBDTURfVVBEQVRFX1NUT1JZX0NPTlRFTlRTX1BST1BFUlRZLCB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfbmFtZTogcHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICAgIG5ld192YWx1ZTogYW5ndWxhci5jb3B5KG5ld1ZhbHVlKSxcbiAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IGFuZ3VsYXIuY29weShvbGRWYWx1ZSlcbiAgICAgICAgICAgIH0sIGFwcGx5LCByZXZlcnNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlID0gZnVuY3Rpb24gKHN0b3J5LCBwcm9wZXJ0eU5hbWUsIG5vZGVJZCwgb2xkVmFsdWUsIG5ld1ZhbHVlLCBhcHBseSwgcmV2ZXJzZSkge1xuICAgICAgICAgICAgX2FwcGx5Q2hhbmdlKHN0b3J5LCBDTURfVVBEQVRFX1NUT1JZX05PREVfUFJPUEVSVFksIHtcbiAgICAgICAgICAgICAgICBub2RlX2lkOiBub2RlSWQsXG4gICAgICAgICAgICAgICAgcHJvcGVydHlfbmFtZTogcHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICAgIG5ld192YWx1ZTogYW5ndWxhci5jb3B5KG5ld1ZhbHVlKSxcbiAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IGFuZ3VsYXIuY29weShvbGRWYWx1ZSlcbiAgICAgICAgICAgIH0sIGFwcGx5LCByZXZlcnNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QgPSBmdW5jdGlvbiAoY2hhbmdlRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0LCAnbmV3X3ZhbHVlJyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRoZXNlIGZ1bmN0aW9ucyBhcmUgYXNzb2NpYXRlZCB3aXRoIHVwZGF0ZXMgYXZhaWxhYmxlIGluXG4gICAgICAgIC8vIGNvcmUuZG9tYWluLnN0b3J5X3NlcnZpY2VzLmFwcGx5X2NoYW5nZV9saXN0LlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGFuZ2VzIHRoZSB0aXRsZSBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW4gdGhlXG4gICAgICAgICAgICAgKiB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3RvcnlUaXRsZTogZnVuY3Rpb24gKHN0b3J5LCB0aXRsZSkge1xuICAgICAgICAgICAgICAgIHZhciBvbGRUaXRsZSA9IGFuZ3VsYXIuY29weShzdG9yeS5nZXRUaXRsZSgpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9QUk9QRVJUWV9USVRMRSwgb2xkVGl0bGUsIHRpdGxlLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHlcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gX2dldE5ld1Byb3BlcnR5VmFsdWVGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgc3Rvcnkuc2V0VGl0bGUodGl0bGUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5zZXRUaXRsZShvbGRUaXRsZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGFuZ2VzIHRoZSBkZXNjcmlwdGlvbiBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW4gdGhlXG4gICAgICAgICAgICAgKiB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3RvcnlEZXNjcmlwdGlvbjogZnVuY3Rpb24gKHN0b3J5LCBkZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBvbGREZXNjcmlwdGlvbiA9IGFuZ3VsYXIuY29weShzdG9yeS5nZXREZXNjcmlwdGlvbigpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9QUk9QRVJUWV9ERVNDUklQVElPTiwgb2xkRGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHlcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2NyaXB0aW9uID0gX2dldE5ld1Byb3BlcnR5VmFsdWVGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgc3Rvcnkuc2V0RGVzY3JpcHRpb24oZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5zZXREZXNjcmlwdGlvbihvbGREZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGFuZ2VzIHRoZSBub3RlcyBmb3IgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluIHRoZVxuICAgICAgICAgICAgICogdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0b3J5Tm90ZXM6IGZ1bmN0aW9uIChzdG9yeSwgbm90ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkTm90ZXMgPSBhbmd1bGFyLmNvcHkoc3RvcnkuZ2V0Tm90ZXMoKSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfUFJPUEVSVFlfTk9URVMsIG9sZE5vdGVzLCBub3RlcywgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3RlcyA9IF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LnNldE5vdGVzKG5vdGVzKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3Rvcnkuc2V0Tm90ZXMob2xkTm90ZXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgbGFuZ3VhZ2UgY29kZSBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW5cbiAgICAgICAgICAgICAqIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3RvcnlMYW5ndWFnZUNvZGU6IGZ1bmN0aW9uIChzdG9yeSwgbGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZExhbmd1YWdlQ29kZSA9IGFuZ3VsYXIuY29weShzdG9yeS5nZXRMYW5ndWFnZUNvZGUoKSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfUFJPUEVSVFlfTEFOR1VBR0VfQ09ERSwgb2xkTGFuZ3VhZ2VDb2RlLCBsYW5ndWFnZUNvZGUsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhbmd1YWdlQ29kZSA9IF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LnNldExhbmd1YWdlQ29kZShsYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5zZXRMYW5ndWFnZUNvZGUob2xkTGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldHMgdGhlIGluaXRpYWwgbm9kZSBvZiB0aGUgc3RvcnkgYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpblxuICAgICAgICAgICAgICogdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRJbml0aWFsTm9kZUlkOiBmdW5jdGlvbiAoc3RvcnksIG5ld0luaXRpYWxOb2RlSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkSW5pdGlhbE5vZGVJZCA9IGFuZ3VsYXIuY29weShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuZ2V0SW5pdGlhbE5vZGVJZCgpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeUNvbnRlbnRzUHJvcGVydHlDaGFuZ2Uoc3RvcnksIElOSVRJQUxfTk9ERV9JRCwgb2xkSW5pdGlhbE5vZGVJZCwgbmV3SW5pdGlhbE5vZGVJZCwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuc2V0SW5pdGlhbE5vZGVJZChuZXdJbml0aWFsTm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnNldEluaXRpYWxOb2RlSWQob2xkSW5pdGlhbE5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDcmVhdGVzIGEgc3Rvcnkgbm9kZSwgYWRkcyBpdCB0byB0aGUgc3RvcnkgYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpblxuICAgICAgICAgICAgICogdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhZGRTdG9yeU5vZGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZVRpdGxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHROb2RlSWQgPSBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuZ2V0TmV4dE5vZGVJZCgpO1xuICAgICAgICAgICAgICAgIF9hcHBseUNoYW5nZShzdG9yeSwgQ01EX0FERF9TVE9SWV9OT0RFLCB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVfaWQ6IG5leHROb2RlSWQsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBub2RlVGl0bGVcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5hZGROb2RlKG5vZGVUaXRsZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlSWQgPSBfZ2V0Tm9kZUlkRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5kZWxldGVOb2RlKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZW1vdmVzIGEgc3Rvcnkgbm9kZSwgYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRlbGV0ZVN0b3J5Tm9kZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUluZGV4ID0gc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICAgICAgICAgIF9hcHBseUNoYW5nZShzdG9yeSwgQ01EX0RFTEVURV9TVE9SWV9OT0RFLCB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVfaWQ6IG5vZGVJZFxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmRlbGV0ZU5vZGUobm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0EgZGVsZXRlZCBzdG9yeSBub2RlIGNhbm5vdCBiZSByZXN0b3JlZC4nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1hcmtzIHRoZSBub2RlIG91dGxpbmUgb2YgYSBub2RlIGFzIGZpbmFsaXplZCBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlXG4gICAgICAgICAgICAgKiBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZpbmFsaXplU3RvcnlOb2RlT3V0bGluZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3J5Tm9kZS5nZXRPdXRsaW5lU3RhdHVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vZGUgb3V0bGluZSBpcyBhbHJlYWR5IGZpbmFsaXplZC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2FwcGx5Q2hhbmdlKHN0b3J5LCBDTURfVVBEQVRFX1NUT1JZX05PREVfT1VUTElORV9TVEFUVVMsIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZV9pZDogbm9kZUlkLFxuICAgICAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBuZXdfdmFsdWU6IHRydWVcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5tYXJrTm9kZU91dGxpbmVBc0ZpbmFsaXplZChub2RlSWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkubWFya05vZGVPdXRsaW5lQXNOb3RGaW5hbGl6ZWQobm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1hcmtzIHRoZSBub2RlIG91dGxpbmUgb2YgYSBub2RlIGFzIG5vdCBmaW5hbGl6ZWQgYW5kIHJlY29yZHMgdGhlXG4gICAgICAgICAgICAgKiBjaGFuZ2UgaW4gdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB1bmZpbmFsaXplU3RvcnlOb2RlT3V0bGluZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFzdG9yeU5vZGUuZ2V0T3V0bGluZVN0YXR1cygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdOb2RlIG91dGxpbmUgaXMgYWxyZWFkeSBub3QgZmluYWxpemVkLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfYXBwbHlDaGFuZ2Uoc3RvcnksIENNRF9VUERBVEVfU1RPUllfTk9ERV9PVVRMSU5FX1NUQVRVUywge1xuICAgICAgICAgICAgICAgICAgICBub2RlX2lkOiBub2RlSWQsXG4gICAgICAgICAgICAgICAgICAgIG9sZF92YWx1ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbmV3X3ZhbHVlOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLm1hcmtOb2RlT3V0bGluZUFzTm90RmluYWxpemVkKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5tYXJrTm9kZU91dGxpbmVBc0ZpbmFsaXplZChub2RlSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0cyB0aGUgb3V0bGluZSBvZiBhIG5vZGUgb2YgdGhlIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2VcbiAgICAgICAgICAgICAqIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3RvcnlOb2RlT3V0bGluZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIG5ld091dGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZE91dGxpbmUgPSBzdG9yeU5vZGUuZ2V0T3V0bGluZSgpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX09VVExJTkUsIG5vZGVJZCwgb2xkT3V0bGluZSwgbmV3T3V0bGluZSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuc2V0Tm9kZU91dGxpbmUobm9kZUlkLCBuZXdPdXRsaW5lKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnNldE5vZGVPdXRsaW5lKG5vZGVJZCwgb2xkT3V0bGluZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTZXRzIHRoZSB0aXRsZSBvZiBhIG5vZGUgb2YgdGhlIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2VcbiAgICAgICAgICAgICAqIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3RvcnlOb2RlVGl0bGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBuZXdUaXRsZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yeU5vZGUgPSBfZ2V0U3RvcnlOb2RlKHN0b3J5LmdldFN0b3J5Q29udGVudHMoKSwgbm9kZUlkKTtcbiAgICAgICAgICAgICAgICB2YXIgb2xkVGl0bGUgPSBzdG9yeU5vZGUuZ2V0VGl0bGUoKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeU5vZGVQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfTk9ERV9QUk9QRVJUWV9USVRMRSwgbm9kZUlkLCBvbGRUaXRsZSwgbmV3VGl0bGUsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnNldE5vZGVUaXRsZShub2RlSWQsIG5ld1RpdGxlKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnNldE5vZGVUaXRsZShub2RlSWQsIG9sZFRpdGxlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldHMgdGhlIGlkIG9mIHRoZSBleHBsb3JhdGlvbiB0aGF0IG9mIGEgbm9kZSBvZiB0aGUgc3RvcnkgaXMgbGlua2VkXG4gICAgICAgICAgICAgKiB0byBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3RvcnlOb2RlRXhwbG9yYXRpb25JZDogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIG5ld0V4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEV4cGxvcmF0aW9uSWQgPSBzdG9yeU5vZGUuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX0VYUExPUkFUSU9OX0lELCBub2RlSWQsIG9sZEV4cGxvcmF0aW9uSWQsIG5ld0V4cGxvcmF0aW9uSWQsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnNldE5vZGVFeHBsb3JhdGlvbklkKG5vZGVJZCwgbmV3RXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5zZXROb2RlRXhwbG9yYXRpb25JZChub2RlSWQsIG9sZEV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQWRkcyBhIGRlc3RpbmF0aW9uIG5vZGUgaWQgdG8gYSBub2RlIG9mIGEgc3RvcnkgYW5kIHJlY29yZHMgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICogaW4gdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhZGREZXN0aW5hdGlvbk5vZGVJZFRvTm9kZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIGRlc3RpbmF0aW9uTm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGREZXN0aW5hdGlvbk5vZGVJZHMgPSBhbmd1bGFyLmNvcHkoc3RvcnlOb2RlLmdldERlc3RpbmF0aW9uTm9kZUlkcygpKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3RGVzdGluYXRpb25Ob2RlSWRzID0gYW5ndWxhci5jb3B5KG9sZERlc3RpbmF0aW9uTm9kZUlkcyk7XG4gICAgICAgICAgICAgICAgbmV3RGVzdGluYXRpb25Ob2RlSWRzLnB1c2goZGVzdGluYXRpb25Ob2RlSWQpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX0RFU1RJTkFUSU9OX05PREVfSURTLCBub2RlSWQsIG9sZERlc3RpbmF0aW9uTm9kZUlkcywgbmV3RGVzdGluYXRpb25Ob2RlSWRzLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5hZGREZXN0aW5hdGlvbk5vZGVJZFRvTm9kZShub2RlSWQsIGRlc3RpbmF0aW9uTm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnJlbW92ZURlc3RpbmF0aW9uTm9kZUlkRnJvbU5vZGUobm9kZUlkLCBkZXN0aW5hdGlvbk5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZW1vdmVzIGEgZGVzdGluYXRpb24gbm9kZSBpZCBmcm9tIGEgbm9kZSBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZVxuICAgICAgICAgICAgICogY2hhbmdlIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVtb3ZlRGVzdGluYXRpb25Ob2RlSWRGcm9tTm9kZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIGRlc3RpbmF0aW9uTm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGREZXN0aW5hdGlvbk5vZGVJZHMgPSBhbmd1bGFyLmNvcHkoc3RvcnlOb2RlLmdldERlc3RpbmF0aW9uTm9kZUlkcygpKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3RGVzdGluYXRpb25Ob2RlSWRzID0gYW5ndWxhci5jb3B5KG9sZERlc3RpbmF0aW9uTm9kZUlkcyk7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gbmV3RGVzdGluYXRpb25Ob2RlSWRzLmluZGV4T2YoZGVzdGluYXRpb25Ob2RlSWQpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBnaXZlbiBkZXN0aW5hdGlvbiBub2RlIGlzIG5vdCBwYXJ0IG9mIHRoZSBub2RlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld0Rlc3RpbmF0aW9uTm9kZUlkcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX0RFU1RJTkFUSU9OX05PREVfSURTLCBub2RlSWQsIG9sZERlc3RpbmF0aW9uTm9kZUlkcywgbmV3RGVzdGluYXRpb25Ob2RlSWRzLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5yZW1vdmVEZXN0aW5hdGlvbk5vZGVJZEZyb21Ob2RlKG5vZGVJZCwgZGVzdGluYXRpb25Ob2RlSWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuYWRkRGVzdGluYXRpb25Ob2RlSWRUb05vZGUobm9kZUlkLCBkZXN0aW5hdGlvbk5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBZGRzIGEgcHJlcmVxdWlzaXRlIHNraWxsIGlkIHRvIGEgbm9kZSBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZVxuICAgICAgICAgICAgICogY2hhbmdlIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkUHJlcmVxdWlzaXRlU2tpbGxJZFRvTm9kZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZFByZXJlcXVpc2l0ZVNraWxsSWRzID0gYW5ndWxhci5jb3B5KHN0b3J5Tm9kZS5nZXRQcmVyZXF1aXNpdGVTa2lsbElkcygpKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3UHJlcmVxdWlzaXRlU2tpbGxJZHMgPSBhbmd1bGFyLmNvcHkob2xkUHJlcmVxdWlzaXRlU2tpbGxJZHMpO1xuICAgICAgICAgICAgICAgIG5ld1ByZXJlcXVpc2l0ZVNraWxsSWRzLnB1c2goc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlOb2RlUHJvcGVydHlDaGFuZ2Uoc3RvcnksIFNUT1JZX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUywgbm9kZUlkLCBvbGRQcmVyZXF1aXNpdGVTa2lsbElkcywgbmV3UHJlcmVxdWlzaXRlU2tpbGxJZHMsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmFkZFByZXJlcXVpc2l0ZVNraWxsSWRUb05vZGUobm9kZUlkLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnJlbW92ZVByZXJlcXVpc2l0ZVNraWxsSWRGcm9tTm9kZShub2RlSWQsIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVtb3ZlcyBhIHByZXJlcXVpc2l0ZSBza2lsbCBpZCBmcm9tIGEgbm9kZSBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZVxuICAgICAgICAgICAgICogY2hhbmdlIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVtb3ZlUHJlcmVxdWlzaXRlU2tpbGxJZEZyb21Ob2RlOiBmdW5jdGlvbiAoc3RvcnksIG5vZGVJZCwgc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yeU5vZGUgPSBfZ2V0U3RvcnlOb2RlKHN0b3J5LmdldFN0b3J5Q29udGVudHMoKSwgbm9kZUlkKTtcbiAgICAgICAgICAgICAgICB2YXIgb2xkUHJlcmVxdWlzaXRlU2tpbGxJZHMgPSBhbmd1bGFyLmNvcHkoc3RvcnlOb2RlLmdldFByZXJlcXVpc2l0ZVNraWxsSWRzKCkpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdQcmVyZXF1aXNpdGVTa2lsbElkcyA9IGFuZ3VsYXIuY29weShvbGRQcmVyZXF1aXNpdGVTa2lsbElkcyk7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gbmV3UHJlcmVxdWlzaXRlU2tpbGxJZHMuaW5kZXhPZihza2lsbElkKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gcHJlcmVxdWlzaXRlIHNraWxsIGlzIG5vdCBwYXJ0IG9mIHRoZSBub2RlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld1ByZXJlcXVpc2l0ZVNraWxsSWRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlOb2RlUHJvcGVydHlDaGFuZ2Uoc3RvcnksIFNUT1JZX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUywgbm9kZUlkLCBvbGRQcmVyZXF1aXNpdGVTa2lsbElkcywgbmV3UHJlcmVxdWlzaXRlU2tpbGxJZHMsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnJlbW92ZVByZXJlcXVpc2l0ZVNraWxsSWRGcm9tTm9kZShub2RlSWQsIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuYWRkUHJlcmVxdWlzaXRlU2tpbGxJZFRvTm9kZShub2RlSWQsIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQWRkcyBhbiBhY3F1aXJlZCBza2lsbCBpZCB0byBhIG5vZGUgb2YgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlXG4gICAgICAgICAgICAgKiBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFkZEFjcXVpcmVkU2tpbGxJZFRvTm9kZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEFjcXVpcmVkU2tpbGxJZHMgPSBhbmd1bGFyLmNvcHkoc3RvcnlOb2RlLmdldEFjcXVpcmVkU2tpbGxJZHMoKSk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0FjcXVpcmVkU2tpbGxJZHMgPSBhbmd1bGFyLmNvcHkob2xkQWNxdWlyZWRTa2lsbElkcyk7XG4gICAgICAgICAgICAgICAgbmV3QWNxdWlyZWRTa2lsbElkcy5wdXNoKHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX0FDUVVJUkVEX1NLSUxMX0lEUywgbm9kZUlkLCBvbGRBY3F1aXJlZFNraWxsSWRzLCBuZXdBY3F1aXJlZFNraWxsSWRzLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5hZGRBY3F1aXJlZFNraWxsSWRUb05vZGUobm9kZUlkLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnJlbW92ZUFjcXVpcmVkU2tpbGxJZEZyb21Ob2RlKG5vZGVJZCwgc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZW1vdmVzIGFuIGFjcXVpcmVkIHNraWxsIGlkIGZyb20gYSBub2RlIG9mIGEgc3RvcnkgYW5kIHJlY29yZHMgdGhlXG4gICAgICAgICAgICAgKiBjaGFuZ2UgaW4gdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZW1vdmVBY3F1aXJlZFNraWxsSWRGcm9tTm9kZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEFjcXVpcmVkU2tpbGxJZHMgPSBhbmd1bGFyLmNvcHkoc3RvcnlOb2RlLmdldEFjcXVpcmVkU2tpbGxJZHMoKSk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0FjcXVpcmVkU2tpbGxJZHMgPSBhbmd1bGFyLmNvcHkob2xkQWNxdWlyZWRTa2lsbElkcyk7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gbmV3QWNxdWlyZWRTa2lsbElkcy5pbmRleE9mKHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBnaXZlbiBhY3F1aXJlZCBza2lsbCBpZCBpcyBub3QgcGFydCBvZiB0aGUgbm9kZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXdBY3F1aXJlZFNraWxsSWRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlOb2RlUHJvcGVydHlDaGFuZ2Uoc3RvcnksIFNUT1JZX05PREVfUFJPUEVSVFlfQUNRVUlSRURfU0tJTExfSURTLCBub2RlSWQsIG9sZEFjcXVpcmVkU2tpbGxJZHMsIG5ld0FjcXVpcmVkU2tpbGxJZHMsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnJlbW92ZUFjcXVpcmVkU2tpbGxJZEZyb21Ob2RlKG5vZGVJZCwgc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5hZGRBY3F1aXJlZFNraWxsSWRUb05vZGUobm9kZUlkLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBzdG9yeSBkb21haW4uXG4gKi9cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBzdG9yeV9kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL3N0b3J5L3N0b3J5LWRvbWFpbi5jb25zdGFudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRURJVEFCTEVfU1RPUllfREFUQV9VUkxfVEVNUExBVEUnLCBzdG9yeV9kb21haW5fY29uc3RhbnRzXzEuU3RvcnlEb21haW5Db25zdGFudHMuRURJVEFCTEVfU1RPUllfREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NUT1JZX1BVQkxJU0hfVVJMX1RFTVBMQVRFJywgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5RG9tYWluQ29uc3RhbnRzLlNUT1JZX1BVQkxJU0hfVVJMX1RFTVBMQVRFKTtcbi8vIFRoZXNlIHNob3VsZCBtYXRjaCB0aGUgY29uc3RhbnRzIGRlZmluZWQgaW4gY29yZS5kb21haW4uc3RvcnlfZG9tYWluLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9BRERfU1RPUllfTk9ERScsIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cy5DTURfQUREX1NUT1JZX05PREUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9ERUxFVEVfU1RPUllfTk9ERScsIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cy5DTURfREVMRVRFX1NUT1JZX05PREUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9VUERBVEVfU1RPUllfTk9ERV9PVVRMSU5FX1NUQVRVUycsIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NUT1JZX05PREVfT1VUTElORV9TVEFUVVMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9VUERBVEVfU1RPUllfUFJPUEVSVFknLCBzdG9yeV9kb21haW5fY29uc3RhbnRzXzEuU3RvcnlEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TVE9SWV9QUk9QRVJUWSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX1VQREFURV9TVE9SWV9OT0RFX1BST1BFUlRZJywgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5RG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfU1RPUllfTk9ERV9QUk9QRVJUWSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX1VQREFURV9TVE9SWV9DT05URU5UU19QUk9QRVJUWScsIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NUT1JZX0NPTlRFTlRTX1BST1BFUlRZKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVE9SWV9QUk9QRVJUWV9USVRMRScsIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cy5TVE9SWV9QUk9QRVJUWV9USVRMRSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU1RPUllfUFJPUEVSVFlfREVTQ1JJUFRJT04nLCBzdG9yeV9kb21haW5fY29uc3RhbnRzXzEuU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfUFJPUEVSVFlfREVTQ1JJUFRJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NUT1JZX1BST1BFUlRZX05PVEVTJywgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5RG9tYWluQ29uc3RhbnRzLlNUT1JZX1BST1BFUlRZX05PVEVTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVE9SWV9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFJywgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5RG9tYWluQ29uc3RhbnRzLlNUT1JZX1BST1BFUlRZX0xBTkdVQUdFX0NPREUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0lOSVRJQUxfTk9ERV9JRCcsIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cy5JTklUSUFMX05PREVfSUQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NUT1JZX05PREVfUFJPUEVSVFlfVElUTEUnLCBzdG9yeV9kb21haW5fY29uc3RhbnRzXzEuU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfTk9ERV9QUk9QRVJUWV9USVRMRSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU1RPUllfTk9ERV9QUk9QRVJUWV9PVVRMSU5FJywgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5RG9tYWluQ29uc3RhbnRzLlNUT1JZX05PREVfUFJPUEVSVFlfT1VUTElORSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU1RPUllfTk9ERV9QUk9QRVJUWV9FWFBMT1JBVElPTl9JRCcsIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cy5TVE9SWV9OT0RFX1BST1BFUlRZX0VYUExPUkFUSU9OX0lEKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVE9SWV9OT0RFX1BST1BFUlRZX0RFU1RJTkFUSU9OX05PREVfSURTJywgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5RG9tYWluQ29uc3RhbnRzLlNUT1JZX05PREVfUFJPUEVSVFlfREVTVElOQVRJT05fTk9ERV9JRFMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NUT1JZX05PREVfUFJPUEVSVFlfQUNRVUlSRURfU0tJTExfSURTJywgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5RG9tYWluQ29uc3RhbnRzLlNUT1JZX05PREVfUFJPUEVSVFlfQUNRVUlSRURfU0tJTExfSURTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVE9SWV9OT0RFX1BST1BFUlRZX1BSRVJFUVVJU0lURV9TS0lMTF9JRFMnLCBzdG9yeV9kb21haW5fY29uc3RhbnRzXzEuU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfTk9ERV9QUk9QRVJUWV9QUkVSRVFVSVNJVEVfU0tJTExfSURTKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBzdG9yeSBkb21haW4uXG4gKi9cbnZhciBTdG9yeURvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdG9yeURvbWFpbkNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuRURJVEFCTEVfU1RPUllfREFUQV9VUkxfVEVNUExBVEUgPSAnL3N0b3J5X2VkaXRvcl9oYW5kbGVyL2RhdGEvPHN0b3J5X2lkPic7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfUFVCTElTSF9VUkxfVEVNUExBVEUgPSAnL3N0b3J5X3B1Ymxpc2hfaGFuZGxlci88c3RvcnlfaWQ+JztcbiAgICAvLyBUaGVzZSBzaG91bGQgbWF0Y2ggdGhlIGNvbnN0YW50cyBkZWZpbmVkIGluIGNvcmUuZG9tYWluLnN0b3J5X2RvbWFpbi5cbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5DTURfQUREX1NUT1JZX05PREUgPSAnYWRkX3N0b3J5X25vZGUnO1xuICAgIFN0b3J5RG9tYWluQ29uc3RhbnRzLkNNRF9ERUxFVEVfU1RPUllfTk9ERSA9ICdkZWxldGVfc3Rvcnlfbm9kZSc7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TVE9SWV9OT0RFX09VVExJTkVfU1RBVFVTID0gJ3VwZGF0ZV9zdG9yeV9ub2RlX291dGxpbmVfc3RhdHVzJztcbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NUT1JZX1BST1BFUlRZID0gJ3VwZGF0ZV9zdG9yeV9wcm9wZXJ0eSc7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TVE9SWV9OT0RFX1BST1BFUlRZID0gJ3VwZGF0ZV9zdG9yeV9ub2RlX3Byb3BlcnR5JztcbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NUT1JZX0NPTlRFTlRTX1BST1BFUlRZID0gJ3VwZGF0ZV9zdG9yeV9jb250ZW50c19wcm9wZXJ0eSc7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfUFJPUEVSVFlfVElUTEUgPSAndGl0bGUnO1xuICAgIFN0b3J5RG9tYWluQ29uc3RhbnRzLlNUT1JZX1BST1BFUlRZX0RFU0NSSVBUSU9OID0gJ2Rlc2NyaXB0aW9uJztcbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5TVE9SWV9QUk9QRVJUWV9OT1RFUyA9ICdub3Rlcyc7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfUFJPUEVSVFlfTEFOR1VBR0VfQ09ERSA9ICdsYW5ndWFnZV9jb2RlJztcbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5JTklUSUFMX05PREVfSUQgPSAnaW5pdGlhbF9ub2RlX2lkJztcbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5TVE9SWV9OT0RFX1BST1BFUlRZX1RJVExFID0gJ3RpdGxlJztcbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5TVE9SWV9OT0RFX1BST1BFUlRZX09VVExJTkUgPSAnb3V0bGluZSc7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfTk9ERV9QUk9QRVJUWV9FWFBMT1JBVElPTl9JRCA9ICdleHBsb3JhdGlvbl9pZCc7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfTk9ERV9QUk9QRVJUWV9ERVNUSU5BVElPTl9OT0RFX0lEUyA9ICdkZXN0aW5hdGlvbl9ub2RlX2lkcyc7XG4gICAgU3RvcnlEb21haW5Db25zdGFudHMuU1RPUllfTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMgPSAnYWNxdWlyZWRfc2tpbGxfaWRzJztcbiAgICBTdG9yeURvbWFpbkNvbnN0YW50cy5TVE9SWV9OT0RFX1BST1BFUlRZX1BSRVJFUVVJU0lURV9TS0lMTF9JRFMgPSAncHJlcmVxdWlzaXRlX3NraWxsX2lkcyc7XG4gICAgcmV0dXJuIFN0b3J5RG9tYWluQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuU3RvcnlEb21haW5Db25zdGFudHMgPSBTdG9yeURvbWFpbkNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIG1haW4gc3RvcnkgZWRpdG9yLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiL3N0b3J5LW5vZGUtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlVcGRhdGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9zdG9yeS1lZGl0b3Itc3RhdGUuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzdG9yeUVkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiL3N0b3J5LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UnLCAnU3RvcnlVcGRhdGVTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnVW5kb1JlZG9TZXJ2aWNlJywgJ0VWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1InLCAnJHVpYk1vZGFsJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfU1RPUllfSU5JVElBTElaRUQnLCAnRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCcsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBTdG9yeUVkaXRvclN0YXRlU2VydmljZSwgU3RvcnlVcGRhdGVTZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIEVWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1IsICR1aWJNb2RhbCwgRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQsIEFsZXJ0c1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5ID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0U3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdG9yeUNvbnRlbnRzID0gJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc3RvcnlDb250ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXROb2RlVG9FZGl0KCRzY29wZS5zdG9yeUNvbnRlbnRzLmdldEluaXRpYWxOb2RlSWQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW5pdEVkaXRvcigpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2luaXRFZGl0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnkgPSBTdG9yeUVkaXRvclN0YXRlU2VydmljZS5nZXRTdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5Q29udGVudHMgPSAkc2NvcGUuc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpc2Nvbm5lY3RlZE5vZGVJZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc3RvcnlDb250ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ub2RlcyA9ICRzY29wZS5zdG9yeUNvbnRlbnRzLmdldE5vZGVzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpc2Nvbm5lY3RlZE5vZGVJZHMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnlDb250ZW50cy5nZXREaXNjb25uZWN0ZWROb2RlSWRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm90ZXNFZGl0b3JJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnlUaXRsZUVkaXRvcklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lZGl0YWJsZVRpdGxlID0gJHNjb3BlLnN0b3J5LmdldFRpdGxlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZWRpdGFibGVOb3RlcyA9ICRzY29wZS5zdG9yeS5nZXROb3RlcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVkaXRhYmxlRGVzY3JpcHRpb24gPSAkc2NvcGUuc3RvcnkuZ2V0RGVzY3JpcHRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lZGl0YWJsZURlc2NyaXB0aW9uSXNFbXB0eSA9ICgkc2NvcGUuZWRpdGFibGVEZXNjcmlwdGlvbiA9PT0gJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5RGVzY3JpcHRpb25DaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXROb2RlVG9FZGl0ID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlkT2ZOb2RlVG9FZGl0ID0gbm9kZUlkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub3Blbk5vdGVzRWRpdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vdGVzRWRpdG9ySXNTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZU5vdGVzRWRpdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vdGVzRWRpdG9ySXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNJbml0aWFsTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5nZXRJbml0aWFsTm9kZUlkKCkgPT09IG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tYXJrQXNJbml0aWFsTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXNJbml0aWFsTm9kZShub2RlSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnNldEluaXRpYWxOb2RlSWQoJHNjb3BlLnN0b3J5LCBub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX2luaXRFZGl0b3IoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZU5vZGUgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmlzSW5pdGlhbE5vZGUobm9kZUlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ0Nhbm5vdCBkZWxldGUgdGhlIGZpcnN0IGNoYXB0ZXIgb2YgYSBzdG9yeS4nLCAzMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9tb2RhbC10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkZWxldGUtY2hhcHRlci1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maXJtRGVsZXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UuZGVsZXRlU3RvcnlOb2RlKCRzY29wZS5zdG9yeSwgbm9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3JlYXRlTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub2RlVGl0bGVzID0gJHNjb3BlLm5vZGVzLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmdldFRpdGxlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL21vZGFsLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25ldy1jaGFwdGVyLXRpdGxlLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vZGVUaXRsZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vZGVUaXRsZXMgPSBub2RlVGl0bGVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVycm9yTXNnID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZXNldEVycm9yTXNnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lcnJvck1zZyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzTm9kZVRpdGxlRW1wdHkgPSBmdW5jdGlvbiAobm9kZVRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChub2RlVGl0bGUgPT09ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubm9kZVRpdGxlcy5pbmRleE9mKHRpdGxlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVycm9yTXNnID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdBIGNoYXB0ZXIgd2l0aCB0aGlzIHRpdGxlIGFscmVhZHkgZXhpc3RzJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSh0aXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLmFkZFN0b3J5Tm9kZSgkc2NvcGUuc3RvcnksIHRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfaW5pdEVkaXRvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBmaXJzdCBub2RlIGlzIGFkZGVkLCBvcGVuIGl0IGp1c3QgYWZ0ZXIgY3JlYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuZ2V0Tm9kZXMoKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldE5vZGVUb0VkaXQoJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5nZXRJbml0aWFsTm9kZUlkKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuTk9URVNfU0NIRU1BID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdWlfY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnR1cEZvY3VzRW5hYmxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZU5vdGVzID0gZnVuY3Rpb24gKG5ld05vdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3Tm90ZXMgPT09ICRzY29wZS5zdG9yeS5nZXROb3RlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnNldFN0b3J5Tm90ZXMoJHNjb3BlLnN0b3J5LCBuZXdOb3Rlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW5pdEVkaXRvcigpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlU3RvcnlEZXNjcmlwdGlvblN0YXR1cyA9IGZ1bmN0aW9uIChkZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVkaXRhYmxlRGVzY3JpcHRpb25Jc0VtcHR5ID0gKGRlc2NyaXB0aW9uID09PSAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnlEZXNjcmlwdGlvbkNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlU3RvcnlUaXRsZSA9IGZ1bmN0aW9uIChuZXdUaXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1RpdGxlID09PSAkc2NvcGUuc3RvcnkuZ2V0VGl0bGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5zZXRTdG9yeVRpdGxlKCRzY29wZS5zdG9yeSwgbmV3VGl0bGUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlU3RvcnlEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChuZXdEZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld0Rlc2NyaXB0aW9uICE9PSAkc2NvcGUuc3RvcnkuZ2V0RGVzY3JpcHRpb24oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5zZXRTdG9yeURlc2NyaXB0aW9uKCRzY29wZS5zdG9yeSwgbmV3RGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1IsIGZ1bmN0aW9uIChldnQsIG5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldE5vZGVUb0VkaXQobm9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3N0b3J5R3JhcGhVcGRhdGVkJywgZnVuY3Rpb24gKGV2dCwgc3RvcnlDb250ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2luaXRFZGl0b3IoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIF9pbml0KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVELCBfaW5pdEVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgIF9pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIF9pbml0RWRpdG9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgc3Rvcnkgbm9kZSBlZGl0b3IuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3N0b3J5L1N0b3J5VXBkYXRlU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc2VydmljZXMvc3RvcnktZWRpdG9yLXN0YXRlLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc3RvcnlOb2RlRWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0SWQ6ICcmbm9kZUlkJyxcbiAgICAgICAgICAgICAgICBnZXRPdXRsaW5lOiAnJm91dGxpbmUnLFxuICAgICAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uSWQ6ICcmZXhwbG9yYXRpb25JZCcsXG4gICAgICAgICAgICAgICAgaXNPdXRsaW5lRmluYWxpemVkOiAnJm91dGxpbmVGaW5hbGl6ZWQnLFxuICAgICAgICAgICAgICAgIGdldERlc3RpbmF0aW9uTm9kZUlkczogJyZkZXN0aW5hdGlvbk5vZGVJZHMnLFxuICAgICAgICAgICAgICAgIGdldFByZXJlcXVpc2l0ZVNraWxsSWRzOiAnJnByZXJlcXVpc2l0ZVNraWxsSWRzJyxcbiAgICAgICAgICAgICAgICBnZXRBY3F1aXJlZFNraWxsSWRzOiAnJmFjcXVpcmVkU2tpbGxJZHMnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvZWRpdG9yLXRhYi9zdG9yeS1ub2RlLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHJvb3RTY29wZScsICckdWliTW9kYWwnLCAnU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTdG9yeVVwZGF0ZVNlcnZpY2UnLCAnVW5kb1JlZG9TZXJ2aWNlJywgJ0VWRU5UX1NUT1JZX0lOSVRJQUxJWkVEJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCcsICdFVkVOVF9WSUVXX1NUT1JZX05PREVfRURJVE9SJyxcbiAgICAgICAgICAgICAgICAnQWxlcnRzU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHVpYk1vZGFsLCBTdG9yeUVkaXRvclN0YXRlU2VydmljZSwgU3RvcnlVcGRhdGVTZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIEVWRU5UX1NUT1JZX0lOSVRJQUxJWkVELCBFVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVELCBFVkVOVF9WSUVXX1NUT1JZX05PREVfRURJVE9SLCBBbGVydHNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfcmVjYWxjdWxhdGVBdmFpbGFibGVOb2RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdOb2RlSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmF2YWlsYWJsZU5vZGVzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS5zdG9yeU5vZGVJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnN0b3J5Tm9kZUlkc1tpXSA9PT0gJHNjb3BlLmdldElkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZ2V0RGVzdGluYXRpb25Ob2RlSWRzKCkuaW5kZXhPZigkc2NvcGUuc3RvcnlOb2RlSWRzW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hdmFpbGFibGVOb2Rlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICRzY29wZS5zdG9yeU5vZGVJZHNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICRzY29wZS5ub2RlSWRUb1RpdGxlTWFwWyRzY29wZS5zdG9yeU5vZGVJZHNbaV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBfaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdG9yeSA9IFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLmdldFN0b3J5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnlOb2RlSWRzID0gJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5nZXROb2RlSWRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZUlkVG9UaXRsZU1hcCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5nZXROb2RlSWRzVG9UaXRsZU1hcCgkc2NvcGUuc3RvcnlOb2RlSWRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9yZWNhbGN1bGF0ZUF2YWlsYWJsZU5vZGVzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFRpdGxlID0gJHNjb3BlLm5vZGVJZFRvVGl0bGVNYXBbJHNjb3BlLmdldElkKCldO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVkaXRhYmxlVGl0bGUgPSAkc2NvcGUuY3VycmVudFRpdGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9sZE91dGxpbmUgPSAkc2NvcGUuZ2V0T3V0bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVkaXRhYmxlT3V0bGluZSA9ICRzY29wZS5nZXRPdXRsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25JZCA9ICRzY29wZS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudEV4cGxvcmF0aW9uSWQgPSAkc2NvcGUuZXhwbG9yYXRpb25JZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ub2RlVGl0bGVFZGl0b3JJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuT1VUTElORV9TQ0hFTUEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpX2NvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3dzOiAxMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0U2tpbGxFZGl0b3JVcmwgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcvc2tpbGxfZWRpdG9yLycgKyBza2lsbElkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBSZWdleCBwYXR0ZXJuIGZvciBleHBsb3JhdGlvbiBpZCwgRVhQTE9SQVRJT05fQU5EX1NLSUxMX0lEX1BBVFRFUk5cbiAgICAgICAgICAgICAgICAgICAgLy8gaXMgbm90IGJlaW5nIHVzZWQgaGVyZSwgYXMgdGhlIGNoYXB0ZXIgb2YgdGhlIHN0b3J5IGNhbiBiZSBzYXZlZFxuICAgICAgICAgICAgICAgICAgICAvLyB3aXRoIGVtcHR5IGV4cGxvcmF0aW9uIGlkLlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25JZFBhdHRlcm4gPSAvXlthLXpBLVowLTlfLV0qJC87XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5TYXZlRXhwSWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2hlY2tDYW5TYXZlRXhwSWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuU2F2ZUV4cElkID0gJHNjb3BlLmV4cGxvcmF0aW9uSWRQYXR0ZXJuLnRlc3QoJHNjb3BlLmV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlVGl0bGUgPSBmdW5jdGlvbiAobmV3VGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdUaXRsZSA9PT0gJHNjb3BlLmN1cnJlbnRUaXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5zZXRTdG9yeU5vZGVUaXRsZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBuZXdUaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFRpdGxlID0gbmV3VGl0bGU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS52aWV3Tm9kZUVkaXRvciA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9WSUVXX1NUT1JZX05PREVfRURJVE9SLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZmluYWxpemVPdXRsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLmZpbmFsaXplU3RvcnlOb2RlT3V0bGluZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnNldFN0b3J5Tm9kZUV4cGxvcmF0aW9uSWQoJHNjb3BlLnN0b3J5LCAkc2NvcGUuZ2V0SWQoKSwgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudEV4cGxvcmF0aW9uSWQgPSBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkUHJlcmVxdWlzaXRlU2tpbGxJZCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5hZGRQcmVyZXF1aXNpdGVTa2lsbElkVG9Ob2RlKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCksIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnR2l2ZW4gc2tpbGwgaXMgYWxyZWFkeSBhIHByZXJlcXVpc2l0ZSBza2lsbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnByZXJlcXVpc2l0ZVNraWxsSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZlUHJlcmVxdWlzaXRlU2tpbGxJZCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UucmVtb3ZlUHJlcmVxdWlzaXRlU2tpbGxJZEZyb21Ob2RlKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCksIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkQWNxdWlyZWRTa2lsbElkID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLmFkZEFjcXVpcmVkU2tpbGxJZFRvTm9kZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0dpdmVuIHNraWxsIGlzIGFscmVhZHkgYW4gYWNxdWlyZWQgc2tpbGwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3F1aXJlZFNraWxsSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZlQWNxdWlyZWRTa2lsbElkID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5yZW1vdmVBY3F1aXJlZFNraWxsSWRGcm9tTm9kZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVuZmluYWxpemVPdXRsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnVuZmluYWxpemVTdG9yeU5vZGVPdXRsaW5lKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkTmV3RGVzdGluYXRpb25Ob2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVUaXRsZXMgPSAkc2NvcGUuc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmdldE5vZGVzKCkubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0VGl0bGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbW9kYWwtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmV3LWNoYXB0ZXItdGl0bGUtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlcyA9IG5vZGVUaXRsZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JNc2cgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3JNc2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVycm9yTXNnID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNOb2RlVGl0bGVFbXB0eSA9IGZ1bmN0aW9uIChub2RlVGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG5vZGVUaXRsZSA9PT0gJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5ub2RlVGl0bGVzLmluZGV4T2YodGl0bGUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JNc2cgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0EgY2hhcHRlciB3aXRoIHRoaXMgdGl0bGUgYWxyZWFkeSBleGlzdHMnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dE5vZGVJZCA9ICRzY29wZS5zdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuZ2V0TmV4dE5vZGVJZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5hZGRTdG9yeU5vZGUoJHNjb3BlLnN0b3J5LCB0aXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLmFkZERlc3RpbmF0aW9uTm9kZUlkVG9Ob2RlKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCksIG5leHROb2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlY2FsY3VsYXRlQXZhaWxhYmxlTm9kZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkRGVzdGluYXRpb25Ob2RlID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUlkID09PSAkc2NvcGUuZ2V0SWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ0EgY2hhcHRlciBjYW5ub3QgbGVhZCB0byBpdHNlbGYuJywgMzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UuYWRkRGVzdGluYXRpb25Ob2RlSWRUb05vZGUoJHNjb3BlLnN0b3J5LCAkc2NvcGUuZ2V0SWQoKSwgbm9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1RoZSBnaXZlbiBjaGFwdGVyIGlzIGFscmVhZHkgYSBkZXN0aW5hdGlvbiBmb3IgY3VycmVudCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NoYXB0ZXInLCAzMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3N0b3J5R3JhcGhVcGRhdGVkJywgJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfcmVjYWxjdWxhdGVBdmFpbGFibGVOb2RlcygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZlRGVzdGluYXRpb25Ob2RlSWQgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UucmVtb3ZlRGVzdGluYXRpb25Ob2RlSWRGcm9tTm9kZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzdG9yeUdyYXBoVXBkYXRlZCcsICRzY29wZS5zdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3JlY2FsY3VsYXRlQXZhaWxhYmxlTm9kZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9wZW5Ob2RlVGl0bGVFZGl0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlRWRpdG9ySXNTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZU5vZGVUaXRsZUVkaXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ub2RlVGl0bGVFZGl0b3JJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc091dGxpbmVNb2RpZmllZCA9IGZ1bmN0aW9uIChvdXRsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5vbGRPdXRsaW5lICE9PSBvdXRsaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZU91dGxpbmUgPSBmdW5jdGlvbiAobmV3T3V0bGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuaXNPdXRsaW5lTW9kaWZpZWQobmV3T3V0bGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2Uuc2V0U3RvcnlOb2RlT3V0bGluZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBuZXdPdXRsaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vbGRPdXRsaW5lID0gbmV3T3V0bGluZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCwgX2luaXQpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQsIF9pbml0KTtcbiAgICAgICAgICAgICAgICAgICAgX2luaXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSBuYXZiYXIgYnJlYWRjcnVtYiBvZiB0aGUgc3RvcnkgZWRpdG9yLlxuICovXG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9VbmRvUmVkb1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3NlcnZpY2VzL3N0b3J5LWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiL3N0b3J5LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzdG9yeUVkaXRvck5hdmJhckJyZWFkY3J1bWInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbmF2YmFyLycgK1xuICAgICAgICAgICAgICAgICdzdG9yeS1lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbCcsICckd2luZG93JywgJ1VybFNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVbmRvUmVkb1NlcnZpY2UnLCAnU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsLCAkd2luZG93LCBVcmxTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVW5kb1JlZG9TZXJ2aWNlLCBTdG9yeUVkaXRvclN0YXRlU2VydmljZSwgRVZFTlRfU1RPUllfSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5ID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0U3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIFRPUElDX0VESVRPUl9VUkxfVEVNUExBVEUgPSAnL3RvcGljX2VkaXRvci88dG9waWNJZD4nO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX1NUT1JZX0lOSVRJQUxJWkVELCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNOYW1lID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0VG9waWNOYW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmV0dXJuVG9Ub3BpY0VkaXRvclBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVW5kb1JlZG9TZXJ2aWNlLmdldENoYW5nZUNvdW50KCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL21vZGFsLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzYXZlLXBlbmRpbmctY2hhbmdlcy1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5vcGVuKFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFRPUElDX0VESVRPUl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9waWNJZDogJHNjb3BlLnN0b3J5LmdldENvcnJlc3BvbmRpbmdUb3BpY0lkKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSwgJ19zZWxmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIHN0b3J5IGVkaXRvci5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICdsb2FkaW5nLWRvdHMuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9CYXNlVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9VbmRvUmVkb1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3NlcnZpY2VzL3N0b3J5LWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc3RvcnlFZGl0b3JOYXZiYXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbmF2YmFyL3N0b3J5LWVkaXRvci1uYXZiYXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJHVpYk1vZGFsJywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdVbmRvUmVkb1NlcnZpY2UnLCAnU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UnLCAnVXJsU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1NUT1JZX0lOSVRJQUxJWkVEJywgJ0VWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHVpYk1vZGFsLCBBbGVydHNTZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCwgRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCwgRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5ID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0U3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU3RvcnlQdWJsaXNoZWQgPSBTdG9yeUVkaXRvclN0YXRlU2VydmljZS5pc1N0b3J5UHVibGlzaGVkO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTYXZlSW5Qcm9ncmVzcyA9IFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLmlzU2F2aW5nU3Rvcnk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS52YWxpZGF0aW9uSXNzdWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRDaGFuZ2VMaXN0TGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVuZG9SZWRvU2VydmljZS5nZXRDaGFuZ2VDb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0V2FybmluZ3NDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUudmFsaWRhdGlvbklzc3Vlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1N0b3J5U2F2ZWFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5nZXRDaGFuZ2VMaXN0TGVuZ3RoKCkgPiAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldFdhcm5pbmdzQ291bnQoKSA9PT0gMCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kaXNjYXJkQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFVuZG9SZWRvU2VydmljZS5jbGVhckNoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLmxvYWRTdG9yeSgkc2NvcGUuc3RvcnkuZ2V0SWQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBfdmFsaWRhdGVTdG9yeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS52YWxpZGF0aW9uSXNzdWVzID0gJHNjb3BlLnN0b3J5LnZhbGlkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL21vZGFsLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0b3J5LWVkaXRvci1zYXZlLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoY29tbWl0TWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKGNvbW1pdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChjb21taXRNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2Uuc2F2ZVN0b3J5KGNvbW1pdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeUVkaXRvclN0YXRlU2VydmljZS5jaGFuZ2VTdG9yeVB1YmxpY2F0aW9uU3RhdHVzKHRydWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnlJc1B1Ymxpc2hlZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLmlzU3RvcnlQdWJsaXNoZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudW5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeUVkaXRvclN0YXRlU2VydmljZS5jaGFuZ2VTdG9yeVB1YmxpY2F0aW9uU3RhdHVzKGZhbHNlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5SXNQdWJsaXNoZWQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yeUVkaXRvclN0YXRlU2VydmljZS5pc1N0b3J5UHVibGlzaGVkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCwgX3ZhbGlkYXRlU3RvcnkpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQsIF92YWxpZGF0ZVN0b3J5KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCwgX3ZhbGlkYXRlU3RvcnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBtYWludGFpbiB0aGUgc3RhdGUgb2YgYSBzaW5nbGUgc3Rvcnkgc2hhcmVkXG4gKiB0aHJvdWdob3V0IHRoZSBzdG9yeSBlZGl0b3IuIFRoaXMgc2VydmljZSBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IGZvclxuICogcmV0cmlldmluZyB0aGUgc3RvcnksIHNhdmluZyBpdCwgYW5kIGxpc3RlbmluZyBmb3IgY2hhbmdlcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3ItcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTdG9yeUVkaXRvclN0YXRlU2VydmljZScsIFtcbiAgICAnJHJvb3RTY29wZScsICdBbGVydHNTZXJ2aWNlJywgJ0VkaXRhYmxlU3RvcnlCYWNrZW5kQXBpU2VydmljZScsXG4gICAgJ1N0b3J5T2JqZWN0RmFjdG9yeScsICdVbmRvUmVkb1NlcnZpY2UnLFxuICAgICdFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCcsICdFVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVEJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQWxlcnRzU2VydmljZSwgRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlLCBTdG9yeU9iamVjdEZhY3RvcnksIFVuZG9SZWRvU2VydmljZSwgRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQpIHtcbiAgICAgICAgdmFyIF9zdG9yeSA9IFN0b3J5T2JqZWN0RmFjdG9yeS5jcmVhdGVJbnRlcnN0aXRpYWxTdG9yeSgpO1xuICAgICAgICB2YXIgX3N0b3J5SXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICB2YXIgX3N0b3J5SXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBfc3RvcnlJc0JlaW5nU2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIF90b3BpY05hbWUgPSBudWxsO1xuICAgICAgICB2YXIgX3N0b3J5SXNQdWJsaXNoZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIF9zZXRTdG9yeSA9IGZ1bmN0aW9uIChzdG9yeSkge1xuICAgICAgICAgICAgX3N0b3J5LmNvcHlGcm9tU3Rvcnkoc3RvcnkpO1xuICAgICAgICAgICAgaWYgKF9zdG9yeUlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoRVZFTlRfU1RPUllfSU5JVElBTElaRUQpO1xuICAgICAgICAgICAgICAgIF9zdG9yeUlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgX3NldFRvcGljTmFtZSA9IGZ1bmN0aW9uICh0b3BpY05hbWUpIHtcbiAgICAgICAgICAgIF90b3BpY05hbWUgPSB0b3BpY05hbWU7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2V0U3RvcnlQdWJsaWNhdGlvblN0YXR1cyA9IGZ1bmN0aW9uIChzdG9yeUlzUHVibGlzaGVkKSB7XG4gICAgICAgICAgICBfc3RvcnlJc1B1Ymxpc2hlZCA9IHN0b3J5SXNQdWJsaXNoZWQ7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfdXBkYXRlU3RvcnkgPSBmdW5jdGlvbiAobmV3QmFja2VuZFN0b3J5T2JqZWN0KSB7XG4gICAgICAgICAgICBfc2V0U3RvcnkoU3RvcnlPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChuZXdCYWNrZW5kU3RvcnlPYmplY3QpKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTG9hZHMsIG9yIHJlbG9hZHMsIHRoZSBzdG9yeSBzdG9yZWQgYnkgdGhpcyBzZXJ2aWNlIGdpdmVuIGFcbiAgICAgICAgICAgICAqIHNwZWNpZmllZCBzdG9yeSBJRC4gU2VlIHNldFN0b3J5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb24gb25cbiAgICAgICAgICAgICAqIGFkZGl0aW9uYWwgYmVoYXZpb3Igb2YgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9hZFN0b3J5OiBmdW5jdGlvbiAoc3RvcnlJZCkge1xuICAgICAgICAgICAgICAgIF9zdG9yeUlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlLmZldGNoU3Rvcnkoc3RvcnlJZCkudGhlbihmdW5jdGlvbiAobmV3QmFja2VuZFN0b3J5T2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRUb3BpY05hbWUobmV3QmFja2VuZFN0b3J5T2JqZWN0LnRvcGljTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIF91cGRhdGVTdG9yeShuZXdCYWNrZW5kU3RvcnlPYmplY3Quc3RvcnkpO1xuICAgICAgICAgICAgICAgICAgICBfc2V0U3RvcnlQdWJsaWNhdGlvblN0YXR1cyhuZXdCYWNrZW5kU3RvcnlPYmplY3Quc3RvcnlJc1B1Ymxpc2hlZCk7XG4gICAgICAgICAgICAgICAgICAgIF9zdG9yeUlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoZXJyb3IgfHwgJ1RoZXJlIHdhcyBhbiBlcnJvciB3aGVuIGxvYWRpbmcgdGhlIHN0b3J5LicpO1xuICAgICAgICAgICAgICAgICAgICBfc3RvcnlJc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGlzIHNlcnZpY2UgaXMgY3VycmVudGx5IGF0dGVtcHRpbmcgdG8gbG9hZCB0aGVcbiAgICAgICAgICAgICAqIHN0b3J5IG1haW50YWluZWQgYnkgdGhpcyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0xvYWRpbmdTdG9yeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RvcnlJc0xvYWRpbmc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgYSBzdG9yeSBoYXMgeWV0IGJlZW4gbG9hZGVkIHVzaW5nIGVpdGhlclxuICAgICAgICAgICAgICogbG9hZFN0b3J5KCkgb3Igc2V0U3RvcnkoKS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaGFzTG9hZGVkU3Rvcnk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N0b3J5SXNJbml0aWFsaXplZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc3RvcnkgdG8gYmUgc2hhcmVkIGFtb25nIHRoZSBzdG9yeVxuICAgICAgICAgICAgICogZWRpdG9yLiBQbGVhc2Ugbm90ZSBhbnkgY2hhbmdlcyB0byB0aGlzIHN0b3J5IHdpbGwgYmUgcHJvcG9nYXRlZFxuICAgICAgICAgICAgICogdG8gYWxsIGJpbmRpbmdzIHRvIGl0LiBUaGlzIHN0b3J5IG9iamVjdCB3aWxsIGJlIHJldGFpbmVkIGZvciB0aGVcbiAgICAgICAgICAgICAqIGxpZmV0aW1lIG9mIHRoZSBlZGl0b3IuIFRoaXMgZnVuY3Rpb24gbmV2ZXIgcmV0dXJucyBudWxsLCB0aG91Z2ggaXQgbWF5XG4gICAgICAgICAgICAgKiByZXR1cm4gYW4gZW1wdHkgc3Rvcnkgb2JqZWN0IGlmIHRoZSBzdG9yeSBoYXMgbm90IHlldCBiZWVuXG4gICAgICAgICAgICAgKiBsb2FkZWQgZm9yIHRoaXMgZWRpdG9yIGluc3RhbmNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdG9yeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3Rvcnk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTZXRzIHRoZSBzdG9yeSBzdG9yZWQgd2l0aGluIHRoaXMgc2VydmljZSwgcHJvcG9nYXRpbmcgY2hhbmdlcyB0b1xuICAgICAgICAgICAgICogYWxsIGJpbmRpbmdzIHRvIHRoZSBzdG9yeSByZXR1cm5lZCBieSBnZXRTdG9yeSgpLiBUaGUgZmlyc3RcbiAgICAgICAgICAgICAqIHRpbWUgdGhpcyBpcyBjYWxsZWQgaXQgd2lsbCBmaXJlIGEgZ2xvYmFsIGV2ZW50IGJhc2VkIG9uIHRoZVxuICAgICAgICAgICAgICogRVZFTlRfU1RPUllfSU5JVElBTElaRUQgY29uc3RhbnQuIEFsbCBzdWJzZXF1ZW50XG4gICAgICAgICAgICAgKiBjYWxscyB3aWxsIHNpbWlsYXJseSBmaXJlIGEgRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCBldmVudC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3Rvcnk6IGZ1bmN0aW9uIChzdG9yeSkge1xuICAgICAgICAgICAgICAgIF9zZXRTdG9yeShzdG9yeSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VG9waWNOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90b3BpY05hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNTdG9yeVB1Ymxpc2hlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RvcnlJc1B1Ymxpc2hlZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEF0dGVtcHRzIHRvIHNhdmUgdGhlIGN1cnJlbnQgc3RvcnkgZ2l2ZW4gYSBjb21taXQgbWVzc2FnZS4gVGhpc1xuICAgICAgICAgICAgICogZnVuY3Rpb24gY2Fubm90IGJlIGNhbGxlZCB1bnRpbCBhZnRlciBhIHN0b3J5IGhhcyBiZWVuIGluaXRpYWxpemVkXG4gICAgICAgICAgICAgKiBpbiB0aGlzIHNlcnZpY2UuIFJldHVybnMgZmFsc2UgaWYgYSBzYXZlIGlzIG5vdCBwZXJmb3JtZWQgZHVlIHRvIG5vXG4gICAgICAgICAgICAgKiBjaGFuZ2VzIHBlbmRpbmcsIG9yIHRydWUgaWYgb3RoZXJ3aXNlLiBUaGlzIGZ1bmN0aW9uLCB1cG9uIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgKiB3aWxsIGNsZWFyIHRoZSBVbmRvUmVkb1NlcnZpY2Ugb2YgcGVuZGluZyBjaGFuZ2VzLiBUaGlzIGZ1bmN0aW9uIGFsc29cbiAgICAgICAgICAgICAqIHNoYXJlcyBiZWhhdmlvciB3aXRoIHNldFN0b3J5KCksIHdoZW4gaXQgc3VjY2VlZHMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNhdmVTdG9yeTogZnVuY3Rpb24gKGNvbW1pdE1lc3NhZ2UsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghX3N0b3J5SXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnQ2Fubm90IHNhdmUgYSBzdG9yeSBiZWZvcmUgb25lIGlzIGxvYWRlZC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgYXR0ZW1wdCB0byBzYXZlIHRoZSBzdG9yeSBpZiB0aGVyZSBhcmUgbm8gY2hhbmdlcyBwZW5kaW5nLlxuICAgICAgICAgICAgICAgIGlmICghVW5kb1JlZG9TZXJ2aWNlLmhhc0NoYW5nZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9zdG9yeUlzQmVpbmdTYXZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlLnVwZGF0ZVN0b3J5KF9zdG9yeS5nZXRJZCgpLCBfc3RvcnkuZ2V0VmVyc2lvbigpLCBjb21taXRNZXNzYWdlLCBVbmRvUmVkb1NlcnZpY2UuZ2V0Q29tbWl0dGFibGVDaGFuZ2VMaXN0KCkpLnRoZW4oZnVuY3Rpb24gKHN0b3J5QmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlU3Rvcnkoc3RvcnlCYWNrZW5kT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgVW5kb1JlZG9TZXJ2aWNlLmNsZWFyQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICBfc3RvcnlJc0JlaW5nU2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKGVycm9yIHx8ICdUaGVyZSB3YXMgYW4gZXJyb3Igd2hlbiBzYXZpbmcgdGhlIHN0b3J5LicpO1xuICAgICAgICAgICAgICAgICAgICBfc3RvcnlJc0JlaW5nU2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGFuZ2VTdG9yeVB1YmxpY2F0aW9uU3RhdHVzOiBmdW5jdGlvbiAobmV3U3RvcnlTdGF0dXNJc1B1YmxpYywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfc3RvcnlJc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuZmF0YWxXYXJuaW5nKCdDYW5ub3QgcHVibGlzaCBhIHN0b3J5IGJlZm9yZSBvbmUgaXMgbG9hZGVkLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBFZGl0YWJsZVN0b3J5QmFja2VuZEFwaVNlcnZpY2UuY2hhbmdlU3RvcnlQdWJsaWNhdGlvblN0YXR1cyhfc3RvcnkuZ2V0SWQoKSwgbmV3U3RvcnlTdGF0dXNJc1B1YmxpYykudGhlbihmdW5jdGlvbiAoc3RvcnlCYWNrZW5kT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRTdG9yeVB1YmxpY2F0aW9uU3RhdHVzKG5ld1N0b3J5U3RhdHVzSXNQdWJsaWMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoZXJyb3IgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICdUaGVyZSB3YXMgYW4gZXJyb3Igd2hlbiBwdWJsaXNoaW5nL3VucHVibGlzaGluZyB0aGUgc3RvcnkuJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzZXJ2aWNlIGlzIGN1cnJlbnRseSBhdHRlbXB0aW5nIHRvIHNhdmUgdGhlXG4gICAgICAgICAgICAgKiBzdG9yeSBtYWludGFpbmVkIGJ5IHRoaXMgc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNTYXZpbmdTdG9yeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RvcnlJc0JlaW5nU2F2ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFByaW1hcnkgY29udHJvbGxlciBmb3IgdGhlIHN0b3J5IGVkaXRvciBwYWdlLlxuICovXG4vLyBUT0RPKCM3MDkyKTogRGVsZXRlIHRoaXMgZmlsZSBvbmNlIG1pZ3JhdGlvbiBpcyBjb21wbGV0ZSBhbmQgdGhlc2UgQW5ndWxhckpTXG4vLyBlcXVpdmFsZW50cyBvZiB0aGUgQW5ndWxhciBjb25zdGFudHMgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG52YXIgc3RvcnlfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuY29uc3RhbnRzXCIpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ05PREVfSURfUFJFRklYJywgc3RvcnlfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEuU3RvcnlFZGl0b3JQYWdlQ29uc3RhbnRzLk5PREVfSURfUFJFRklYKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCcsIHN0b3J5X2VkaXRvcl9wYWdlX2NvbnN0YW50c18xLlN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cy5FVkVOVF9TVE9SWV9JTklUSUFMSVpFRCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCcsIHN0b3J5X2VkaXRvcl9wYWdlX2NvbnN0YW50c18xLlN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cy5FVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVEKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9WSUVXX1NUT1JZX05PREVfRURJVE9SJywgc3RvcnlfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEuU3RvcnlFZGl0b3JQYWdlQ29uc3RhbnRzLkVWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1IpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBQcmltYXJ5IGNvbnRyb2xsZXIgZm9yIHRoZSBzdG9yeSBlZGl0b3IgcGFnZS5cbiAqL1xudmFyIFN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdG9yeUVkaXRvclBhZ2VDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIFN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cy5OT0RFX0lEX1BSRUZJWCA9ICdub2RlXyc7XG4gICAgU3RvcnlFZGl0b3JQYWdlQ29uc3RhbnRzLkVWRU5UX1NUT1JZX0lOSVRJQUxJWkVEID0gJ3N0b3J5SW5pdGlhbGl6ZWQnO1xuICAgIFN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cy5FVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVEID0gJ3N0b3J5UmVpbml0aWFsaXplZCc7XG4gICAgU3RvcnlFZGl0b3JQYWdlQ29uc3RhbnRzLkVWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1IgPSAndmlld1N0b3J5Tm9kZUVkaXRvcic7XG4gICAgcmV0dXJuIFN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLlN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cyA9IFN0b3J5RWRpdG9yUGFnZUNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgUHJpbWFyeSBjb250cm9sbGVyIGZvciB0aGUgc3RvcnkgZWRpdG9yIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ29iamVjdHMvb2JqZWN0Q29tcG9uZW50c1JlcXVpcmVzLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9pbnRlcmFjdGlvbi1zcGVjcy5jb25zdGFudHMuYWpzLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkaXJlY3RpdmVzL2FuZ3VsYXItaHRtbC1iaW5kLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbmF2YmFyL3N0b3J5LWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL25hdmJhci9zdG9yeS1lZGl0b3ItbmF2YmFyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvZWRpdG9yLXRhYi9zdG9yeS1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9VbmRvUmVkb1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3NlcnZpY2VzL3N0b3J5LWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9QYWdlVGl0bGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc3RvcnlFZGl0b3JQYWdlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbCcsICckd2luZG93JywgJ1BhZ2VUaXRsZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTdG9yeUVkaXRvclN0YXRlU2VydmljZScsICdVbmRvUmVkb1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfU1RPUllfSU5JVElBTElaRUQnLCAnRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsLCAkd2luZG93LCBQYWdlVGl0bGVTZXJ2aWNlLCBTdG9yeUVkaXRvclN0YXRlU2VydmljZSwgVW5kb1JlZG9TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVXJsU2VydmljZSwgRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgVE9QSUNfRURJVE9SX1VSTF9URU1QTEFURSA9ICcvdG9waWNfZWRpdG9yLzx0b3BpY0lkPic7XG4gICAgICAgICAgICAgICAgICAgIFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLmxvYWRTdG9yeShVcmxTZXJ2aWNlLmdldFN0b3J5SWRGcm9tVXJsKCkpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnJldHVyblRvVG9waWNFZGl0b3JQYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFVuZG9SZWRvU2VydmljZS5nZXRDaGFuZ2VDb3VudCgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9tb2RhbC10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc2F2ZS1wZW5kaW5nLWNoYW5nZXMtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cub3BlbihVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChUT1BJQ19FRElUT1JfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcGljSWQ6IFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0U3RvcnkoKS5nZXRDb3JyZXNwb25kaW5nVG9waWNJZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksICdfc2VsZicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2V0UGFnZVRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgUGFnZVRpdGxlU2VydmljZS5zZXRQYWdlVGl0bGUoU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0U3RvcnkoKS5nZXRUaXRsZSgpICsgJyAtIE9wcGlhJyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIHNldFBhZ2VUaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCwgc2V0UGFnZVRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHN0b3J5IGVkaXRvciBwYWdlLlxuICovXG5yZXF1aXJlKFwiY29yZS1qcy9lczcvcmVmbGVjdFwiKTtcbnJlcXVpcmUoXCJ6b25lLmpzXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGh0dHBfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb21tb24vaHR0cFwiKTtcbi8vIFRoaXMgY29tcG9uZW50IGlzIG5lZWRlZCB0byBmb3JjZS1ib290c3RyYXAgQW5ndWxhciBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuLy8gYXBwLlxudmFyIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCgpIHtcbiAgICB9XG4gICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuQ29tcG9uZW50KHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnc2VydmljZS1ib290c3RyYXAnLFxuICAgICAgICAgICAgdGVtcGxhdGU6ICcnXG4gICAgICAgIH0pXG4gICAgXSwgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCk7XG4gICAgcmV0dXJuIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQ7XG59KCkpO1xuZXhwb3J0cy5TZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbnZhciBhcHBfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiYXBwLmNvbnN0YW50c1wiKTtcbnZhciBlZGl0b3JfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9lZGl0b3IvZWRpdG9yLWRvbWFpbi5jb25zdGFudHNcIik7XG52YXIgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJpbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb25zLWV4dGVuc2lvbi5jb25zdGFudHNcIik7XG52YXIgb2JqZWN0c19kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL29iamVjdHMvb2JqZWN0cy1kb21haW4uY29uc3RhbnRzXCIpO1xudmFyIHNlcnZpY2VzX2NvbnN0YW50c18xID0gcmVxdWlyZShcInNlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50c1wiKTtcbnZhciBza2lsbF9kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL3NraWxsL3NraWxsLWRvbWFpbi5jb25zdGFudHNcIik7XG52YXIgc3RvcnlfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9zdG9yeS9zdG9yeS1kb21haW4uY29uc3RhbnRzXCIpO1xudmFyIHN0b3J5X2VkaXRvcl9wYWdlX2NvbnN0YW50c18xID0gcmVxdWlyZShcInBhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnN0YW50c1wiKTtcbnZhciBTdG9yeUVkaXRvclBhZ2VNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RvcnlFZGl0b3JQYWdlTW9kdWxlKCkge1xuICAgIH1cbiAgICAvLyBFbXB0eSBwbGFjZWhvbGRlciBtZXRob2QgdG8gc2F0aXNmeSB0aGUgYENvbXBpbGVyYC5cbiAgICBTdG9yeUVkaXRvclBhZ2VNb2R1bGUucHJvdG90eXBlLm5nRG9Cb290c3RyYXAgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgU3RvcnlFZGl0b3JQYWdlTW9kdWxlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5OZ01vZHVsZSh7XG4gICAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAgICAgcGxhdGZvcm1fYnJvd3Nlcl8xLkJyb3dzZXJNb2R1bGUsXG4gICAgICAgICAgICAgICAgaHR0cF8xLkh0dHBDbGllbnRNb2R1bGVcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZW50cnlDb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgICAgICAgIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMS5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIGVkaXRvcl9kb21haW5fY29uc3RhbnRzXzEuRWRpdG9yRG9tYWluQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xLk9iamVjdHNEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICAgICAgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIHN0b3J5X2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeURvbWFpbkNvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBzdG9yeV9lZGl0b3JfcGFnZV9jb25zdGFudHNfMS5TdG9yeUVkaXRvclBhZ2VDb25zdGFudHNcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICBdLCBTdG9yeUVkaXRvclBhZ2VNb2R1bGUpO1xuICAgIHJldHVybiBTdG9yeUVkaXRvclBhZ2VNb2R1bGU7XG59KCkpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pY1wiKTtcbnZhciBzdGF0aWNfMiA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBib290c3RyYXBGbiA9IGZ1bmN0aW9uIChleHRyYVByb3ZpZGVycykge1xuICAgIHZhciBwbGF0Zm9ybVJlZiA9IHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xLnBsYXRmb3JtQnJvd3NlckR5bmFtaWMoZXh0cmFQcm92aWRlcnMpO1xuICAgIHJldHVybiBwbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGUoU3RvcnlFZGl0b3JQYWdlTW9kdWxlKTtcbn07XG52YXIgZG93bmdyYWRlZE1vZHVsZSA9IHN0YXRpY18yLmRvd25ncmFkZU1vZHVsZShib290c3RyYXBGbik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnLCBbXG4gICAgJ2RuZExpc3RzJywgJ2hlYWRyb29tJywgJ2luZmluaXRlLXNjcm9sbCcsICduZ0FuaW1hdGUnLFxuICAgICduZ0F1ZGlvJywgJ25nQ29va2llcycsICduZ0ltZ0Nyb3AnLCAnbmdKb3lSaWRlJywgJ25nTWF0ZXJpYWwnLFxuICAgICduZ1Jlc291cmNlJywgJ25nU2FuaXRpemUnLCAnbmdUb3VjaCcsICdwYXNjYWxwcmVjaHQudHJhbnNsYXRlJyxcbiAgICAndG9hc3RyJywgJ3VpLmJvb3RzdHJhcCcsICd1aS5jb2RlbWlycm9yJywgJ3VpLnNvcnRhYmxlJywgJ3VpLnRyZWUnLFxuICAgICd1aS52YWxpZGF0ZScsIGRvd25ncmFkZWRNb2R1bGVcbl0pXG4gICAgLy8gVGhpcyBkaXJlY3RpdmUgaXMgdGhlIGRvd25ncmFkZWQgdmVyc2lvbiBvZiB0aGUgQW5ndWxhciBjb21wb25lbnQgdG9cbiAgICAvLyBib290c3RyYXAgdGhlIEFuZ3VsYXIgOC5cbiAgICAuZGlyZWN0aXZlKCdzZXJ2aWNlQm9vdHN0cmFwJywgc3RhdGljXzEuZG93bmdyYWRlQ29tcG9uZW50KHtcbiAgICBjb21wb25lbnQ6IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbn0pKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIHNjcmlwdHMgZm9yIHRoZSBzdG9yeSBlZGl0b3IgcGFnZS5cbiAqL1xuLy8gVGhlIG1vZHVsZSBuZWVkcyB0byBiZSBsb2FkZWQgYmVmb3JlIGV2ZXJ5dGhpbmcgZWxzZSBzaW5jZSBpdCBkZWZpbmVzIHRoZVxuLy8gbWFpbiBtb2R1bGUgdGhlIGVsZW1lbnRzIGFyZSBhdHRhY2hlZCB0by5cbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgnQXBwLnRzJyk7XG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvQmFzZUNvbnRlbnREaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL25hdmJhci9zdG9yeS1lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9uYXZiYXIvc3RvcnktZWRpdG9yLW5hdmJhci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnRyb2xsZXIudHMnKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gc2V0IHRoZSB0aXRsZSBvZiB0aGUgcGFnZS5cbiAqL1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCIpO1xudmFyIFBhZ2VUaXRsZVNlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGFnZVRpdGxlU2VydmljZSh0aXRsZVNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy50aXRsZVNlcnZpY2UgPSB0aXRsZVNlcnZpY2U7XG4gICAgfVxuICAgIFBhZ2VUaXRsZVNlcnZpY2UucHJvdG90eXBlLnNldFBhZ2VUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICB0aGlzLnRpdGxlU2VydmljZS5zZXRUaXRsZSh0aXRsZSk7XG4gICAgfTtcbiAgICB2YXIgX2E7XG4gICAgUGFnZVRpdGxlU2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSksXG4gICAgICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbdHlwZW9mIChfYSA9IHR5cGVvZiBwbGF0Zm9ybV9icm93c2VyXzEuVGl0bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgcGxhdGZvcm1fYnJvd3Nlcl8xLlRpdGxlKSA9PT0gXCJmdW5jdGlvblwiID8gX2EgOiBPYmplY3RdKVxuICAgIF0sIFBhZ2VUaXRsZVNlcnZpY2UpO1xuICAgIHJldHVybiBQYWdlVGl0bGVTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuUGFnZVRpdGxlU2VydmljZSA9IFBhZ2VUaXRsZVNlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdQYWdlVGl0bGVTZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShQYWdlVGl0bGVTZXJ2aWNlKSk7XG4iXSwic291cmNlUm9vdCI6IiJ9