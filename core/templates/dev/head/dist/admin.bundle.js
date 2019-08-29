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
/******/ 		"admin": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/admin-page/admin-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","vendors~admin~collection_editor~collection_player~creator_dashboard~exploration_editor~exploration_p~7f8bcc67","vendors~admin~collection_editor~creator_dashboard~exploration_editor~exploration_player~practice_ses~988cfeb1","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~b9580ed0","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~d3595155","admin~exploration_editor~exploration_player~moderator~practice_session~review_test~skill_editor~stor~7734cddb","admin~collection_editor"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/graph-services/graph-layout.service.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/components/graph-services/graph-layout.service.ts ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Directives for reusable data visualization components.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var StateGraphLayoutService = /** @class */ (function () {
    function StateGraphLayoutService() {
        this.MAX_INDENTATION_LEVEL = 2.5;
        // The last result of a call to computeLayout(). Used for determining the
        // order in which to specify states in rules.
        this.lastComputedArrangement = null;
    }
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'nodes' is a complex dict whose exact type needs to be
    // researched. Same goes for 'links' and the return type.
    StateGraphLayoutService.prototype.getGraphAsAdjacencyLists = function (nodes, links) {
        var adjacencyLists = {};
        for (var nodeId in nodes) {
            adjacencyLists[nodeId] = [];
        }
        for (var i = 0; i < links.length; i++) {
            if (links[i].source !== links[i].target &&
                adjacencyLists[links[i].source].indexOf(links[i].target) === -1) {
                adjacencyLists[links[i].source].push(links[i].target);
            }
        }
        return adjacencyLists;
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'adjacencyLists' is a complex dict whose exact type needs to
    // be researched. Same goes for 'trunkNodeIds' and the return type.
    StateGraphLayoutService.prototype.getIndentationLevels = function (adjacencyLists, trunkNodeIds) {
        var _this = this;
        var indentationLevels = [];
        // Recursively find and indent the longest shortcut for the segment of
        // nodes ranging from trunkNodeIds[startInd] to trunkNodeIds[endInd]
        // (inclusive). It's possible that this shortcut starts from a trunk
        // node within this interval (A, say) and ends at a trunk node after
        // this interval, in which case we indent all nodes from A + 1 onwards.
        // NOTE: this mutates indentationLevels as a side-effect.
        var indentLongestShortcut = function (startInd, endInd) {
            if (startInd >= endInd ||
                indentationLevels[startInd] >= _this.MAX_INDENTATION_LEVEL) {
                return;
            }
            var bestSourceInd = -1;
            var bestTargetInd = -1;
            for (var sourceInd = startInd; sourceInd < endInd; sourceInd++) {
                var sourceNodeId = trunkNodeIds[sourceInd];
                for (var i = 0; i < adjacencyLists[sourceNodeId].length; i++) {
                    var possibleTargetInd = trunkNodeIds.indexOf(adjacencyLists[sourceNodeId][i]);
                    if (possibleTargetInd !== -1 && sourceInd < possibleTargetInd) {
                        var targetInd = Math.min(possibleTargetInd, endInd + 1);
                        if (targetInd - sourceInd > bestTargetInd - bestSourceInd) {
                            bestSourceInd = sourceInd;
                            bestTargetInd = targetInd;
                        }
                    }
                }
            }
            if (bestTargetInd - bestSourceInd > 1) {
                // Indent nodes in [bestSourceInd + 1, bestTargetInd - 1].
                for (var i = bestSourceInd + 1; i < bestTargetInd; i++) {
                    indentationLevels[i] += 0.5;
                }
                // Recursively attempt to indent nodes before, within and after this
                // interval.
                indentLongestShortcut(startInd, bestSourceInd);
                indentLongestShortcut(bestSourceInd + 1, bestTargetInd - 1);
                indentLongestShortcut(bestTargetInd, endInd);
            }
        };
        for (var i = 0; i < trunkNodeIds.length; i++) {
            indentationLevels.push(0);
        }
        indentLongestShortcut(0, trunkNodeIds.length - 1);
        return indentationLevels;
    };
    // Returns an object representing the nodes of the graph. The keys of the
    // object are the node labels. The corresponding values are objects with
    // the following keys:
    //   - x0: the x-position of the top-left corner of the node, measured
    //       as a fraction of the total width.
    //   - y0: the y-position of the top-left corner of the node, measured
    //       as a fraction of the total height.
    //   - width: the width of the node, measured as a fraction of the total
    //       width.
    //   - height: the height of the node, measured as a fraction of the total
    //       height.
    //   - xLabel: the x-position of the middle of the box containing
    //       the node label, measured as a fraction of the total width.
    //       The node label is centered horizontally within this box.
    //   - yLabel: the y-position of the middle of the box containing
    //       the node label, measured as a fraction of the total height.
    //       The node label is centered vertically within this box.
    //   - reachable: whether there is a path from the start node to this
    //       node.
    //   - reachableFromEnd: whether there is a path from this node to the
    //       END node.
    //   - id: a unique id for the node.
    //   - label: the full label of the node.
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'nodes' is a complex dict whose exact type needs to
    // be researched. Same goes for the other parameters and the return type.
    StateGraphLayoutService.prototype.computeLayout = function (nodes, links, initNodeId, finalNodeIds) {
        var adjacencyLists = this.getGraphAsAdjacencyLists(nodes, links);
        // Find a long path through the graph from the initial state to a
        // terminal state via simple backtracking. Limit the algorithm to a
        // constant number of calls in order to ensure that the calculation
        // does not take too long.
        var MAX_BACKTRACKING_CALLS = 1000;
        var numBacktrackingCalls = 0;
        var bestPath = [initNodeId];
        // Note that this is a 'global variable' for the purposes of the
        // backtracking computation.
        var currentPath = [];
        var backtrack = function (currentNodeId) {
            currentPath.push(currentNodeId);
            // If the current node leads to no other nodes, we consider it a
            // 'terminal state'.
            if (adjacencyLists[currentNodeId].length === 0) {
                if (currentPath.length > bestPath.length) {
                    bestPath = cloneDeep_1.default(currentPath);
                }
            }
            else {
                numBacktrackingCalls++;
                if (numBacktrackingCalls <= MAX_BACKTRACKING_CALLS) {
                    for (var i = 0; i < adjacencyLists[currentNodeId].length; i++) {
                        if (currentPath.indexOf(adjacencyLists[currentNodeId][i]) === -1) {
                            backtrack(adjacencyLists[currentNodeId][i]);
                        }
                    }
                }
            }
            currentPath.pop();
        };
        backtrack(initNodeId);
        // In this implementation, nodes are aligned with a rectangular grid.
        // We calculate two additional internal variables for each node in
        // nodeData:
        //   - depth: its depth in the graph.
        //   - offset: its horizontal offset in the graph.
        // The depth and offset are measured in terms of grid squares.
        //
        // We first take the longest path through the graph (the 'trunk') and
        // find the longest possible shortcuts within that path, then indent
        // the nodes within those shortcuts and assign depths/offsets to them.
        // The indentation is done by only half a node width, so that the nodes
        // still feel 'close' together.
        //
        // After that, we traverse all remaining nodes via BFS and arrange them
        // such that nodes that are immediate descendants of nodes in the trunk
        // fall in the level just below their parent, and their children fall in
        // the next level, etc. All these nodes are placed to the right of the
        // trunk.
        //
        // NOTE: This algorithm does not work so well in clarifying articulation
        // points and 'subclusters' within a graph. For an illustration of this,
        // see the 'Parameterized Adventure' demo exploration.
        var SENTINEL_DEPTH = -1;
        var SENTINEL_OFFSET = -1;
        var nodeData = {};
        for (var nodeId in nodes) {
            nodeData[nodeId] = {
                depth: SENTINEL_DEPTH,
                offset: SENTINEL_OFFSET,
                reachable: false
            };
        }
        var maxDepth = 0;
        var maxOffsetInEachLevel = {
            0: 0
        };
        var trunkNodesIndentationLevels = this.getIndentationLevels(adjacencyLists, bestPath);
        for (var i = 0; i < bestPath.length; i++) {
            nodeData[bestPath[i]].depth = maxDepth;
            nodeData[bestPath[i]].offset = trunkNodesIndentationLevels[i];
            nodeData[bestPath[i]].reachable = true;
            maxOffsetInEachLevel[maxDepth] = trunkNodesIndentationLevels[i];
            maxDepth++;
        }
        // Do a breadth-first search to calculate the depths and offsets for
        // other nodes.
        var seenNodes = [initNodeId];
        var queue = [initNodeId];
        while (queue.length > 0) {
            var currNodeId = queue[0];
            queue.shift();
            nodeData[currNodeId].reachable = true;
            for (var i = 0; i < adjacencyLists[currNodeId].length; i++) {
                var linkTarget = adjacencyLists[currNodeId][i];
                // If the target node is a trunk node, but isn't at the correct
                // depth to process now, we ignore it for now and stick it back in
                // the queue to be processed later.
                if (bestPath.indexOf(linkTarget) !== -1 &&
                    nodeData[linkTarget].depth !== nodeData[currNodeId].depth + 1) {
                    if (seenNodes.indexOf(linkTarget) === -1 &&
                        queue.indexOf(linkTarget) === -1) {
                        queue.push(linkTarget);
                    }
                    continue;
                }
                // Assign depths and offsets to nodes only if we're processing them
                // for the first time.
                if (seenNodes.indexOf(linkTarget) === -1) {
                    seenNodes.push(linkTarget);
                    if (nodeData[linkTarget].depth === SENTINEL_DEPTH) {
                        nodeData[linkTarget].depth = nodeData[currNodeId].depth + 1;
                        nodeData[linkTarget].offset = (nodeData[linkTarget].depth in maxOffsetInEachLevel ?
                            maxOffsetInEachLevel[nodeData[linkTarget].depth] + 1 : 0);
                        maxDepth = Math.max(maxDepth, nodeData[linkTarget].depth);
                        maxOffsetInEachLevel[nodeData[linkTarget].depth] = (nodeData[linkTarget].offset);
                    }
                    if (queue.indexOf(linkTarget) === -1) {
                        queue.push(linkTarget);
                    }
                }
            }
        }
        // Handle nodes that were not visited in the forward traversal.
        maxOffsetInEachLevel[maxDepth + 1] = 0;
        maxDepth += 1;
        var orphanedNodesExist = false;
        for (var nodeId in nodeData) {
            if (nodeData[nodeId].depth === SENTINEL_DEPTH) {
                orphanedNodesExist = true;
                nodeData[nodeId].depth = maxDepth;
                nodeData[nodeId].offset = maxOffsetInEachLevel[maxDepth];
                maxOffsetInEachLevel[maxDepth] += 1;
            }
        }
        if (orphanedNodesExist) {
            maxDepth++;
        }
        // Build the 'inverse index' -- for each row, store the (offset, nodeId)
        // pairs in ascending order of offset.
        var nodePositionsToIds = [];
        for (var i = 0; i <= maxDepth; i++) {
            nodePositionsToIds.push([]);
        }
        for (var nodeId in nodeData) {
            if (nodeData[nodeId].depth !== SENTINEL_DEPTH) {
                nodePositionsToIds[nodeData[nodeId].depth].push({
                    nodeId: nodeId,
                    offset: nodeData[nodeId].offset
                });
            }
        }
        for (var i = 0; i <= maxDepth; i++) {
            // TODO(#7165): Replace 'any' with the exact type. This has been kept as
            // 'any' because more information about the 'a' and 'b' needs to be found.
            nodePositionsToIds[i].sort(function (a, b) {
                return a.offset - b.offset;
            });
        }
        // Recalculate the node depths and offsets, taking into account
        // MAX_NODES_PER_ROW. If there are too many nodes in a row, we overflow
        // them into the next one.
        var currentDepth = 0;
        var currentLeftMargin = 0;
        var currentLeftOffset = 0;
        for (var i = 0; i <= maxDepth; i++) {
            if (nodePositionsToIds[i].length > 0) {
                // The offset of the leftmost node at this depth. If there are too
                // many nodes in this depth, this variable is used to figure out
                // which offset to start the continuation rows from.
                currentLeftMargin = nodePositionsToIds[i][0].offset;
                // The offset of the current node under consideration.
                currentLeftOffset = currentLeftMargin;
                for (var j = 0; j < nodePositionsToIds[i].length; j++) {
                    var computedOffset = currentLeftOffset;
                    if (computedOffset >= app_constants_1.AppConstants.MAX_NODES_PER_ROW) {
                        currentDepth++;
                        computedOffset = currentLeftMargin + 1;
                        currentLeftOffset = computedOffset;
                    }
                    nodeData[nodePositionsToIds[i][j].nodeId].depth = currentDepth;
                    nodeData[nodePositionsToIds[i][j].nodeId].offset = (currentLeftOffset);
                    currentLeftOffset += 1;
                }
                currentDepth++;
            }
        }
        // Calculate the width and height of each grid rectangle.
        var totalRows = currentDepth;
        // Set totalColumns to be MAX_NODES_PER_ROW, so that the width of the
        // graph visualization can be calculated based on a fixed constant,
        // MAX_NODES_PER_ROW. Otherwise, the width of the individual nodes is
        // dependent on the number of nodes in the longest row, and this makes
        // the nodes too wide if, e.g., the overall graph is just a single
        // column wide.
        var totalColumns = app_constants_1.AppConstants.MAX_NODES_PER_ROW;
        // Horizontal padding between the graph and the edge of the graph
        // visualization, measured as a fraction of the entire height.
        var HORIZONTAL_EDGE_PADDING_FRACTION = 0.05;
        // Vertical edge padding between the graph and the edge of the graph
        // visualization, measured as a fraction of the entire height.
        var VERTICAL_EDGE_PADDING_FRACTION = 0.1;
        // The vertical padding, measured as a fraction of the height of a grid
        // rectangle, between the top of the grid rectangle and the top of the
        // node. An equivalent amount of padding will be used for the space
        // between the bottom of the grid rectangle and the bottom of the node.
        var GRID_NODE_Y_PADDING_FRACTION = 0.2;
        // As above, but for the horizontal padding.
        var GRID_NODE_X_PADDING_FRACTION = 0.1;
        // The vertical padding, measured as a fraction of the height of a grid
        // rectangle, between the top of the node and the top of the node label.
        // An equivalent amount of padding will be used for the space between
        // the bottom of the node and the bottom of the node label.
        var NODE_LABEL_Y_PADDING_FRACTION = 0.15;
        // As above, but for the horizontal padding.
        var NODE_LABEL_X_PADDING_FRACTION = 0.05;
        // Helper function that returns a horizontal position, in terms of a
        // fraction of the total width, given a horizontal offset in terms of
        // grid rectangles.
        var getHorizontalPosition = function (offsetInGridRectangles) {
            var fractionalGridWidth = ((1.0 - HORIZONTAL_EDGE_PADDING_FRACTION * 2) / totalColumns);
            return (HORIZONTAL_EDGE_PADDING_FRACTION +
                fractionalGridWidth * offsetInGridRectangles);
        };
        // Helper function that returns a vertical position, in terms of a
        // fraction of the total height, given a vertical offset in terms of
        // grid rectangles.
        var getVerticalPosition = function (offsetInGridRectangles) {
            var fractionalGridHeight = ((1.0 - VERTICAL_EDGE_PADDING_FRACTION * 2) / totalRows);
            return (VERTICAL_EDGE_PADDING_FRACTION +
                fractionalGridHeight * offsetInGridRectangles);
        };
        for (var nodeId in nodeData) {
            nodeData[nodeId].y0 = getVerticalPosition(nodeData[nodeId].depth + GRID_NODE_Y_PADDING_FRACTION);
            nodeData[nodeId].x0 = getHorizontalPosition(nodeData[nodeId].offset + GRID_NODE_X_PADDING_FRACTION);
            nodeData[nodeId].yLabel = getVerticalPosition(nodeData[nodeId].depth + 0.5);
            nodeData[nodeId].xLabel = getHorizontalPosition(nodeData[nodeId].offset + 0.5);
            nodeData[nodeId].height = ((1.0 - VERTICAL_EDGE_PADDING_FRACTION * 2) / totalRows) * (1.0 - GRID_NODE_Y_PADDING_FRACTION * 2);
            nodeData[nodeId].width = ((1.0 - HORIZONTAL_EDGE_PADDING_FRACTION * 2) / totalColumns) * (1.0 - GRID_NODE_X_PADDING_FRACTION * 2);
        }
        // Assign id and label to each node.
        for (var nodeId in nodeData) {
            nodeData[nodeId].id = nodeId;
            nodeData[nodeId].label = nodes[nodeId];
        }
        // Mark nodes that are reachable from any end state via backward links.
        queue = finalNodeIds;
        for (var i = 0; i < finalNodeIds.length; i++) {
            nodeData[finalNodeIds[i]].reachableFromEnd = true;
        }
        while (queue.length > 0) {
            var currNodeId = queue[0];
            queue.shift();
            for (var i = 0; i < links.length; i++) {
                if (links[i].target === currNodeId &&
                    !nodeData[links[i].source].reachableFromEnd) {
                    nodeData[links[i].source].reachableFromEnd = true;
                    queue.push(links[i].source);
                }
            }
        }
        this.lastComputedArrangement = cloneDeep_1.default(nodeData);
        return nodeData;
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a complex dict whose exact type needs to
    // be researched.
    StateGraphLayoutService.prototype.getLastComputedArrangement = function () {
        return cloneDeep_1.default(this.lastComputedArrangement);
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'nodeData' is a complex dict whose exact type needs to
    // be researched.
    StateGraphLayoutService.prototype.getGraphBoundaries = function (nodeData) {
        var INFINITY = 1e30;
        var BORDER_PADDING = 5;
        var leftEdge = INFINITY;
        var topEdge = INFINITY;
        var bottomEdge = -INFINITY;
        var rightEdge = -INFINITY;
        for (var nodeId in nodeData) {
            leftEdge = Math.min(nodeData[nodeId].x0 - BORDER_PADDING, leftEdge);
            topEdge = Math.min(nodeData[nodeId].y0 - BORDER_PADDING, topEdge);
            rightEdge = Math.max(nodeData[nodeId].x0 + BORDER_PADDING + nodeData[nodeId].width, rightEdge);
            bottomEdge = Math.max(nodeData[nodeId].y0 + BORDER_PADDING + nodeData[nodeId].height, bottomEdge);
        }
        return {
            bottom: bottomEdge,
            left: leftEdge,
            right: rightEdge,
            top: topEdge
        };
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'nodeData' is a complex dict whose exact type needs to
    // be researched. Same goes for 'nodeLinks' and the return type.
    StateGraphLayoutService.prototype.getAugmentedLinks = function (nodeData, nodeLinks) {
        var links = cloneDeep_1.default(nodeLinks);
        var augmentedLinks = links.map(function (link) {
            return {
                source: cloneDeep_1.default(nodeData[link.source]),
                target: cloneDeep_1.default(nodeData[link.target])
            };
        });
        for (var i = 0; i < augmentedLinks.length; i++) {
            var link = augmentedLinks[i];
            if (link.source.label !== link.target.label) {
                var sourcex = link.source.xLabel;
                var sourcey = link.source.yLabel;
                var targetx = link.target.xLabel;
                var targety = link.target.yLabel;
                if (sourcex === targetx && sourcey === targety) {
                    // TODO(sll): Investigate why this happens.
                    return;
                }
                var sourceWidth = link.source.width;
                var sourceHeight = link.source.height;
                var targetWidth = link.target.width;
                var targetHeight = link.target.height;
                var dx = targetx - sourcex;
                var dy = targety - sourcey;
                /* Fractional amount of truncation to be applied to the end of
                   each link. */
                var startCutoff = (sourceWidth / 2) / Math.abs(dx);
                var endCutoff = (targetWidth / 2) / Math.abs(dx);
                if (dx === 0 || dy !== 0) {
                    startCutoff = ((dx === 0) ? (sourceHeight / 2) / Math.abs(dy) :
                        Math.min(startCutoff, (sourceHeight / 2) / Math.abs(dy)));
                    endCutoff = ((dx === 0) ? (targetHeight / 2) / Math.abs(dy) :
                        Math.min(endCutoff, (targetHeight / 2) / Math.abs(dy)));
                }
                var dxperp = targety - sourcey;
                var dyperp = sourcex - targetx;
                var norm = Math.sqrt(dxperp * dxperp + dyperp * dyperp);
                dxperp /= norm;
                dyperp /= norm;
                var midx = sourcex + dx / 2 + dxperp * (sourceHeight / 4);
                var midy = sourcey + dy / 2 + dyperp * (targetHeight / 4);
                var startx = sourcex + startCutoff * dx;
                var starty = sourcey + startCutoff * dy;
                var endx = targetx - endCutoff * dx;
                var endy = targety - endCutoff * dy;
                // Draw a quadratic bezier curve.
                augmentedLinks[i].d = ('M' + startx + ' ' + starty + ' Q ' + midx + ' ' + midy +
                    ' ' + endx + ' ' + endy);
            }
        }
        return augmentedLinks;
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'nodeData' is a complex dict whose exact type needs to
    // be researched. Same goes for the return type.
    StateGraphLayoutService.prototype.modifyPositionValues = function (nodeData, graphWidth, graphHeight) {
        var HORIZONTAL_NODE_PROPERTIES = ['x0', 'width', 'xLabel'];
        var VERTICAL_NODE_PROPERTIES = ['y0', 'height', 'yLabel'];
        // Change the position values in nodeData to use pixels.
        for (var nodeId in nodeData) {
            for (var i = 0; i < HORIZONTAL_NODE_PROPERTIES.length; i++) {
                nodeData[nodeId][HORIZONTAL_NODE_PROPERTIES[i]] = (graphWidth *
                    nodeData[nodeId][HORIZONTAL_NODE_PROPERTIES[i]]);
                nodeData[nodeId][VERTICAL_NODE_PROPERTIES[i]] = (graphHeight *
                    nodeData[nodeId][VERTICAL_NODE_PROPERTIES[i]]);
            }
        }
        return nodeData;
    };
    StateGraphLayoutService.prototype.getGraphWidth = function (maxNodesPerRow, maxNodeLabelLength) {
        // A rough upper bound for the width of a single letter, in pixels,
        // to use as a scaling factor to determine the width of graph nodes.
        // This is not an entirely accurate description because it also takes
        // into account the horizontal whitespace between graph nodes.
        var letterWidthInPixels = 10.5;
        return maxNodesPerRow * maxNodeLabelLength * letterWidthInPixels;
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'nodeData' is a complex dict whose exact type needs to
    // be researched.
    StateGraphLayoutService.prototype.getGraphHeight = function (nodeData) {
        var maxDepth = 0;
        for (var nodeId in nodeData) {
            maxDepth = Math.max(maxDepth, nodeData[nodeId].depth);
        }
        return 70.0 * (maxDepth + 1);
    };
    StateGraphLayoutService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], StateGraphLayoutService);
    return StateGraphLayoutService;
}());
exports.StateGraphLayoutService = StateGraphLayoutService;
// Service for computing layout of state graph nodes.
angular.module('oppia').factory('StateGraphLayoutService', static_1.downgradeInjectable(StateGraphLayoutService));


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts ***!
  \************************************************************************************************/
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
/**
 * @fileoverview ConvertToPlainText filter for Oppia.
 */
angular.module('oppia').filter('convertToPlainText', [function () {
        return function (input) {
            var strippedText = input.replace(/(<([^>]+)>)/ig, '');
            strippedText = strippedText.replace(/&nbsp;/ig, ' ');
            strippedText = strippedText.replace(/&quot;/ig, '');
            var trimmedText = strippedText.trim();
            if (trimmedText.length === 0) {
                return strippedText;
            }
            else {
                return trimmedText;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts ***!
  \***********************************************************************************/
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
 * @fileoverview Truncate filter for Oppia.
 */
__webpack_require__(/*! filters/string-utility-filters/convert-to-plain-text.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts");
// Filter that truncates long descriptors.
angular.module('oppia').filter('truncate', ['$filter', function ($filter) {
        return function (input, length, suffix) {
            if (!input) {
                return '';
            }
            if (isNaN(length)) {
                length = 70;
            }
            if (suffix === undefined) {
                suffix = '...';
            }
            if (!angular.isString(input)) {
                input = String(input);
            }
            input = $filter('convertToPlainText')(input);
            return (input.length <= length ? input : (input.substring(0, length - suffix.length) + suffix));
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab.directive.ts ***!
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
 * @fileoverview Directive for the activities tab in the admin panel when Oppia
 * is in developer mode.
 */
__webpack_require__(/*! domain/objects/NumberWithUnitsObjectFactory.ts */ "./core/templates/dev/head/domain/objects/NumberWithUnitsObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/services/admin-data.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-data.service.ts");
__webpack_require__(/*! pages/admin-page/services/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-task-manager.service.ts");
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').directive('adminDevModeActivitiesTab', [
    '$http', '$window', 'AdminDataService', 'AdminTaskManagerService',
    'UrlInterpolationService', 'ADMIN_HANDLER_URL',
    function ($http, $window, AdminDataService, AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/activities-tab/' +
                'admin-dev-mode-activities-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.reloadExploration = function (explorationId) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!$window.confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        ctrl.setStatusMessage('Processing...');
                        AdminTaskManagerService.startTask();
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'reload_exploration',
                            exploration_id: String(explorationId)
                        }).then(function () {
                            ctrl.setStatusMessage('Data reloaded successfully.');
                            AdminTaskManagerService.finishTask();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                            AdminTaskManagerService.finishTask();
                        });
                    };
                    ctrl.numDummyExpsToPublish = 0;
                    ctrl.numDummyExpsToGenerate = 0;
                    ctrl.DEMO_COLLECTIONS = {};
                    ctrl.DEMO_EXPLORATIONS = {};
                    ctrl.reloadingAllExplorationPossible = false;
                    var demoExplorationIds = [];
                    ctrl.reloadAllExplorations = function () {
                        if (!ctrl.reloadingAllExplorationPossible) {
                            return;
                        }
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!$window.confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        ctrl.setStatusMessage('Processing...');
                        AdminTaskManagerService.startTask();
                        var numSucceeded = 0;
                        var numFailed = 0;
                        var numTried = 0;
                        var printResult = function () {
                            if (numTried < demoExplorationIds.length) {
                                ctrl.setStatusMessage('Processing...' + numTried + '/' +
                                    demoExplorationIds.length);
                                return;
                            }
                            ctrl.setStatusMessage('Reloaded ' + demoExplorationIds.length +
                                ' explorations: ' + numSucceeded + ' succeeded, ' + numFailed +
                                ' failed.');
                            AdminTaskManagerService.finishTask();
                        };
                        for (var i = 0; i < demoExplorationIds.length; ++i) {
                            var explorationId = demoExplorationIds[i];
                            $http.post(ADMIN_HANDLER_URL, {
                                action: 'reload_exploration',
                                exploration_id: explorationId
                            }).then(function () {
                                ++numSucceeded;
                                ++numTried;
                                printResult();
                            }, function () {
                                ++numFailed;
                                ++numTried;
                                printResult();
                            });
                        }
                    };
                    AdminDataService.getDataAsync().then(function (response) {
                        ctrl.DEMO_EXPLORATIONS = response.demo_explorations;
                        ctrl.DEMO_COLLECTIONS = response.demo_collections;
                        demoExplorationIds = response.demo_exploration_ids;
                        ctrl.reloadingAllExplorationPossible = true;
                    });
                    ctrl.generateDummyExplorations = function () {
                        // Generate dummy explorations with random title.
                        if (ctrl.numDummyExpsToPublish > ctrl.numDummyExpsToGenerate) {
                            ctrl.setStatusMessage('Publish count should be less than or equal to generate count');
                            return;
                        }
                        AdminTaskManagerService.startTask();
                        ctrl.setStatusMessage('Processing...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'generate_dummy_explorations',
                            num_dummy_exps_to_generate: ctrl.numDummyExpsToGenerate,
                            num_dummy_exps_to_publish: ctrl.numDummyExpsToPublish
                        }).then(function () {
                            ctrl.setStatusMessage('Dummy explorations generated successfully.');
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                    ctrl.reloadCollection = function (collectionId) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!$window.confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        ctrl.setStatusMessage('Processing...');
                        AdminTaskManagerService.startTask();
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'reload_collection',
                            collection_id: String(collectionId)
                        }).then(function () {
                            ctrl.setStatusMessage('Data reloaded successfully.');
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab.directive.ts ***!
  \*************************************************************************************************************/
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
 * @fileoverview Directive for the activities tab in the admin panel when Oppia
 * is in production mode.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('adminProdModeActivitiesTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/activities-tab/' +
                'admin-prod-mode-activities-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts ***!
  \******************************************************************************/
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
 * @fileoverview Constants for the Oppia admin page.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var admin_page_constants_1 = __webpack_require__(/*! pages/admin-page/admin-page.constants */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ts");
angular.module('oppia').constant('ADMIN_ROLE_HANDLER_URL', admin_page_constants_1.AdminPageConstants.ADMIN_ROLE_HANDLER_URL);
angular.module('oppia').constant('ADMIN_HANDLER_URL', admin_page_constants_1.AdminPageConstants.ADMIN_HANDLER_URL);
angular.module('oppia').constant('ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', admin_page_constants_1.AdminPageConstants.ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL);
angular.module('oppia').constant('ADMIN_JOB_OUTPUT_URL_TEMPLATE', admin_page_constants_1.AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE);
angular.module('oppia').constant('ADMIN_TAB_URLS', admin_page_constants_1.AdminPageConstants.ADMIN_TAB_URLS);
angular.module('oppia').constant('PROFILE_URL_TEMPLATE', admin_page_constants_1.AdminPageConstants.PROFILE_URL_TEMPLATE);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page.constants.ts ***!
  \**************************************************************************/
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
 * @fileoverview Constants for the Oppia admin page.
 */
var AdminPageConstants = /** @class */ (function () {
    function AdminPageConstants() {
    }
    AdminPageConstants.ADMIN_ROLE_HANDLER_URL = '/adminrolehandler';
    AdminPageConstants.ADMIN_HANDLER_URL = '/adminhandler';
    AdminPageConstants.ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL = '/admintopicscsvdownloadhandler';
    AdminPageConstants.ADMIN_JOB_OUTPUT_URL_TEMPLATE = '/adminjoboutput?job_id=<jobId>';
    AdminPageConstants.ADMIN_TAB_URLS = {
        ACTIVITIES: '#activities',
        JOBS: '#jobs',
        CONFIG: '#config',
        ROLES: '#roles',
        MISC: '#misc'
    };
    AdminPageConstants.PROFILE_URL_TEMPLATE = '/profile/<username>';
    return AdminPageConstants;
}());
exports.AdminPageConstants = AdminPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page.directive.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page.directive.ts ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Data and directive for the Oppia admin page.
 */
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts");
__webpack_require__(/*! directives/focus-on.directive.ts */ "./core/templates/dev/head/directives/focus-on.directive.ts");
__webpack_require__(/*! pages/admin-page/navbar/admin-navbar.directive.ts */ "./core/templates/dev/head/pages/admin-page/navbar/admin-navbar.directive.ts");
__webpack_require__(/*! pages/admin-page/activities-tab/admin-dev-mode-activities-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/activities-tab/admin-prod-mode-activities-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/config-tab/admin-config-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/config-tab/admin-config-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/misc-tab/admin-misc-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/misc-tab/admin-misc-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/roles-tab/admin-roles-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/roles-tab/admin-roles-tab.directive.ts");
__webpack_require__(/*! value_generators/valueGeneratorsRequires.ts */ "./extensions/value_generators/valueGeneratorsRequires.ts");
__webpack_require__(/*! domain/objects/NumberWithUnitsObjectFactory.ts */ "./core/templates/dev/head/domain/objects/NumberWithUnitsObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/services/admin-data.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-data.service.ts");
__webpack_require__(/*! pages/admin-page/services/admin-router.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-router.service.ts");
__webpack_require__(/*! services/CsrfTokenService.ts */ "./core/templates/dev/head/services/CsrfTokenService.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
angular.module('oppia').directive('adminPage', ['UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/admin-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$http', '$location', '$scope', 'AdminDataService',
                'AdminRouterService', 'CsrfTokenService', 'DEV_MODE',
                function ($http, $location, $scope, AdminDataService, AdminRouterService, CsrfTokenService, DEV_MODE) {
                    var ctrl = this;
                    ctrl.userEmail = '';
                    AdminDataService.getDataAsync().then(function (response) {
                        ctrl.userEmail = response.user_email;
                    });
                    ctrl.inDevMode = DEV_MODE;
                    ctrl.statusMessage = '';
                    ctrl.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
                    ctrl.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
                    ctrl.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
                    ctrl.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
                    ctrl.isMiscTabOpen = AdminRouterService.isMiscTabOpen;
                    CsrfTokenService.initializeToken();
                    ctrl.setStatusMessage = function (statusMessage) {
                        ctrl.statusMessage = statusMessage;
                    };
                    $scope.$on('$locationChangeSuccess', function () {
                        AdminRouterService.showTab($location.path().replace('/', '#'));
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page.module.ts":
/*!***********************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page.module.ts ***!
  \***********************************************************************/
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
 * @fileoverview Module for the admin page.
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
var interactions_extension_constants_1 = __webpack_require__(/*! interactions/interactions-extension.constants */ "./extensions/interactions/interactions-extension.constants.ts");
var objects_domain_constants_1 = __webpack_require__(/*! domain/objects/objects-domain.constants */ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts");
var services_constants_1 = __webpack_require__(/*! services/services.constants */ "./core/templates/dev/head/services/services.constants.ts");
var admin_page_constants_1 = __webpack_require__(/*! pages/admin-page/admin-page.constants */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ts");
var AdminPageModule = /** @class */ (function () {
    function AdminPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    AdminPageModule.prototype.ngDoBootstrap = function () { };
    AdminPageModule = __decorate([
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
                objects_domain_constants_1.ObjectsDomainConstants,
                services_constants_1.ServicesConstants,
                admin_page_constants_1.AdminPageConstants
            ]
        })
    ], AdminPageModule);
    return AdminPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(AdminPageModule);
};
var downgradedModule = static_2.downgradeModule(bootstrapFn);
angular.module('oppia', [
    'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
    'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
    'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
    'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate',
    downgradedModule
])
    // This directive is the downgraded version of the Angular component to
    // bootstrap the Angular 8.
    .directive('serviceBootstrap', static_1.downgradeComponent({
    component: ServiceBootstrapComponent
}));


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page.scripts.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page.scripts.ts ***!
  \************************************************************************/
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
 * @fileoverview Directives required in admin panel.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/admin-page/admin-page.module.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! pages/admin-page/admin-page.directive.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.directive.ts");


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/config-tab/admin-config-tab.directive.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/config-tab/admin-config-tab.directive.ts ***!
  \*******************************************************************************************/
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
 * @fileoverview Directive for the configuration tab in the admin panel.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/services/admin-data.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-data.service.ts");
__webpack_require__(/*! pages/admin-page/services/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-task-manager.service.ts");
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').directive('adminConfigTab', [
    '$http', '$window', 'AdminDataService', 'AdminTaskManagerService',
    'UrlInterpolationService', 'ADMIN_HANDLER_URL',
    function ($http, $window, AdminDataService, AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/config-tab/admin-config-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.configProperties = {};
                    ctrl.isNonemptyObject = function (object) {
                        var hasAtLeastOneElement = false;
                        for (var property in object) {
                            hasAtLeastOneElement = true;
                        }
                        return hasAtLeastOneElement;
                    };
                    ctrl.reloadConfigProperties = function () {
                        AdminDataService.getDataAsync().then(function (response) {
                            ctrl.configProperties = response.config_properties;
                        });
                    };
                    ctrl.revertToDefaultConfigPropertyValue = function (configPropertyId) {
                        if (!$window.confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'revert_config_property',
                            config_property_id: configPropertyId
                        }).then(function () {
                            ctrl.setStatusMessage('Config property reverted successfully.');
                            ctrl.reloadConfigProperties();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    ctrl.saveConfigProperties = function () {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!$window.confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        ctrl.setStatusMessage('Saving...');
                        AdminTaskManagerService.startTask();
                        var newConfigPropertyValues = {};
                        for (var property in ctrl.configProperties) {
                            newConfigPropertyValues[property] = (ctrl.configProperties[property].value);
                        }
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'save_config_properties',
                            new_config_property_values: newConfigPropertyValues
                        }).then(function () {
                            ctrl.setStatusMessage('Data saved successfully.');
                            AdminTaskManagerService.finishTask();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                            AdminTaskManagerService.finishTask();
                        });
                    };
                    ctrl.reloadConfigProperties();
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Directive for the jobs tab in the admin panel.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/services/admin-data.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-data.service.ts");
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').directive('adminJobsTab', [
    '$http', '$timeout', 'AdminDataService', 'UrlInterpolationService',
    'ADMIN_HANDLER_URL', 'ADMIN_JOB_OUTPUT_URL_TEMPLATE',
    function ($http, $timeout, AdminDataService, UrlInterpolationService, ADMIN_HANDLER_URL, ADMIN_JOB_OUTPUT_URL_TEMPLATE) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/jobs-tab/admin-jobs-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.HUMAN_READABLE_CURRENT_TIME = '';
                    ctrl.CONTINUOUS_COMPUTATIONS_DATA = {};
                    ctrl.ONE_OFF_JOB_SPECS = {};
                    ctrl.UNFINISHED_JOB_DATA = {};
                    ctrl.AUDIT_JOB_SPECS = {};
                    ctrl.RECENT_JOB_DATA = {};
                    AdminDataService.getDataAsync().then(function (response) {
                        ctrl.HUMAN_READABLE_CURRENT_TIME = (response.human_readeable_current_time);
                        ctrl.CONTINUOUS_COMPUTATIONS_DATA = (response.continuous_computations_data);
                        ctrl.ONE_OFF_JOB_SPECS = response.one_off_job_specs;
                        ctrl.UNFINISHED_JOB_DATA = response.unfinished_job_data;
                        ctrl.AUDIT_JOB_SPECS = response.audit_job_specs;
                        ctrl.RECENT_JOB_DATA = response.recent_job_data;
                    });
                    ctrl.showingJobOutput = false;
                    ctrl.showJobOutput = function (jobId) {
                        var adminJobOutputUrl = UrlInterpolationService.interpolateUrl(ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
                            jobId: jobId
                        });
                        $http.get(adminJobOutputUrl).then(function (response) {
                            ctrl.showingJobOutput = true;
                            ctrl.jobOutput = response.data.output || [];
                            ctrl.jobOutput.sort();
                            $timeout(function () {
                                document.querySelector('#job-output').scrollIntoView();
                            });
                        });
                    };
                    ctrl.startNewJob = function (jobType) {
                        ctrl.setStatusMessage('Starting new job...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'start_new_job',
                            job_type: jobType
                        }).then(function () {
                            ctrl.setStatusMessage('Job started successfully.');
                            window.location.reload();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    ctrl.cancelJob = function (jobId, jobType) {
                        ctrl.setStatusMessage('Cancelling job...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'cancel_job',
                            job_id: jobId,
                            job_type: jobType
                        }).then(function () {
                            ctrl.setStatusMessage('Abort signal sent to job.');
                            window.location.reload();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    ctrl.startComputation = function (computationType) {
                        ctrl.setStatusMessage('Starting computation...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'start_computation',
                            computation_type: computationType
                        }).then(function () {
                            ctrl.setStatusMessage('Computation started successfully.');
                            window.location.reload();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    ctrl.stopComputation = function (computationType) {
                        ctrl.setStatusMessage('Stopping computation...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'stop_computation',
                            computation_type: computationType
                        }).then(function () {
                            ctrl.setStatusMessage('Abort signal sent to computation.');
                            window.location.reload();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/misc-tab/admin-misc-tab.directive.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/misc-tab/admin-misc-tab.directive.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Directive for the miscellaneous tab in the admin panel.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/services/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-task-manager.service.ts");
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').directive('adminMiscTab', [
    '$http', '$window', 'AdminTaskManagerService', 'UrlInterpolationService',
    'ADMIN_HANDLER_URL', 'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL',
    function ($http, $window, AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL, ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/misc-tab/admin-misc-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    var DATA_EXTRACTION_QUERY_HANDLER_URL = ('/explorationdataextractionhandler');
                    var irreversibleActionMessage = ('This action is irreversible. Are you sure?');
                    ctrl.clearSearchIndex = function () {
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
                        }).then(function () {
                            ctrl.setStatusMessage('Index successfully cleared.');
                            AdminTaskManagerService.finishTask();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                            AdminTaskManagerService.finishTask();
                        });
                    };
                    ctrl.flushMigrationBotContributions = function () {
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
                        }).then(function () {
                            ctrl.setStatusMessage('Migration bot contributions successfully flushed.');
                            AdminTaskManagerService.finishTask();
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                            AdminTaskManagerService.finishTask();
                        });
                    };
                    ctrl.uploadTopicSimilaritiesFile = function () {
                        var file = document.getElementById('topicSimilaritiesFile').files[0];
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var data = e.target.result;
                            $http.post(ADMIN_HANDLER_URL, {
                                action: 'upload_topic_similarities',
                                data: data
                            }).then(function () {
                                ctrl.setStatusMessage('Topic similarities uploaded successfully.');
                            }, function (errorResponse) {
                                ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                            });
                        };
                        reader.readAsText(file);
                    };
                    ctrl.downloadTopicSimilaritiesFile = function () {
                        $window.location.href = ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
                    };
                    var setDataExtractionQueryStatusMessage = function (message) {
                        ctrl.showDataExtractionQueryStatus = true;
                        ctrl.dataExtractionQueryStatusMessage = message;
                    };
                    ctrl.submitQuery = function () {
                        var STATUS_PENDING = ('Data extraction query has been submitted. Please wait.');
                        var STATUS_FINISHED = 'Loading the extracted data ...';
                        var STATUS_FAILED = 'Error, ';
                        setDataExtractionQueryStatusMessage(STATUS_PENDING);
                        var downloadUrl = DATA_EXTRACTION_QUERY_HANDLER_URL + '?';
                        downloadUrl += 'exp_id=' + encodeURIComponent(ctrl.expId);
                        downloadUrl += '&exp_version=' + encodeURIComponent(ctrl.expVersion);
                        downloadUrl += '&state_name=' + encodeURIComponent(ctrl.stateName);
                        downloadUrl += '&num_answers=' + encodeURIComponent(ctrl.numAnswers);
                        $window.open(downloadUrl);
                    };
                    ctrl.resetForm = function () {
                        ctrl.expId = '';
                        ctrl.expVersion = 0;
                        ctrl.stateName = '';
                        ctrl.numAnswers = 0;
                        ctrl.showDataExtractionQueryStatus = false;
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/navbar/admin-navbar.directive.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/navbar/admin-navbar.directive.ts ***!
  \***********************************************************************************/
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
 * @fileoverview Directive for the navigation bar in the admin panel.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/services/admin-router.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-router.service.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').directive('adminNavbar', [
    'AdminRouterService', 'UrlInterpolationService', 'ADMIN_TAB_URLS',
    'LOGOUT_URL', 'PROFILE_URL_TEMPLATE',
    function (AdminRouterService, UrlInterpolationService, ADMIN_TAB_URLS, LOGOUT_URL, PROFILE_URL_TEMPLATE) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getUserEmail: '&userEmail'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/navbar/admin-navbar.directive.html'),
            controllerAs: '$ctrl',
            controller: ['UserService', function (UserService) {
                    var ctrl = this;
                    ctrl.ADMIN_TAB_URLS = ADMIN_TAB_URLS;
                    ctrl.showTab = AdminRouterService.showTab;
                    ctrl.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
                    ctrl.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
                    ctrl.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
                    ctrl.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
                    ctrl.isMiscTabOpen = AdminRouterService.isMiscTabOpen;
                    UserService.getProfileImageDataUrlAsync().then(function (dataUrl) {
                        ctrl.profilePictureDataUrl = dataUrl;
                    });
                    ctrl.username = '';
                    ctrl.isModerator = null;
                    ctrl.isSuperAdmin = null;
                    ctrl.profileUrl = '';
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.username = userInfo.getUsername();
                        ctrl.isModerator = userInfo.isModerator();
                        ctrl.isSuperAdmin = userInfo.isSuperAdmin();
                        ctrl.profileUrl = (UrlInterpolationService.interpolateUrl(PROFILE_URL_TEMPLATE, {
                            username: ctrl.username
                        }));
                    });
                    ctrl.logoWhiteImgUrl = UrlInterpolationService.getStaticImageUrl('/logo/288x128_logo_white.png');
                    ctrl.logoutUrl = LOGOUT_URL;
                    ctrl.profileDropdownIsActive = false;
                    ctrl.onMouseoverProfilePictureOrDropdown = function (evt) {
                        angular.element(evt.currentTarget).parent().addClass('open');
                        ctrl.profileDropdownIsActive = true;
                    };
                    ctrl.onMouseoutProfilePictureOrDropdown = function (evt) {
                        angular.element(evt.currentTarget).parent().removeClass('open');
                        ctrl.profileDropdownIsActive = false;
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/roles-tab/admin-roles-tab.directive.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/roles-tab/admin-roles-tab.directive.ts ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Roles tab in the admin panel.
 */
__webpack_require__(/*! pages/admin-page/roles-tab/role-graph.directive.ts */ "./core/templates/dev/head/pages/admin-page/roles-tab/role-graph.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/services/admin-data.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-data.service.ts");
__webpack_require__(/*! pages/admin-page/services/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/services/admin-task-manager.service.ts");
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').directive('adminRolesTab', [
    '$http', 'AdminDataService', 'AdminTaskManagerService',
    'UrlInterpolationService', 'ADMIN_ROLE_HANDLER_URL',
    function ($http, AdminDataService, AdminTaskManagerService, UrlInterpolationService, ADMIN_ROLE_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/roles-tab/role-graph.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.resultRolesVisible = false;
                    ctrl.result = {};
                    ctrl.setStatusMessage('');
                    ctrl.viewFormValues = {};
                    ctrl.updateFormValues = {};
                    ctrl.viewFormValues.method = 'role';
                    ctrl.UPDATABLE_ROLES = {};
                    ctrl.VIEWABLE_ROLES = {};
                    ctrl.topicSummaries = {};
                    ctrl.graphData = {};
                    ctrl.graphDataLoaded = false;
                    AdminDataService.getDataAsync().then(function (response) {
                        ctrl.UPDATABLE_ROLES = response.updatable_roles;
                        ctrl.VIEWABLE_ROLES = response.viewable_roles;
                        ctrl.topicSummaries = response.topic_summaries;
                        ctrl.graphData = response.role_graph_data;
                        ctrl.graphDataLoaded = false;
                        // Calculating initStateId and finalStateIds for graphData
                        // Since role graph is acyclic, node with no incoming edge
                        // is initState and nodes with no outgoing edge are finalStates.
                        var hasIncomingEdge = [];
                        var hasOutgoingEdge = [];
                        for (var i = 0; i < ctrl.graphData.links.length; i++) {
                            hasIncomingEdge.push(ctrl.graphData.links[i].target);
                            hasOutgoingEdge.push(ctrl.graphData.links[i].source);
                        }
                        var finalStateIds = [];
                        for (var role in ctrl.graphData.nodes) {
                            if (ctrl.graphData.nodes.hasOwnProperty(role)) {
                                if (hasIncomingEdge.indexOf(role) === -1) {
                                    ctrl.graphData.initStateId = role;
                                }
                                if (hasOutgoingEdge.indexOf(role) === -1) {
                                    finalStateIds.push(role);
                                }
                            }
                        }
                        ctrl.graphData.finalStateIds = finalStateIds;
                        ctrl.graphDataLoaded = true;
                    });
                    ctrl.submitRoleViewForm = function (values) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        ctrl.setStatusMessage('Processing query...');
                        AdminTaskManagerService.startTask();
                        ctrl.result = {};
                        $http.get(ADMIN_ROLE_HANDLER_URL, {
                            params: {
                                method: values.method,
                                role: values.role,
                                username: values.username
                            }
                        }).then(function (response) {
                            ctrl.result = response.data;
                            if (Object.keys(ctrl.result).length === 0) {
                                ctrl.resultRolesVisible = false;
                                ctrl.setStatusMessage('No results.');
                            }
                            else {
                                ctrl.resultRolesVisible = true;
                                ctrl.setStatusMessage('Success.');
                            }
                            ctrl.viewFormValues.username = '';
                            ctrl.viewFormValues.role = '';
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                    ctrl.submitUpdateRoleForm = function (values) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        ctrl.setStatusMessage('Updating User Role');
                        AdminTaskManagerService.startTask();
                        $http.post(ADMIN_ROLE_HANDLER_URL, {
                            role: values.newRole,
                            username: values.username,
                            topic_id: values.topicId
                        }).then(function () {
                            ctrl.setStatusMessage('Role of ' + values.username +
                                ' successfully updated to ' + values.newRole);
                            ctrl.updateFormValues.username = '';
                            ctrl.updateFormValues.newRole = '';
                            ctrl.updateFormValues.topicId = '';
                        }, function (errorResponse) {
                            ctrl.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/roles-tab/role-graph.directive.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/roles-tab/role-graph.directive.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for displaying Role graph.
 */
__webpack_require__(/*! components/graph-services/graph-layout.service.ts */ "./core/templates/dev/head/components/graph-services/graph-layout.service.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
angular.module('oppia').directive('roleGraph', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                // An object with these keys:
                //  - 'nodes': An object whose keys are node ids and whose values are
                //             node labels
                //  - 'links': A list of objects with keys:
                //            'source': id of source node
                //            'target': id of target node
                //  - 'initStateId': The initial state id
                //  - 'finalStateIds': The list of ids corresponding to terminal states
                graphData: '=',
                // A boolean value to signify whether graphData is completely loaded.
                graphDataLoaded: '@'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/roles-tab/admin-roles-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$element', '$timeout', '$filter', 'StateGraphLayoutService',
                'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH',
                function ($element, $timeout, $filter, StateGraphLayoutService, MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
                    var ctrl = this;
                    var getElementDimensions = function () {
                        return {
                            h: $element.height(),
                            w: $element.width()
                        };
                    };
                    ctrl.getGraphHeightInPixels = function () {
                        return Math.max(ctrl.GRAPH_HEIGHT, 300);
                    };
                    ctrl.drawGraph = function (nodes, originalLinks, initStateId, finalStateIds) {
                        ctrl.finalStateIds = finalStateIds;
                        var links = angular.copy(originalLinks);
                        var nodeData = StateGraphLayoutService.computeLayout(nodes, links, initStateId, angular.copy(finalStateIds));
                        ctrl.GRAPH_WIDTH = StateGraphLayoutService.getGraphWidth(MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH);
                        ctrl.GRAPH_HEIGHT = StateGraphLayoutService.getGraphHeight(nodeData);
                        nodeData = StateGraphLayoutService.modifyPositionValues(nodeData, ctrl.GRAPH_WIDTH, ctrl.GRAPH_HEIGHT);
                        ctrl.augmentedLinks = StateGraphLayoutService.getAugmentedLinks(nodeData, links);
                        ctrl.getNodeTitle = function (node) {
                            return node.label;
                        };
                        ctrl.getTruncatedLabel = function (nodeLabel) {
                            return $filter('truncate')(nodeLabel, MAX_NODE_LABEL_LENGTH);
                        };
                        // creating list of nodes to display.
                        ctrl.nodeList = [];
                        for (var nodeId in nodeData) {
                            ctrl.nodeList.push(nodeData[nodeId]);
                        }
                    };
                    if (ctrl.graphDataLoaded) {
                        ctrl.drawGraph(ctrl.graphData.nodes, ctrl.graphData.links, ctrl.graphData.initStateId, ctrl.graphData.finalStateIds);
                    }
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/services/admin-data.service.ts":
/*!*********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/services/admin-data.service.ts ***!
  \*********************************************************************************/
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
 * @fileoverview Service that manages admin data.
 */
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').factory('AdminDataService', [
    '$http', 'ADMIN_HANDLER_URL',
    function ($http, ADMIN_HANDLER_URL) {
        var dataPromise = null;
        return {
            getDataAsync: function () {
                if (dataPromise) {
                    return dataPromise;
                }
                dataPromise = $http.get(ADMIN_HANDLER_URL).then(function (response) {
                    return response.data;
                });
                return dataPromise;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/services/admin-router.service.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/services/admin-router.service.ts ***!
  \***********************************************************************************/
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
 * @fileoverview Service to maintain the routing state of the admin page,
 * provide routing functionality, and store all available tab states.
 */
__webpack_require__(/*! pages/admin-page/admin-page.constants.ajs.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.constants.ajs.ts");
angular.module('oppia').factory('AdminRouterService', [
    'ADMIN_TAB_URLS',
    function (ADMIN_TAB_URLS) {
        var currentTabHash = ADMIN_TAB_URLS.ACTIVITIES;
        var getTabNameByHash = function (tabHash) {
            for (var tabName in ADMIN_TAB_URLS) {
                if (ADMIN_TAB_URLS[tabName] === tabHash) {
                    return tabName;
                }
            }
            return null;
        };
        return {
            /**
             * Navigates the page to the specified tab based on its HTML hash.
             */
            showTab: function (tabHash) {
                if (getTabNameByHash(tabHash)) {
                    currentTabHash = tabHash;
                }
            },
            /**
             * Returns whether the activities tab is open.
             */
            isActivitiesTabOpen: function () {
                return currentTabHash === ADMIN_TAB_URLS.ACTIVITIES;
            },
            /**
             * Returns whether the jobs tab is open.
             */
            isJobsTabOpen: function () {
                return currentTabHash === ADMIN_TAB_URLS.JOBS;
            },
            /**
             * Returns whether the config tab is open.
             */
            isConfigTabOpen: function () {
                return currentTabHash === ADMIN_TAB_URLS.CONFIG;
            },
            /**
             * Returns whether the roles tab is open.
             */
            isRolesTabOpen: function () {
                return currentTabHash === ADMIN_TAB_URLS.ROLES;
            },
            /**
             * Returns whether the miscellaneous tab is open.
             */
            isMiscTabOpen: function () {
                return currentTabHash === ADMIN_TAB_URLS.MISC;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/services/admin-task-manager.service.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/services/admin-task-manager.service.ts ***!
  \*****************************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service to query and start new tasks synchronously in the admin
 * page.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var AdminTaskManagerService = /** @class */ (function () {
    function AdminTaskManagerService() {
    }
    AdminTaskManagerService_1 = AdminTaskManagerService;
    /**
     * Notifies the manager a new task is starting.
     */
    AdminTaskManagerService.prototype.startTask = function () {
        AdminTaskManagerService_1.taskIsRunning = true;
    };
    /**
     * Returns whether a task is currently running.
     */
    AdminTaskManagerService.prototype.isTaskRunning = function () {
        return AdminTaskManagerService_1.taskIsRunning;
    };
    /**
     * Notifies the manager a task has completed.
     */
    AdminTaskManagerService.prototype.finishTask = function () {
        AdminTaskManagerService_1.taskIsRunning = false;
    };
    var AdminTaskManagerService_1;
    AdminTaskManagerService.taskIsRunning = false;
    AdminTaskManagerService = AdminTaskManagerService_1 = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], AdminTaskManagerService);
    return AdminTaskManagerService;
}());
exports.AdminTaskManagerService = AdminTaskManagerService;
angular.module('oppia').factory('AdminTaskManagerService', static_1.downgradeInjectable(AdminTaskManagerService));


/***/ }),

/***/ "./extensions/value_generators/templates/copier.directive.ts":
/*!*******************************************************************!*\
  !*** ./extensions/value_generators/templates/copier.directive.ts ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for copier value generator.
 */
// TODO(sll): Remove this directive (as well as the whole of the value
// generators framework).
__webpack_require__(/*! components/forms/custom-forms-directives/object-editor.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/object-editor.directive.ts");
angular.module('oppia').directive('copier', ['$compile', function ($compile) {
        return {
            link: function (scope, element) {
                scope.getTemplateUrl = function () {
                    return '/value_generator_handler/' + scope.generatorId;
                };
                $compile(element.contents())(scope);
            },
            restrict: 'E',
            scope: {
                customizationArgs: '=',
                getGeneratorId: '&',
                getInitArgs: '&',
                getObjType: '&',
            },
            template: '<span ng-include="getTemplateUrl()"></span>',
            controller: function ($scope) {
                $scope.generatorId = $scope.getGeneratorId();
                $scope.initArgs = $scope.getInitArgs();
                $scope.objType = $scope.getObjType();
                $scope.$watch('initArgs', function () {
                    $scope.initArgs = $scope.getInitArgs();
                }, true);
                $scope.$watch('objType', function () {
                    $scope.objType = $scope.getObjType();
                }, true);
            }
        };
    }]);


/***/ }),

/***/ "./extensions/value_generators/templates/random-selector.directive.ts":
/*!****************************************************************************!*\
  !*** ./extensions/value_generators/templates/random-selector.directive.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Directive for random selector value generator.
 */
angular.module('oppia').directive('randomSelector', [
    '$compile', function ($compile) {
        return {
            link: function (scope, element) {
                scope.getTemplateUrl = function () {
                    return '/value_generator_handler/' + scope.generatorId;
                };
                $compile(element.contents())(scope);
            },
            restrict: 'E',
            scope: {},
            bindToController: {
                customizationArgs: '=',
                getGeneratorId: '&'
            },
            template: '<div ng-include="getTemplateUrl()"></div>',
            controllerAs: '$ctrl',
            controller: function () {
                var ctrl = this;
                ctrl.SCHEMA = {
                    type: 'list',
                    items: {
                        type: 'unicode'
                    },
                    ui_config: {
                        add_element_text: 'Add New Choice'
                    }
                };
                ctrl.generatorId = ctrl.getGeneratorId();
                if (!ctrl.customizationArgs.list_of_values) {
                    ctrl.customizationArgs.list_of_values = [];
                }
            }
        };
    }
]);


/***/ }),

/***/ "./extensions/value_generators/valueGeneratorsRequires.ts":
/*!****************************************************************!*\
  !*** ./extensions/value_generators/valueGeneratorsRequires.ts ***!
  \****************************************************************/
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
 * @fileoverview Requires for all the value generators directives.
 */
__webpack_require__(/*! value_generators/templates/copier.directive.ts */ "./extensions/value_generators/templates/copier.directive.ts");
__webpack_require__(/*! value_generators/templates/random-selector.directive.ts */ "./extensions/value_generators/templates/random-selector.directive.ts");


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9ncmFwaC1zZXJ2aWNlcy9ncmFwaC1sYXlvdXQuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2UvYWN0aXZpdGllcy10YWIvYWRtaW4tZGV2LW1vZGUtYWN0aXZpdGllcy10YWIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2UvYWN0aXZpdGllcy10YWIvYWRtaW4tcHJvZC1tb2RlLWFjdGl2aXRpZXMtdGFiLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29uc3RhbnRzLmFqcy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tcGFnZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2Uuc2NyaXB0cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2NvbmZpZy10YWIvYWRtaW4tY29uZmlnLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9qb2JzLXRhYi9hZG1pbi1qb2JzLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9taXNjLXRhYi9hZG1pbi1taXNjLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9uYXZiYXIvYWRtaW4tbmF2YmFyLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL3JvbGVzLXRhYi9hZG1pbi1yb2xlcy10YWIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2Uvcm9sZXMtdGFiL3JvbGUtZ3JhcGguZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2Uvc2VydmljZXMvYWRtaW4tZGF0YS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2Uvc2VydmljZXMvYWRtaW4tcm91dGVyLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9zZXJ2aWNlcy9hZG1pbi10YXNrLW1hbmFnZXIuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9leHRlbnNpb25zL3ZhbHVlX2dlbmVyYXRvcnMvdGVtcGxhdGVzL2NvcGllci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy92YWx1ZV9nZW5lcmF0b3JzL3RlbXBsYXRlcy9yYW5kb20tc2VsZWN0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvdmFsdWVfZ2VuZXJhdG9ycy92YWx1ZUdlbmVyYXRvcnNSZXF1aXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBUSxvQkFBb0I7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBaUIsNEJBQTRCO0FBQzdDO0FBQ0E7QUFDQSwwQkFBa0IsMkJBQTJCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQWdCLHVCQUF1QjtBQUN2Qzs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxRQUFRO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QztBQUM1QztBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyxtQkFBTyxDQUFDLDREQUFrQjtBQUM1RCxlQUFlLG1CQUFPLENBQUMsOEZBQXlCO0FBQ2hELGFBQWEsbUJBQU8sQ0FBQyxpRUFBZTtBQUNwQyxzQkFBc0IsbUJBQU8sQ0FBQyxpRUFBZTtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsb0JBQW9CO0FBQzlEO0FBQ0EsK0JBQStCLHlDQUF5QztBQUN4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBK0MsbUJBQW1CO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1Qix5QkFBeUI7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsMENBQTBDO0FBQzdFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLHFCQUFxQjtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVDQUF1QztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLGVBQWU7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLHVCQUF1QixlQUFlO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLGVBQWU7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0Isa0NBQWtDO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLHlCQUF5QjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCx1QkFBdUIsMkJBQTJCO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVDQUF1QztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdURBQXVEO0FBQ3ZELHVEQUF1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDN0JMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnS0FBZ0U7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDbkNMO0FBQ0E7QUFDQTtB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LG1CQUFPLENBQUMsbUhBQWdEO0FBQ3hELG1CQUFPLENBQUMscUlBQXlEIiwiZmlsZSI6ImFkbWluLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIGluc3RhbGwgYSBKU09OUCBjYWxsYmFjayBmb3IgY2h1bmsgbG9hZGluZ1xuIFx0ZnVuY3Rpb24gd2VicGFja0pzb25wQ2FsbGJhY2soZGF0YSkge1xuIFx0XHR2YXIgY2h1bmtJZHMgPSBkYXRhWzBdO1xuIFx0XHR2YXIgbW9yZU1vZHVsZXMgPSBkYXRhWzFdO1xuIFx0XHR2YXIgZXhlY3V0ZU1vZHVsZXMgPSBkYXRhWzJdO1xuXG4gXHRcdC8vIGFkZCBcIm1vcmVNb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuIFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbiBcdFx0dmFyIG1vZHVsZUlkLCBjaHVua0lkLCBpID0gMCwgcmVzb2x2ZXMgPSBbXTtcbiBcdFx0Zm9yKDtpIDwgY2h1bmtJZHMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4gXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG4gXHRcdFx0XHRyZXNvbHZlcy5wdXNoKGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSk7XG4gXHRcdFx0fVxuIFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4gXHRcdH1cbiBcdFx0Zm9yKG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG4gXHRcdFx0aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcbiBcdFx0XHRcdG1vZHVsZXNbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRpZihwYXJlbnRKc29ucEZ1bmN0aW9uKSBwYXJlbnRKc29ucEZ1bmN0aW9uKGRhdGEpO1xuXG4gXHRcdHdoaWxlKHJlc29sdmVzLmxlbmd0aCkge1xuIFx0XHRcdHJlc29sdmVzLnNoaWZ0KCkoKTtcbiBcdFx0fVxuXG4gXHRcdC8vIGFkZCBlbnRyeSBtb2R1bGVzIGZyb20gbG9hZGVkIGNodW5rIHRvIGRlZmVycmVkIGxpc3RcbiBcdFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2guYXBwbHkoZGVmZXJyZWRNb2R1bGVzLCBleGVjdXRlTW9kdWxlcyB8fCBbXSk7XG5cbiBcdFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiBhbGwgY2h1bmtzIHJlYWR5XG4gXHRcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIFx0fTtcbiBcdGZ1bmN0aW9uIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCkge1xuIFx0XHR2YXIgcmVzdWx0O1xuIFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWRNb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0dmFyIGRlZmVycmVkTW9kdWxlID0gZGVmZXJyZWRNb2R1bGVzW2ldO1xuIFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuIFx0XHRcdGZvcih2YXIgaiA9IDE7IGogPCBkZWZlcnJlZE1vZHVsZS5sZW5ndGg7IGorKykge1xuIFx0XHRcdFx0dmFyIGRlcElkID0gZGVmZXJyZWRNb2R1bGVbal07XG4gXHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbZGVwSWRdICE9PSAwKSBmdWxmaWxsZWQgPSBmYWxzZTtcbiBcdFx0XHR9XG4gXHRcdFx0aWYoZnVsZmlsbGVkKSB7XG4gXHRcdFx0XHRkZWZlcnJlZE1vZHVsZXMuc3BsaWNlKGktLSwgMSk7XG4gXHRcdFx0XHRyZXN1bHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IGRlZmVycmVkTW9kdWxlWzBdKTtcbiBcdFx0XHR9XG4gXHRcdH1cblxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJhZG1pblwiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLnNjcmlwdHMudHNcIixcInZlbmRvcnN+YWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJ+Nzg1NmMwNWFcIixcInZlbmRvcnN+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3B+N2Y4YmNjNjdcIixcInZlbmRvcnN+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5wcmFjdGljZV9zZXN+OTg4Y2ZlYjFcIixcImFib3V0fmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbW11bml0eV9kYXNoYm9hcmR+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2FyZH5kb25hdGV+ZTA2YTRhMTdcIixcImFkbWlufmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+bW9kZXJhdG9yfnByYWN0aWNlX3Nlc3Npb25+cmV2aWV3X3Rlc3R+Yjk1ODBlZDBcIixcImFkbWlufmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+bW9kZXJhdG9yfnByYWN0aWNlX3Nlc3Npb25+cmV2aWV3X3Rlc3R+ZDM1OTUxNTVcIixcImFkbWlufmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+bW9kZXJhdG9yfnByYWN0aWNlX3Nlc3Npb25+cmV2aWV3X3Rlc3R+c2tpbGxfZWRpdG9yfnN0b3J+NzczNGNkZGJcIixcImFkbWlufmNvbGxlY3Rpb25fZWRpdG9yXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmVzIGZvciByZXVzYWJsZSBkYXRhIHZpc3VhbGl6YXRpb24gY29tcG9uZW50cy5cbiAqL1xudmFyIGNsb25lRGVlcF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gvY2xvbmVEZWVwXCIpKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBhcHBfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiYXBwLmNvbnN0YW50c1wiKTtcbnZhciBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZSgpIHtcbiAgICAgICAgdGhpcy5NQVhfSU5ERU5UQVRJT05fTEVWRUwgPSAyLjU7XG4gICAgICAgIC8vIFRoZSBsYXN0IHJlc3VsdCBvZiBhIGNhbGwgdG8gY29tcHV0ZUxheW91dCgpLiBVc2VkIGZvciBkZXRlcm1pbmluZyB0aGVcbiAgICAgICAgLy8gb3JkZXIgaW4gd2hpY2ggdG8gc3BlY2lmeSBzdGF0ZXMgaW4gcnVsZXMuXG4gICAgICAgIHRoaXMubGFzdENvbXB1dGVkQXJyYW5nZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdub2RlcycgaXMgYSBjb21wbGV4IGRpY3Qgd2hvc2UgZXhhY3QgdHlwZSBuZWVkcyB0byBiZVxuICAgIC8vIHJlc2VhcmNoZWQuIFNhbWUgZ29lcyBmb3IgJ2xpbmtzJyBhbmQgdGhlIHJldHVybiB0eXBlLlxuICAgIFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlLnByb3RvdHlwZS5nZXRHcmFwaEFzQWRqYWNlbmN5TGlzdHMgPSBmdW5jdGlvbiAobm9kZXMsIGxpbmtzKSB7XG4gICAgICAgIHZhciBhZGphY2VuY3lMaXN0cyA9IHt9O1xuICAgICAgICBmb3IgKHZhciBub2RlSWQgaW4gbm9kZXMpIHtcbiAgICAgICAgICAgIGFkamFjZW5jeUxpc3RzW25vZGVJZF0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAobGlua3NbaV0uc291cmNlICE9PSBsaW5rc1tpXS50YXJnZXQgJiZcbiAgICAgICAgICAgICAgICBhZGphY2VuY3lMaXN0c1tsaW5rc1tpXS5zb3VyY2VdLmluZGV4T2YobGlua3NbaV0udGFyZ2V0KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBhZGphY2VuY3lMaXN0c1tsaW5rc1tpXS5zb3VyY2VdLnB1c2gobGlua3NbaV0udGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWRqYWNlbmN5TGlzdHM7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdhZGphY2VuY3lMaXN0cycgaXMgYSBjb21wbGV4IGRpY3Qgd2hvc2UgZXhhY3QgdHlwZSBuZWVkcyB0b1xuICAgIC8vIGJlIHJlc2VhcmNoZWQuIFNhbWUgZ29lcyBmb3IgJ3RydW5rTm9kZUlkcycgYW5kIHRoZSByZXR1cm4gdHlwZS5cbiAgICBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5wcm90b3R5cGUuZ2V0SW5kZW50YXRpb25MZXZlbHMgPSBmdW5jdGlvbiAoYWRqYWNlbmN5TGlzdHMsIHRydW5rTm9kZUlkcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgaW5kZW50YXRpb25MZXZlbHMgPSBbXTtcbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgZmluZCBhbmQgaW5kZW50IHRoZSBsb25nZXN0IHNob3J0Y3V0IGZvciB0aGUgc2VnbWVudCBvZlxuICAgICAgICAvLyBub2RlcyByYW5naW5nIGZyb20gdHJ1bmtOb2RlSWRzW3N0YXJ0SW5kXSB0byB0cnVua05vZGVJZHNbZW5kSW5kXVxuICAgICAgICAvLyAoaW5jbHVzaXZlKS4gSXQncyBwb3NzaWJsZSB0aGF0IHRoaXMgc2hvcnRjdXQgc3RhcnRzIGZyb20gYSB0cnVua1xuICAgICAgICAvLyBub2RlIHdpdGhpbiB0aGlzIGludGVydmFsIChBLCBzYXkpIGFuZCBlbmRzIGF0IGEgdHJ1bmsgbm9kZSBhZnRlclxuICAgICAgICAvLyB0aGlzIGludGVydmFsLCBpbiB3aGljaCBjYXNlIHdlIGluZGVudCBhbGwgbm9kZXMgZnJvbSBBICsgMSBvbndhcmRzLlxuICAgICAgICAvLyBOT1RFOiB0aGlzIG11dGF0ZXMgaW5kZW50YXRpb25MZXZlbHMgYXMgYSBzaWRlLWVmZmVjdC5cbiAgICAgICAgdmFyIGluZGVudExvbmdlc3RTaG9ydGN1dCA9IGZ1bmN0aW9uIChzdGFydEluZCwgZW5kSW5kKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRJbmQgPj0gZW5kSW5kIHx8XG4gICAgICAgICAgICAgICAgaW5kZW50YXRpb25MZXZlbHNbc3RhcnRJbmRdID49IF90aGlzLk1BWF9JTkRFTlRBVElPTl9MRVZFTCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBiZXN0U291cmNlSW5kID0gLTE7XG4gICAgICAgICAgICB2YXIgYmVzdFRhcmdldEluZCA9IC0xO1xuICAgICAgICAgICAgZm9yICh2YXIgc291cmNlSW5kID0gc3RhcnRJbmQ7IHNvdXJjZUluZCA8IGVuZEluZDsgc291cmNlSW5kKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlTm9kZUlkID0gdHJ1bmtOb2RlSWRzW3NvdXJjZUluZF07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGphY2VuY3lMaXN0c1tzb3VyY2VOb2RlSWRdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NzaWJsZVRhcmdldEluZCA9IHRydW5rTm9kZUlkcy5pbmRleE9mKGFkamFjZW5jeUxpc3RzW3NvdXJjZU5vZGVJZF1baV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zc2libGVUYXJnZXRJbmQgIT09IC0xICYmIHNvdXJjZUluZCA8IHBvc3NpYmxlVGFyZ2V0SW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SW5kID0gTWF0aC5taW4ocG9zc2libGVUYXJnZXRJbmQsIGVuZEluZCArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldEluZCAtIHNvdXJjZUluZCA+IGJlc3RUYXJnZXRJbmQgLSBiZXN0U291cmNlSW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVzdFNvdXJjZUluZCA9IHNvdXJjZUluZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXN0VGFyZ2V0SW5kID0gdGFyZ2V0SW5kO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGJlc3RUYXJnZXRJbmQgLSBiZXN0U291cmNlSW5kID4gMSkge1xuICAgICAgICAgICAgICAgIC8vIEluZGVudCBub2RlcyBpbiBbYmVzdFNvdXJjZUluZCArIDEsIGJlc3RUYXJnZXRJbmQgLSAxXS5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gYmVzdFNvdXJjZUluZCArIDE7IGkgPCBiZXN0VGFyZ2V0SW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50YXRpb25MZXZlbHNbaV0gKz0gMC41O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBhdHRlbXB0IHRvIGluZGVudCBub2RlcyBiZWZvcmUsIHdpdGhpbiBhbmQgYWZ0ZXIgdGhpc1xuICAgICAgICAgICAgICAgIC8vIGludGVydmFsLlxuICAgICAgICAgICAgICAgIGluZGVudExvbmdlc3RTaG9ydGN1dChzdGFydEluZCwgYmVzdFNvdXJjZUluZCk7XG4gICAgICAgICAgICAgICAgaW5kZW50TG9uZ2VzdFNob3J0Y3V0KGJlc3RTb3VyY2VJbmQgKyAxLCBiZXN0VGFyZ2V0SW5kIC0gMSk7XG4gICAgICAgICAgICAgICAgaW5kZW50TG9uZ2VzdFNob3J0Y3V0KGJlc3RUYXJnZXRJbmQsIGVuZEluZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJ1bmtOb2RlSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpbmRlbnRhdGlvbkxldmVscy5wdXNoKDApO1xuICAgICAgICB9XG4gICAgICAgIGluZGVudExvbmdlc3RTaG9ydGN1dCgwLCB0cnVua05vZGVJZHMubGVuZ3RoIC0gMSk7XG4gICAgICAgIHJldHVybiBpbmRlbnRhdGlvbkxldmVscztcbiAgICB9O1xuICAgIC8vIFJldHVybnMgYW4gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgbm9kZXMgb2YgdGhlIGdyYXBoLiBUaGUga2V5cyBvZiB0aGVcbiAgICAvLyBvYmplY3QgYXJlIHRoZSBub2RlIGxhYmVscy4gVGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzIGFyZSBvYmplY3RzIHdpdGhcbiAgICAvLyB0aGUgZm9sbG93aW5nIGtleXM6XG4gICAgLy8gICAtIHgwOiB0aGUgeC1wb3NpdGlvbiBvZiB0aGUgdG9wLWxlZnQgY29ybmVyIG9mIHRoZSBub2RlLCBtZWFzdXJlZFxuICAgIC8vICAgICAgIGFzIGEgZnJhY3Rpb24gb2YgdGhlIHRvdGFsIHdpZHRoLlxuICAgIC8vICAgLSB5MDogdGhlIHktcG9zaXRpb24gb2YgdGhlIHRvcC1sZWZ0IGNvcm5lciBvZiB0aGUgbm9kZSwgbWVhc3VyZWRcbiAgICAvLyAgICAgICBhcyBhIGZyYWN0aW9uIG9mIHRoZSB0b3RhbCBoZWlnaHQuXG4gICAgLy8gICAtIHdpZHRoOiB0aGUgd2lkdGggb2YgdGhlIG5vZGUsIG1lYXN1cmVkIGFzIGEgZnJhY3Rpb24gb2YgdGhlIHRvdGFsXG4gICAgLy8gICAgICAgd2lkdGguXG4gICAgLy8gICAtIGhlaWdodDogdGhlIGhlaWdodCBvZiB0aGUgbm9kZSwgbWVhc3VyZWQgYXMgYSBmcmFjdGlvbiBvZiB0aGUgdG90YWxcbiAgICAvLyAgICAgICBoZWlnaHQuXG4gICAgLy8gICAtIHhMYWJlbDogdGhlIHgtcG9zaXRpb24gb2YgdGhlIG1pZGRsZSBvZiB0aGUgYm94IGNvbnRhaW5pbmdcbiAgICAvLyAgICAgICB0aGUgbm9kZSBsYWJlbCwgbWVhc3VyZWQgYXMgYSBmcmFjdGlvbiBvZiB0aGUgdG90YWwgd2lkdGguXG4gICAgLy8gICAgICAgVGhlIG5vZGUgbGFiZWwgaXMgY2VudGVyZWQgaG9yaXpvbnRhbGx5IHdpdGhpbiB0aGlzIGJveC5cbiAgICAvLyAgIC0geUxhYmVsOiB0aGUgeS1wb3NpdGlvbiBvZiB0aGUgbWlkZGxlIG9mIHRoZSBib3ggY29udGFpbmluZ1xuICAgIC8vICAgICAgIHRoZSBub2RlIGxhYmVsLCBtZWFzdXJlZCBhcyBhIGZyYWN0aW9uIG9mIHRoZSB0b3RhbCBoZWlnaHQuXG4gICAgLy8gICAgICAgVGhlIG5vZGUgbGFiZWwgaXMgY2VudGVyZWQgdmVydGljYWxseSB3aXRoaW4gdGhpcyBib3guXG4gICAgLy8gICAtIHJlYWNoYWJsZTogd2hldGhlciB0aGVyZSBpcyBhIHBhdGggZnJvbSB0aGUgc3RhcnQgbm9kZSB0byB0aGlzXG4gICAgLy8gICAgICAgbm9kZS5cbiAgICAvLyAgIC0gcmVhY2hhYmxlRnJvbUVuZDogd2hldGhlciB0aGVyZSBpcyBhIHBhdGggZnJvbSB0aGlzIG5vZGUgdG8gdGhlXG4gICAgLy8gICAgICAgRU5EIG5vZGUuXG4gICAgLy8gICAtIGlkOiBhIHVuaXF1ZSBpZCBmb3IgdGhlIG5vZGUuXG4gICAgLy8gICAtIGxhYmVsOiB0aGUgZnVsbCBsYWJlbCBvZiB0aGUgbm9kZS5cbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdub2RlcycgaXMgYSBjb21wbGV4IGRpY3Qgd2hvc2UgZXhhY3QgdHlwZSBuZWVkcyB0b1xuICAgIC8vIGJlIHJlc2VhcmNoZWQuIFNhbWUgZ29lcyBmb3IgdGhlIG90aGVyIHBhcmFtZXRlcnMgYW5kIHRoZSByZXR1cm4gdHlwZS5cbiAgICBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5wcm90b3R5cGUuY29tcHV0ZUxheW91dCA9IGZ1bmN0aW9uIChub2RlcywgbGlua3MsIGluaXROb2RlSWQsIGZpbmFsTm9kZUlkcykge1xuICAgICAgICB2YXIgYWRqYWNlbmN5TGlzdHMgPSB0aGlzLmdldEdyYXBoQXNBZGphY2VuY3lMaXN0cyhub2RlcywgbGlua3MpO1xuICAgICAgICAvLyBGaW5kIGEgbG9uZyBwYXRoIHRocm91Z2ggdGhlIGdyYXBoIGZyb20gdGhlIGluaXRpYWwgc3RhdGUgdG8gYVxuICAgICAgICAvLyB0ZXJtaW5hbCBzdGF0ZSB2aWEgc2ltcGxlIGJhY2t0cmFja2luZy4gTGltaXQgdGhlIGFsZ29yaXRobSB0byBhXG4gICAgICAgIC8vIGNvbnN0YW50IG51bWJlciBvZiBjYWxscyBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgY2FsY3VsYXRpb25cbiAgICAgICAgLy8gZG9lcyBub3QgdGFrZSB0b28gbG9uZy5cbiAgICAgICAgdmFyIE1BWF9CQUNLVFJBQ0tJTkdfQ0FMTFMgPSAxMDAwO1xuICAgICAgICB2YXIgbnVtQmFja3RyYWNraW5nQ2FsbHMgPSAwO1xuICAgICAgICB2YXIgYmVzdFBhdGggPSBbaW5pdE5vZGVJZF07XG4gICAgICAgIC8vIE5vdGUgdGhhdCB0aGlzIGlzIGEgJ2dsb2JhbCB2YXJpYWJsZScgZm9yIHRoZSBwdXJwb3NlcyBvZiB0aGVcbiAgICAgICAgLy8gYmFja3RyYWNraW5nIGNvbXB1dGF0aW9uLlxuICAgICAgICB2YXIgY3VycmVudFBhdGggPSBbXTtcbiAgICAgICAgdmFyIGJhY2t0cmFjayA9IGZ1bmN0aW9uIChjdXJyZW50Tm9kZUlkKSB7XG4gICAgICAgICAgICBjdXJyZW50UGF0aC5wdXNoKGN1cnJlbnROb2RlSWQpO1xuICAgICAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgbm9kZSBsZWFkcyB0byBubyBvdGhlciBub2Rlcywgd2UgY29uc2lkZXIgaXQgYVxuICAgICAgICAgICAgLy8gJ3Rlcm1pbmFsIHN0YXRlJy5cbiAgICAgICAgICAgIGlmIChhZGphY2VuY3lMaXN0c1tjdXJyZW50Tm9kZUlkXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFBhdGgubGVuZ3RoID4gYmVzdFBhdGgubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RQYXRoID0gY2xvbmVEZWVwXzEuZGVmYXVsdChjdXJyZW50UGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbnVtQmFja3RyYWNraW5nQ2FsbHMrKztcbiAgICAgICAgICAgICAgICBpZiAobnVtQmFja3RyYWNraW5nQ2FsbHMgPD0gTUFYX0JBQ0tUUkFDS0lOR19DQUxMUykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFkamFjZW5jeUxpc3RzW2N1cnJlbnROb2RlSWRdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFBhdGguaW5kZXhPZihhZGphY2VuY3lMaXN0c1tjdXJyZW50Tm9kZUlkXVtpXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrKGFkamFjZW5jeUxpc3RzW2N1cnJlbnROb2RlSWRdW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRQYXRoLnBvcCgpO1xuICAgICAgICB9O1xuICAgICAgICBiYWNrdHJhY2soaW5pdE5vZGVJZCk7XG4gICAgICAgIC8vIEluIHRoaXMgaW1wbGVtZW50YXRpb24sIG5vZGVzIGFyZSBhbGlnbmVkIHdpdGggYSByZWN0YW5ndWxhciBncmlkLlxuICAgICAgICAvLyBXZSBjYWxjdWxhdGUgdHdvIGFkZGl0aW9uYWwgaW50ZXJuYWwgdmFyaWFibGVzIGZvciBlYWNoIG5vZGUgaW5cbiAgICAgICAgLy8gbm9kZURhdGE6XG4gICAgICAgIC8vICAgLSBkZXB0aDogaXRzIGRlcHRoIGluIHRoZSBncmFwaC5cbiAgICAgICAgLy8gICAtIG9mZnNldDogaXRzIGhvcml6b250YWwgb2Zmc2V0IGluIHRoZSBncmFwaC5cbiAgICAgICAgLy8gVGhlIGRlcHRoIGFuZCBvZmZzZXQgYXJlIG1lYXN1cmVkIGluIHRlcm1zIG9mIGdyaWQgc3F1YXJlcy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2UgZmlyc3QgdGFrZSB0aGUgbG9uZ2VzdCBwYXRoIHRocm91Z2ggdGhlIGdyYXBoICh0aGUgJ3RydW5rJykgYW5kXG4gICAgICAgIC8vIGZpbmQgdGhlIGxvbmdlc3QgcG9zc2libGUgc2hvcnRjdXRzIHdpdGhpbiB0aGF0IHBhdGgsIHRoZW4gaW5kZW50XG4gICAgICAgIC8vIHRoZSBub2RlcyB3aXRoaW4gdGhvc2Ugc2hvcnRjdXRzIGFuZCBhc3NpZ24gZGVwdGhzL29mZnNldHMgdG8gdGhlbS5cbiAgICAgICAgLy8gVGhlIGluZGVudGF0aW9uIGlzIGRvbmUgYnkgb25seSBoYWxmIGEgbm9kZSB3aWR0aCwgc28gdGhhdCB0aGUgbm9kZXNcbiAgICAgICAgLy8gc3RpbGwgZmVlbCAnY2xvc2UnIHRvZ2V0aGVyLlxuICAgICAgICAvL1xuICAgICAgICAvLyBBZnRlciB0aGF0LCB3ZSB0cmF2ZXJzZSBhbGwgcmVtYWluaW5nIG5vZGVzIHZpYSBCRlMgYW5kIGFycmFuZ2UgdGhlbVxuICAgICAgICAvLyBzdWNoIHRoYXQgbm9kZXMgdGhhdCBhcmUgaW1tZWRpYXRlIGRlc2NlbmRhbnRzIG9mIG5vZGVzIGluIHRoZSB0cnVua1xuICAgICAgICAvLyBmYWxsIGluIHRoZSBsZXZlbCBqdXN0IGJlbG93IHRoZWlyIHBhcmVudCwgYW5kIHRoZWlyIGNoaWxkcmVuIGZhbGwgaW5cbiAgICAgICAgLy8gdGhlIG5leHQgbGV2ZWwsIGV0Yy4gQWxsIHRoZXNlIG5vZGVzIGFyZSBwbGFjZWQgdG8gdGhlIHJpZ2h0IG9mIHRoZVxuICAgICAgICAvLyB0cnVuay5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gTk9URTogVGhpcyBhbGdvcml0aG0gZG9lcyBub3Qgd29yayBzbyB3ZWxsIGluIGNsYXJpZnlpbmcgYXJ0aWN1bGF0aW9uXG4gICAgICAgIC8vIHBvaW50cyBhbmQgJ3N1YmNsdXN0ZXJzJyB3aXRoaW4gYSBncmFwaC4gRm9yIGFuIGlsbHVzdHJhdGlvbiBvZiB0aGlzLFxuICAgICAgICAvLyBzZWUgdGhlICdQYXJhbWV0ZXJpemVkIEFkdmVudHVyZScgZGVtbyBleHBsb3JhdGlvbi5cbiAgICAgICAgdmFyIFNFTlRJTkVMX0RFUFRIID0gLTE7XG4gICAgICAgIHZhciBTRU5USU5FTF9PRkZTRVQgPSAtMTtcbiAgICAgICAgdmFyIG5vZGVEYXRhID0ge307XG4gICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2Rlcykge1xuICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXSA9IHtcbiAgICAgICAgICAgICAgICBkZXB0aDogU0VOVElORUxfREVQVEgsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiBTRU5USU5FTF9PRkZTRVQsXG4gICAgICAgICAgICAgICAgcmVhY2hhYmxlOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWF4RGVwdGggPSAwO1xuICAgICAgICB2YXIgbWF4T2Zmc2V0SW5FYWNoTGV2ZWwgPSB7XG4gICAgICAgICAgICAwOiAwXG4gICAgICAgIH07XG4gICAgICAgIHZhciB0cnVua05vZGVzSW5kZW50YXRpb25MZXZlbHMgPSB0aGlzLmdldEluZGVudGF0aW9uTGV2ZWxzKGFkamFjZW5jeUxpc3RzLCBiZXN0UGF0aCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmVzdFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGVEYXRhW2Jlc3RQYXRoW2ldXS5kZXB0aCA9IG1heERlcHRoO1xuICAgICAgICAgICAgbm9kZURhdGFbYmVzdFBhdGhbaV1dLm9mZnNldCA9IHRydW5rTm9kZXNJbmRlbnRhdGlvbkxldmVsc1tpXTtcbiAgICAgICAgICAgIG5vZGVEYXRhW2Jlc3RQYXRoW2ldXS5yZWFjaGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgbWF4T2Zmc2V0SW5FYWNoTGV2ZWxbbWF4RGVwdGhdID0gdHJ1bmtOb2Rlc0luZGVudGF0aW9uTGV2ZWxzW2ldO1xuICAgICAgICAgICAgbWF4RGVwdGgrKztcbiAgICAgICAgfVxuICAgICAgICAvLyBEbyBhIGJyZWFkdGgtZmlyc3Qgc2VhcmNoIHRvIGNhbGN1bGF0ZSB0aGUgZGVwdGhzIGFuZCBvZmZzZXRzIGZvclxuICAgICAgICAvLyBvdGhlciBub2Rlcy5cbiAgICAgICAgdmFyIHNlZW5Ob2RlcyA9IFtpbml0Tm9kZUlkXTtcbiAgICAgICAgdmFyIHF1ZXVlID0gW2luaXROb2RlSWRdO1xuICAgICAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGN1cnJOb2RlSWQgPSBxdWV1ZVswXTtcbiAgICAgICAgICAgIHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICBub2RlRGF0YVtjdXJyTm9kZUlkXS5yZWFjaGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGphY2VuY3lMaXN0c1tjdXJyTm9kZUlkXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gYWRqYWNlbmN5TGlzdHNbY3Vyck5vZGVJZF1baV07XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHRhcmdldCBub2RlIGlzIGEgdHJ1bmsgbm9kZSwgYnV0IGlzbid0IGF0IHRoZSBjb3JyZWN0XG4gICAgICAgICAgICAgICAgLy8gZGVwdGggdG8gcHJvY2VzcyBub3csIHdlIGlnbm9yZSBpdCBmb3Igbm93IGFuZCBzdGljayBpdCBiYWNrIGluXG4gICAgICAgICAgICAgICAgLy8gdGhlIHF1ZXVlIHRvIGJlIHByb2Nlc3NlZCBsYXRlci5cbiAgICAgICAgICAgICAgICBpZiAoYmVzdFBhdGguaW5kZXhPZihsaW5rVGFyZ2V0KSAhPT0gLTEgJiZcbiAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbbGlua1RhcmdldF0uZGVwdGggIT09IG5vZGVEYXRhW2N1cnJOb2RlSWRdLmRlcHRoICsgMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2Vlbk5vZGVzLmluZGV4T2YobGlua1RhcmdldCkgPT09IC0xICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5pbmRleE9mKGxpbmtUYXJnZXQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChsaW5rVGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQXNzaWduIGRlcHRocyBhbmQgb2Zmc2V0cyB0byBub2RlcyBvbmx5IGlmIHdlJ3JlIHByb2Nlc3NpbmcgdGhlbVxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICAgICAgICBpZiAoc2Vlbk5vZGVzLmluZGV4T2YobGlua1RhcmdldCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlZW5Ob2Rlcy5wdXNoKGxpbmtUYXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZURhdGFbbGlua1RhcmdldF0uZGVwdGggPT09IFNFTlRJTkVMX0RFUFRIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtsaW5rVGFyZ2V0XS5kZXB0aCA9IG5vZGVEYXRhW2N1cnJOb2RlSWRdLmRlcHRoICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW2xpbmtUYXJnZXRdLm9mZnNldCA9IChub2RlRGF0YVtsaW5rVGFyZ2V0XS5kZXB0aCBpbiBtYXhPZmZzZXRJbkVhY2hMZXZlbCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4T2Zmc2V0SW5FYWNoTGV2ZWxbbm9kZURhdGFbbGlua1RhcmdldF0uZGVwdGhdICsgMSA6IDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4RGVwdGggPSBNYXRoLm1heChtYXhEZXB0aCwgbm9kZURhdGFbbGlua1RhcmdldF0uZGVwdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4T2Zmc2V0SW5FYWNoTGV2ZWxbbm9kZURhdGFbbGlua1RhcmdldF0uZGVwdGhdID0gKG5vZGVEYXRhW2xpbmtUYXJnZXRdLm9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmluZGV4T2YobGlua1RhcmdldCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKGxpbmtUYXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSBub2RlcyB0aGF0IHdlcmUgbm90IHZpc2l0ZWQgaW4gdGhlIGZvcndhcmQgdHJhdmVyc2FsLlxuICAgICAgICBtYXhPZmZzZXRJbkVhY2hMZXZlbFttYXhEZXB0aCArIDFdID0gMDtcbiAgICAgICAgbWF4RGVwdGggKz0gMTtcbiAgICAgICAgdmFyIG9ycGhhbmVkTm9kZXNFeGlzdCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBub2RlSWQgaW4gbm9kZURhdGEpIHtcbiAgICAgICAgICAgIGlmIChub2RlRGF0YVtub2RlSWRdLmRlcHRoID09PSBTRU5USU5FTF9ERVBUSCkge1xuICAgICAgICAgICAgICAgIG9ycGhhbmVkTm9kZXNFeGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS5kZXB0aCA9IG1heERlcHRoO1xuICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF0ub2Zmc2V0ID0gbWF4T2Zmc2V0SW5FYWNoTGV2ZWxbbWF4RGVwdGhdO1xuICAgICAgICAgICAgICAgIG1heE9mZnNldEluRWFjaExldmVsW21heERlcHRoXSArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcnBoYW5lZE5vZGVzRXhpc3QpIHtcbiAgICAgICAgICAgIG1heERlcHRoKys7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQnVpbGQgdGhlICdpbnZlcnNlIGluZGV4JyAtLSBmb3IgZWFjaCByb3csIHN0b3JlIHRoZSAob2Zmc2V0LCBub2RlSWQpXG4gICAgICAgIC8vIHBhaXJzIGluIGFzY2VuZGluZyBvcmRlciBvZiBvZmZzZXQuXG4gICAgICAgIHZhciBub2RlUG9zaXRpb25zVG9JZHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbWF4RGVwdGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZVBvc2l0aW9uc1RvSWRzLnB1c2goW10pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgaWYgKG5vZGVEYXRhW25vZGVJZF0uZGVwdGggIT09IFNFTlRJTkVMX0RFUFRIKSB7XG4gICAgICAgICAgICAgICAgbm9kZVBvc2l0aW9uc1RvSWRzW25vZGVEYXRhW25vZGVJZF0uZGVwdGhdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGVJZCxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBub2RlRGF0YVtub2RlSWRdLm9mZnNldFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG1heERlcHRoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIFRPRE8oIzcxNjUpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgICAgICAgICAgLy8gJ2FueScgYmVjYXVzZSBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSAnYScgYW5kICdiJyBuZWVkcyB0byBiZSBmb3VuZC5cbiAgICAgICAgICAgIG5vZGVQb3NpdGlvbnNUb0lkc1tpXS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEub2Zmc2V0IC0gYi5vZmZzZXQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZWNhbGN1bGF0ZSB0aGUgbm9kZSBkZXB0aHMgYW5kIG9mZnNldHMsIHRha2luZyBpbnRvIGFjY291bnRcbiAgICAgICAgLy8gTUFYX05PREVTX1BFUl9ST1cuIElmIHRoZXJlIGFyZSB0b28gbWFueSBub2RlcyBpbiBhIHJvdywgd2Ugb3ZlcmZsb3dcbiAgICAgICAgLy8gdGhlbSBpbnRvIHRoZSBuZXh0IG9uZS5cbiAgICAgICAgdmFyIGN1cnJlbnREZXB0aCA9IDA7XG4gICAgICAgIHZhciBjdXJyZW50TGVmdE1hcmdpbiA9IDA7XG4gICAgICAgIHZhciBjdXJyZW50TGVmdE9mZnNldCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG1heERlcHRoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChub2RlUG9zaXRpb25zVG9JZHNbaV0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSBvZmZzZXQgb2YgdGhlIGxlZnRtb3N0IG5vZGUgYXQgdGhpcyBkZXB0aC4gSWYgdGhlcmUgYXJlIHRvb1xuICAgICAgICAgICAgICAgIC8vIG1hbnkgbm9kZXMgaW4gdGhpcyBkZXB0aCwgdGhpcyB2YXJpYWJsZSBpcyB1c2VkIHRvIGZpZ3VyZSBvdXRcbiAgICAgICAgICAgICAgICAvLyB3aGljaCBvZmZzZXQgdG8gc3RhcnQgdGhlIGNvbnRpbnVhdGlvbiByb3dzIGZyb20uXG4gICAgICAgICAgICAgICAgY3VycmVudExlZnRNYXJnaW4gPSBub2RlUG9zaXRpb25zVG9JZHNbaV1bMF0ub2Zmc2V0O1xuICAgICAgICAgICAgICAgIC8vIFRoZSBvZmZzZXQgb2YgdGhlIGN1cnJlbnQgbm9kZSB1bmRlciBjb25zaWRlcmF0aW9uLlxuICAgICAgICAgICAgICAgIGN1cnJlbnRMZWZ0T2Zmc2V0ID0gY3VycmVudExlZnRNYXJnaW47XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBub2RlUG9zaXRpb25zVG9JZHNbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkT2Zmc2V0ID0gY3VycmVudExlZnRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wdXRlZE9mZnNldCA+PSBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLk1BWF9OT0RFU19QRVJfUk9XKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50RGVwdGgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkT2Zmc2V0ID0gY3VycmVudExlZnRNYXJnaW4gKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudExlZnRPZmZzZXQgPSBjb21wdXRlZE9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlUG9zaXRpb25zVG9JZHNbaV1bal0ubm9kZUlkXS5kZXB0aCA9IGN1cnJlbnREZXB0aDtcbiAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbbm9kZVBvc2l0aW9uc1RvSWRzW2ldW2pdLm5vZGVJZF0ub2Zmc2V0ID0gKGN1cnJlbnRMZWZ0T2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudExlZnRPZmZzZXQgKz0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VycmVudERlcHRoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIGVhY2ggZ3JpZCByZWN0YW5nbGUuXG4gICAgICAgIHZhciB0b3RhbFJvd3MgPSBjdXJyZW50RGVwdGg7XG4gICAgICAgIC8vIFNldCB0b3RhbENvbHVtbnMgdG8gYmUgTUFYX05PREVTX1BFUl9ST1csIHNvIHRoYXQgdGhlIHdpZHRoIG9mIHRoZVxuICAgICAgICAvLyBncmFwaCB2aXN1YWxpemF0aW9uIGNhbiBiZSBjYWxjdWxhdGVkIGJhc2VkIG9uIGEgZml4ZWQgY29uc3RhbnQsXG4gICAgICAgIC8vIE1BWF9OT0RFU19QRVJfUk9XLiBPdGhlcndpc2UsIHRoZSB3aWR0aCBvZiB0aGUgaW5kaXZpZHVhbCBub2RlcyBpc1xuICAgICAgICAvLyBkZXBlbmRlbnQgb24gdGhlIG51bWJlciBvZiBub2RlcyBpbiB0aGUgbG9uZ2VzdCByb3csIGFuZCB0aGlzIG1ha2VzXG4gICAgICAgIC8vIHRoZSBub2RlcyB0b28gd2lkZSBpZiwgZS5nLiwgdGhlIG92ZXJhbGwgZ3JhcGggaXMganVzdCBhIHNpbmdsZVxuICAgICAgICAvLyBjb2x1bW4gd2lkZS5cbiAgICAgICAgdmFyIHRvdGFsQ29sdW1ucyA9IGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuTUFYX05PREVTX1BFUl9ST1c7XG4gICAgICAgIC8vIEhvcml6b250YWwgcGFkZGluZyBiZXR3ZWVuIHRoZSBncmFwaCBhbmQgdGhlIGVkZ2Ugb2YgdGhlIGdyYXBoXG4gICAgICAgIC8vIHZpc3VhbGl6YXRpb24sIG1lYXN1cmVkIGFzIGEgZnJhY3Rpb24gb2YgdGhlIGVudGlyZSBoZWlnaHQuXG4gICAgICAgIHZhciBIT1JJWk9OVEFMX0VER0VfUEFERElOR19GUkFDVElPTiA9IDAuMDU7XG4gICAgICAgIC8vIFZlcnRpY2FsIGVkZ2UgcGFkZGluZyBiZXR3ZWVuIHRoZSBncmFwaCBhbmQgdGhlIGVkZ2Ugb2YgdGhlIGdyYXBoXG4gICAgICAgIC8vIHZpc3VhbGl6YXRpb24sIG1lYXN1cmVkIGFzIGEgZnJhY3Rpb24gb2YgdGhlIGVudGlyZSBoZWlnaHQuXG4gICAgICAgIHZhciBWRVJUSUNBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gPSAwLjE7XG4gICAgICAgIC8vIFRoZSB2ZXJ0aWNhbCBwYWRkaW5nLCBtZWFzdXJlZCBhcyBhIGZyYWN0aW9uIG9mIHRoZSBoZWlnaHQgb2YgYSBncmlkXG4gICAgICAgIC8vIHJlY3RhbmdsZSwgYmV0d2VlbiB0aGUgdG9wIG9mIHRoZSBncmlkIHJlY3RhbmdsZSBhbmQgdGhlIHRvcCBvZiB0aGVcbiAgICAgICAgLy8gbm9kZS4gQW4gZXF1aXZhbGVudCBhbW91bnQgb2YgcGFkZGluZyB3aWxsIGJlIHVzZWQgZm9yIHRoZSBzcGFjZVxuICAgICAgICAvLyBiZXR3ZWVuIHRoZSBib3R0b20gb2YgdGhlIGdyaWQgcmVjdGFuZ2xlIGFuZCB0aGUgYm90dG9tIG9mIHRoZSBub2RlLlxuICAgICAgICB2YXIgR1JJRF9OT0RFX1lfUEFERElOR19GUkFDVElPTiA9IDAuMjtcbiAgICAgICAgLy8gQXMgYWJvdmUsIGJ1dCBmb3IgdGhlIGhvcml6b250YWwgcGFkZGluZy5cbiAgICAgICAgdmFyIEdSSURfTk9ERV9YX1BBRERJTkdfRlJBQ1RJT04gPSAwLjE7XG4gICAgICAgIC8vIFRoZSB2ZXJ0aWNhbCBwYWRkaW5nLCBtZWFzdXJlZCBhcyBhIGZyYWN0aW9uIG9mIHRoZSBoZWlnaHQgb2YgYSBncmlkXG4gICAgICAgIC8vIHJlY3RhbmdsZSwgYmV0d2VlbiB0aGUgdG9wIG9mIHRoZSBub2RlIGFuZCB0aGUgdG9wIG9mIHRoZSBub2RlIGxhYmVsLlxuICAgICAgICAvLyBBbiBlcXVpdmFsZW50IGFtb3VudCBvZiBwYWRkaW5nIHdpbGwgYmUgdXNlZCBmb3IgdGhlIHNwYWNlIGJldHdlZW5cbiAgICAgICAgLy8gdGhlIGJvdHRvbSBvZiB0aGUgbm9kZSBhbmQgdGhlIGJvdHRvbSBvZiB0aGUgbm9kZSBsYWJlbC5cbiAgICAgICAgdmFyIE5PREVfTEFCRUxfWV9QQURESU5HX0ZSQUNUSU9OID0gMC4xNTtcbiAgICAgICAgLy8gQXMgYWJvdmUsIGJ1dCBmb3IgdGhlIGhvcml6b250YWwgcGFkZGluZy5cbiAgICAgICAgdmFyIE5PREVfTEFCRUxfWF9QQURESU5HX0ZSQUNUSU9OID0gMC4wNTtcbiAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGhvcml6b250YWwgcG9zaXRpb24sIGluIHRlcm1zIG9mIGFcbiAgICAgICAgLy8gZnJhY3Rpb24gb2YgdGhlIHRvdGFsIHdpZHRoLCBnaXZlbiBhIGhvcml6b250YWwgb2Zmc2V0IGluIHRlcm1zIG9mXG4gICAgICAgIC8vIGdyaWQgcmVjdGFuZ2xlcy5cbiAgICAgICAgdmFyIGdldEhvcml6b250YWxQb3NpdGlvbiA9IGZ1bmN0aW9uIChvZmZzZXRJbkdyaWRSZWN0YW5nbGVzKSB7XG4gICAgICAgICAgICB2YXIgZnJhY3Rpb25hbEdyaWRXaWR0aCA9ICgoMS4wIC0gSE9SSVpPTlRBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gKiAyKSAvIHRvdGFsQ29sdW1ucyk7XG4gICAgICAgICAgICByZXR1cm4gKEhPUklaT05UQUxfRURHRV9QQURESU5HX0ZSQUNUSU9OICtcbiAgICAgICAgICAgICAgICBmcmFjdGlvbmFsR3JpZFdpZHRoICogb2Zmc2V0SW5HcmlkUmVjdGFuZ2xlcyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSB2ZXJ0aWNhbCBwb3NpdGlvbiwgaW4gdGVybXMgb2YgYVxuICAgICAgICAvLyBmcmFjdGlvbiBvZiB0aGUgdG90YWwgaGVpZ2h0LCBnaXZlbiBhIHZlcnRpY2FsIG9mZnNldCBpbiB0ZXJtcyBvZlxuICAgICAgICAvLyBncmlkIHJlY3RhbmdsZXMuXG4gICAgICAgIHZhciBnZXRWZXJ0aWNhbFBvc2l0aW9uID0gZnVuY3Rpb24gKG9mZnNldEluR3JpZFJlY3RhbmdsZXMpIHtcbiAgICAgICAgICAgIHZhciBmcmFjdGlvbmFsR3JpZEhlaWdodCA9ICgoMS4wIC0gVkVSVElDQUxfRURHRV9QQURESU5HX0ZSQUNUSU9OICogMikgLyB0b3RhbFJvd3MpO1xuICAgICAgICAgICAgcmV0dXJuIChWRVJUSUNBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gK1xuICAgICAgICAgICAgICAgIGZyYWN0aW9uYWxHcmlkSGVpZ2h0ICogb2Zmc2V0SW5HcmlkUmVjdGFuZ2xlcyk7XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS55MCA9IGdldFZlcnRpY2FsUG9zaXRpb24obm9kZURhdGFbbm9kZUlkXS5kZXB0aCArIEdSSURfTk9ERV9ZX1BBRERJTkdfRlJBQ1RJT04pO1xuICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS54MCA9IGdldEhvcml6b250YWxQb3NpdGlvbihub2RlRGF0YVtub2RlSWRdLm9mZnNldCArIEdSSURfTk9ERV9YX1BBRERJTkdfRlJBQ1RJT04pO1xuICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS55TGFiZWwgPSBnZXRWZXJ0aWNhbFBvc2l0aW9uKG5vZGVEYXRhW25vZGVJZF0uZGVwdGggKyAwLjUpO1xuICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS54TGFiZWwgPSBnZXRIb3Jpem9udGFsUG9zaXRpb24obm9kZURhdGFbbm9kZUlkXS5vZmZzZXQgKyAwLjUpO1xuICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS5oZWlnaHQgPSAoKDEuMCAtIFZFUlRJQ0FMX0VER0VfUEFERElOR19GUkFDVElPTiAqIDIpIC8gdG90YWxSb3dzKSAqICgxLjAgLSBHUklEX05PREVfWV9QQURESU5HX0ZSQUNUSU9OICogMik7XG4gICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLndpZHRoID0gKCgxLjAgLSBIT1JJWk9OVEFMX0VER0VfUEFERElOR19GUkFDVElPTiAqIDIpIC8gdG90YWxDb2x1bW5zKSAqICgxLjAgLSBHUklEX05PREVfWF9QQURESU5HX0ZSQUNUSU9OICogMik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQXNzaWduIGlkIGFuZCBsYWJlbCB0byBlYWNoIG5vZGUuXG4gICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS5pZCA9IG5vZGVJZDtcbiAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF0ubGFiZWwgPSBub2Rlc1tub2RlSWRdO1xuICAgICAgICB9XG4gICAgICAgIC8vIE1hcmsgbm9kZXMgdGhhdCBhcmUgcmVhY2hhYmxlIGZyb20gYW55IGVuZCBzdGF0ZSB2aWEgYmFja3dhcmQgbGlua3MuXG4gICAgICAgIHF1ZXVlID0gZmluYWxOb2RlSWRzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbmFsTm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZURhdGFbZmluYWxOb2RlSWRzW2ldXS5yZWFjaGFibGVGcm9tRW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGN1cnJOb2RlSWQgPSBxdWV1ZVswXTtcbiAgICAgICAgICAgIHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmtzW2ldLnRhcmdldCA9PT0gY3Vyck5vZGVJZCAmJlxuICAgICAgICAgICAgICAgICAgICAhbm9kZURhdGFbbGlua3NbaV0uc291cmNlXS5yZWFjaGFibGVGcm9tRW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW2xpbmtzW2ldLnNvdXJjZV0ucmVhY2hhYmxlRnJvbUVuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2gobGlua3NbaV0uc291cmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0Q29tcHV0ZWRBcnJhbmdlbWVudCA9IGNsb25lRGVlcF8xLmRlZmF1bHQobm9kZURhdGEpO1xuICAgICAgICByZXR1cm4gbm9kZURhdGE7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlIHRoZSByZXR1cm4gdHlwZSBpcyBhIGNvbXBsZXggZGljdCB3aG9zZSBleGFjdCB0eXBlIG5lZWRzIHRvXG4gICAgLy8gYmUgcmVzZWFyY2hlZC5cbiAgICBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5wcm90b3R5cGUuZ2V0TGFzdENvbXB1dGVkQXJyYW5nZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjbG9uZURlZXBfMS5kZWZhdWx0KHRoaXMubGFzdENvbXB1dGVkQXJyYW5nZW1lbnQpO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnbm9kZURhdGEnIGlzIGEgY29tcGxleCBkaWN0IHdob3NlIGV4YWN0IHR5cGUgbmVlZHMgdG9cbiAgICAvLyBiZSByZXNlYXJjaGVkLlxuICAgIFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlLnByb3RvdHlwZS5nZXRHcmFwaEJvdW5kYXJpZXMgPSBmdW5jdGlvbiAobm9kZURhdGEpIHtcbiAgICAgICAgdmFyIElORklOSVRZID0gMWUzMDtcbiAgICAgICAgdmFyIEJPUkRFUl9QQURESU5HID0gNTtcbiAgICAgICAgdmFyIGxlZnRFZGdlID0gSU5GSU5JVFk7XG4gICAgICAgIHZhciB0b3BFZGdlID0gSU5GSU5JVFk7XG4gICAgICAgIHZhciBib3R0b21FZGdlID0gLUlORklOSVRZO1xuICAgICAgICB2YXIgcmlnaHRFZGdlID0gLUlORklOSVRZO1xuICAgICAgICBmb3IgKHZhciBub2RlSWQgaW4gbm9kZURhdGEpIHtcbiAgICAgICAgICAgIGxlZnRFZGdlID0gTWF0aC5taW4obm9kZURhdGFbbm9kZUlkXS54MCAtIEJPUkRFUl9QQURESU5HLCBsZWZ0RWRnZSk7XG4gICAgICAgICAgICB0b3BFZGdlID0gTWF0aC5taW4obm9kZURhdGFbbm9kZUlkXS55MCAtIEJPUkRFUl9QQURESU5HLCB0b3BFZGdlKTtcbiAgICAgICAgICAgIHJpZ2h0RWRnZSA9IE1hdGgubWF4KG5vZGVEYXRhW25vZGVJZF0ueDAgKyBCT1JERVJfUEFERElORyArIG5vZGVEYXRhW25vZGVJZF0ud2lkdGgsIHJpZ2h0RWRnZSk7XG4gICAgICAgICAgICBib3R0b21FZGdlID0gTWF0aC5tYXgobm9kZURhdGFbbm9kZUlkXS55MCArIEJPUkRFUl9QQURESU5HICsgbm9kZURhdGFbbm9kZUlkXS5oZWlnaHQsIGJvdHRvbUVkZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBib3R0b206IGJvdHRvbUVkZ2UsXG4gICAgICAgICAgICBsZWZ0OiBsZWZ0RWRnZSxcbiAgICAgICAgICAgIHJpZ2h0OiByaWdodEVkZ2UsXG4gICAgICAgICAgICB0b3A6IHRvcEVkZ2VcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8vIFRPRE8oIzcxNjUpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ25vZGVEYXRhJyBpcyBhIGNvbXBsZXggZGljdCB3aG9zZSBleGFjdCB0eXBlIG5lZWRzIHRvXG4gICAgLy8gYmUgcmVzZWFyY2hlZC4gU2FtZSBnb2VzIGZvciAnbm9kZUxpbmtzJyBhbmQgdGhlIHJldHVybiB0eXBlLlxuICAgIFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlLnByb3RvdHlwZS5nZXRBdWdtZW50ZWRMaW5rcyA9IGZ1bmN0aW9uIChub2RlRGF0YSwgbm9kZUxpbmtzKSB7XG4gICAgICAgIHZhciBsaW5rcyA9IGNsb25lRGVlcF8xLmRlZmF1bHQobm9kZUxpbmtzKTtcbiAgICAgICAgdmFyIGF1Z21lbnRlZExpbmtzID0gbGlua3MubWFwKGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogY2xvbmVEZWVwXzEuZGVmYXVsdChub2RlRGF0YVtsaW5rLnNvdXJjZV0pLFxuICAgICAgICAgICAgICAgIHRhcmdldDogY2xvbmVEZWVwXzEuZGVmYXVsdChub2RlRGF0YVtsaW5rLnRhcmdldF0pXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdWdtZW50ZWRMaW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGxpbmsgPSBhdWdtZW50ZWRMaW5rc1tpXTtcbiAgICAgICAgICAgIGlmIChsaW5rLnNvdXJjZS5sYWJlbCAhPT0gbGluay50YXJnZXQubGFiZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNleCA9IGxpbmsuc291cmNlLnhMYWJlbDtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNleSA9IGxpbmsuc291cmNlLnlMYWJlbDtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0eCA9IGxpbmsudGFyZ2V0LnhMYWJlbDtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0eSA9IGxpbmsudGFyZ2V0LnlMYWJlbDtcbiAgICAgICAgICAgICAgICBpZiAoc291cmNleCA9PT0gdGFyZ2V0eCAmJiBzb3VyY2V5ID09PSB0YXJnZXR5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogSW52ZXN0aWdhdGUgd2h5IHRoaXMgaGFwcGVucy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc291cmNlV2lkdGggPSBsaW5rLnNvdXJjZS53aWR0aDtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlSGVpZ2h0ID0gbGluay5zb3VyY2UuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRXaWR0aCA9IGxpbmsudGFyZ2V0LndpZHRoO1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRIZWlnaHQgPSBsaW5rLnRhcmdldC5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgdmFyIGR4ID0gdGFyZ2V0eCAtIHNvdXJjZXg7XG4gICAgICAgICAgICAgICAgdmFyIGR5ID0gdGFyZ2V0eSAtIHNvdXJjZXk7XG4gICAgICAgICAgICAgICAgLyogRnJhY3Rpb25hbCBhbW91bnQgb2YgdHJ1bmNhdGlvbiB0byBiZSBhcHBsaWVkIHRvIHRoZSBlbmQgb2ZcbiAgICAgICAgICAgICAgICAgICBlYWNoIGxpbmsuICovXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0Q3V0b2ZmID0gKHNvdXJjZVdpZHRoIC8gMikgLyBNYXRoLmFicyhkeCk7XG4gICAgICAgICAgICAgICAgdmFyIGVuZEN1dG9mZiA9ICh0YXJnZXRXaWR0aCAvIDIpIC8gTWF0aC5hYnMoZHgpO1xuICAgICAgICAgICAgICAgIGlmIChkeCA9PT0gMCB8fCBkeSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFydEN1dG9mZiA9ICgoZHggPT09IDApID8gKHNvdXJjZUhlaWdodCAvIDIpIC8gTWF0aC5hYnMoZHkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKHN0YXJ0Q3V0b2ZmLCAoc291cmNlSGVpZ2h0IC8gMikgLyBNYXRoLmFicyhkeSkpKTtcbiAgICAgICAgICAgICAgICAgICAgZW5kQ3V0b2ZmID0gKChkeCA9PT0gMCkgPyAodGFyZ2V0SGVpZ2h0IC8gMikgLyBNYXRoLmFicyhkeSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oZW5kQ3V0b2ZmLCAodGFyZ2V0SGVpZ2h0IC8gMikgLyBNYXRoLmFicyhkeSkpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGR4cGVycCA9IHRhcmdldHkgLSBzb3VyY2V5O1xuICAgICAgICAgICAgICAgIHZhciBkeXBlcnAgPSBzb3VyY2V4IC0gdGFyZ2V0eDtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybSA9IE1hdGguc3FydChkeHBlcnAgKiBkeHBlcnAgKyBkeXBlcnAgKiBkeXBlcnApO1xuICAgICAgICAgICAgICAgIGR4cGVycCAvPSBub3JtO1xuICAgICAgICAgICAgICAgIGR5cGVycCAvPSBub3JtO1xuICAgICAgICAgICAgICAgIHZhciBtaWR4ID0gc291cmNleCArIGR4IC8gMiArIGR4cGVycCAqIChzb3VyY2VIZWlnaHQgLyA0KTtcbiAgICAgICAgICAgICAgICB2YXIgbWlkeSA9IHNvdXJjZXkgKyBkeSAvIDIgKyBkeXBlcnAgKiAodGFyZ2V0SGVpZ2h0IC8gNCk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0eCA9IHNvdXJjZXggKyBzdGFydEN1dG9mZiAqIGR4O1xuICAgICAgICAgICAgICAgIHZhciBzdGFydHkgPSBzb3VyY2V5ICsgc3RhcnRDdXRvZmYgKiBkeTtcbiAgICAgICAgICAgICAgICB2YXIgZW5keCA9IHRhcmdldHggLSBlbmRDdXRvZmYgKiBkeDtcbiAgICAgICAgICAgICAgICB2YXIgZW5keSA9IHRhcmdldHkgLSBlbmRDdXRvZmYgKiBkeTtcbiAgICAgICAgICAgICAgICAvLyBEcmF3IGEgcXVhZHJhdGljIGJlemllciBjdXJ2ZS5cbiAgICAgICAgICAgICAgICBhdWdtZW50ZWRMaW5rc1tpXS5kID0gKCdNJyArIHN0YXJ0eCArICcgJyArIHN0YXJ0eSArICcgUSAnICsgbWlkeCArICcgJyArIG1pZHkgK1xuICAgICAgICAgICAgICAgICAgICAnICcgKyBlbmR4ICsgJyAnICsgZW5keSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF1Z21lbnRlZExpbmtzO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnbm9kZURhdGEnIGlzIGEgY29tcGxleCBkaWN0IHdob3NlIGV4YWN0IHR5cGUgbmVlZHMgdG9cbiAgICAvLyBiZSByZXNlYXJjaGVkLiBTYW1lIGdvZXMgZm9yIHRoZSByZXR1cm4gdHlwZS5cbiAgICBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5wcm90b3R5cGUubW9kaWZ5UG9zaXRpb25WYWx1ZXMgPSBmdW5jdGlvbiAobm9kZURhdGEsIGdyYXBoV2lkdGgsIGdyYXBoSGVpZ2h0KSB7XG4gICAgICAgIHZhciBIT1JJWk9OVEFMX05PREVfUFJPUEVSVElFUyA9IFsneDAnLCAnd2lkdGgnLCAneExhYmVsJ107XG4gICAgICAgIHZhciBWRVJUSUNBTF9OT0RFX1BST1BFUlRJRVMgPSBbJ3kwJywgJ2hlaWdodCcsICd5TGFiZWwnXTtcbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBwb3NpdGlvbiB2YWx1ZXMgaW4gbm9kZURhdGEgdG8gdXNlIHBpeGVscy5cbiAgICAgICAgZm9yICh2YXIgbm9kZUlkIGluIG5vZGVEYXRhKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IEhPUklaT05UQUxfTk9ERV9QUk9QRVJUSUVTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXVtIT1JJWk9OVEFMX05PREVfUFJPUEVSVElFU1tpXV0gPSAoZ3JhcGhXaWR0aCAqXG4gICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF1bSE9SSVpPTlRBTF9OT0RFX1BST1BFUlRJRVNbaV1dKTtcbiAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdW1ZFUlRJQ0FMX05PREVfUFJPUEVSVElFU1tpXV0gPSAoZ3JhcGhIZWlnaHQgKlxuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdW1ZFUlRJQ0FMX05PREVfUFJPUEVSVElFU1tpXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlRGF0YTtcbiAgICB9O1xuICAgIFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlLnByb3RvdHlwZS5nZXRHcmFwaFdpZHRoID0gZnVuY3Rpb24gKG1heE5vZGVzUGVyUm93LCBtYXhOb2RlTGFiZWxMZW5ndGgpIHtcbiAgICAgICAgLy8gQSByb3VnaCB1cHBlciBib3VuZCBmb3IgdGhlIHdpZHRoIG9mIGEgc2luZ2xlIGxldHRlciwgaW4gcGl4ZWxzLFxuICAgICAgICAvLyB0byB1c2UgYXMgYSBzY2FsaW5nIGZhY3RvciB0byBkZXRlcm1pbmUgdGhlIHdpZHRoIG9mIGdyYXBoIG5vZGVzLlxuICAgICAgICAvLyBUaGlzIGlzIG5vdCBhbiBlbnRpcmVseSBhY2N1cmF0ZSBkZXNjcmlwdGlvbiBiZWNhdXNlIGl0IGFsc28gdGFrZXNcbiAgICAgICAgLy8gaW50byBhY2NvdW50IHRoZSBob3Jpem9udGFsIHdoaXRlc3BhY2UgYmV0d2VlbiBncmFwaCBub2Rlcy5cbiAgICAgICAgdmFyIGxldHRlcldpZHRoSW5QaXhlbHMgPSAxMC41O1xuICAgICAgICByZXR1cm4gbWF4Tm9kZXNQZXJSb3cgKiBtYXhOb2RlTGFiZWxMZW5ndGggKiBsZXR0ZXJXaWR0aEluUGl4ZWxzO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnbm9kZURhdGEnIGlzIGEgY29tcGxleCBkaWN0IHdob3NlIGV4YWN0IHR5cGUgbmVlZHMgdG9cbiAgICAvLyBiZSByZXNlYXJjaGVkLlxuICAgIFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlLnByb3RvdHlwZS5nZXRHcmFwaEhlaWdodCA9IGZ1bmN0aW9uIChub2RlRGF0YSkge1xuICAgICAgICB2YXIgbWF4RGVwdGggPSAwO1xuICAgICAgICBmb3IgKHZhciBub2RlSWQgaW4gbm9kZURhdGEpIHtcbiAgICAgICAgICAgIG1heERlcHRoID0gTWF0aC5tYXgobWF4RGVwdGgsIG5vZGVEYXRhW25vZGVJZF0uZGVwdGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA3MC4wICogKG1heERlcHRoICsgMSk7XG4gICAgfTtcbiAgICBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZSk7XG4gICAgcmV0dXJuIFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuU3RhdGVHcmFwaExheW91dFNlcnZpY2UgPSBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZTtcbi8vIFNlcnZpY2UgZm9yIGNvbXB1dGluZyBsYXlvdXQgb2Ygc3RhdGUgZ3JhcGggbm9kZXMuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTdGF0ZUdyYXBoTGF5b3V0U2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoU3RhdGVHcmFwaExheW91dFNlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udmVydFRvUGxhaW5UZXh0IGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignY29udmVydFRvUGxhaW5UZXh0JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHN0cmlwcGVkVGV4dCA9IGlucHV0LnJlcGxhY2UoLyg8KFtePl0rKT4pL2lnLCAnJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJm5ic3A7L2lnLCAnICcpO1xuICAgICAgICAgICAgc3RyaXBwZWRUZXh0ID0gc3RyaXBwZWRUZXh0LnJlcGxhY2UoLyZxdW90Oy9pZywgJycpO1xuICAgICAgICAgICAgdmFyIHRyaW1tZWRUZXh0ID0gc3RyaXBwZWRUZXh0LnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkVGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyaXBwZWRUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWRUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVHJ1bmNhdGUgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NvbnZlcnQtdG8tcGxhaW4tdGV4dC5maWx0ZXIudHMnKTtcbi8vIEZpbHRlciB0aGF0IHRydW5jYXRlcyBsb25nIGRlc2NyaXB0b3JzLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmlsdGVyKCd0cnVuY2F0ZScsIFsnJGZpbHRlcicsIGZ1bmN0aW9uICgkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQsIGxlbmd0aCwgc3VmZml4KSB7XG4gICAgICAgICAgICBpZiAoIWlucHV0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzTmFOKGxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICBsZW5ndGggPSA3MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdWZmaXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN1ZmZpeCA9ICcuLi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzU3RyaW5nKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gU3RyaW5nKGlucHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlucHV0ID0gJGZpbHRlcignY29udmVydFRvUGxhaW5UZXh0JykoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dC5sZW5ndGggPD0gbGVuZ3RoID8gaW5wdXQgOiAoaW5wdXQuc3Vic3RyaW5nKDAsIGxlbmd0aCAtIHN1ZmZpeC5sZW5ndGgpICsgc3VmZml4KSk7XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBhY3Rpdml0aWVzIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwgd2hlbiBPcHBpYVxuICogaXMgaW4gZGV2ZWxvcGVyIG1vZGUuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9vYmplY3RzL051bWJlcldpdGhVbml0c09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2Uvc2VydmljZXMvYWRtaW4tZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL3NlcnZpY2VzL2FkbWluLXRhc2stbWFuYWdlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhZG1pbkRldk1vZGVBY3Rpdml0aWVzVGFiJywgW1xuICAgICckaHR0cCcsICckd2luZG93JywgJ0FkbWluRGF0YVNlcnZpY2UnLCAnQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdBRE1JTl9IQU5ETEVSX1VSTCcsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkd2luZG93LCBBZG1pbkRhdGFTZXJ2aWNlLCBBZG1pblRhc2tNYW5hZ2VyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEFETUlOX0hBTkRMRVJfVVJMKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIHNldFN0YXR1c01lc3NhZ2U6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2FkbWluLXBhZ2UvYWN0aXZpdGllcy10YWIvJyArXG4gICAgICAgICAgICAgICAgJ2FkbWluLWRldi1tb2RlLWFjdGl2aXRpZXMtdGFiLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVsb2FkRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmlzVGFza1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHdpbmRvdy5jb25maXJtKCdUaGlzIGFjdGlvbiBpcyBpcnJldmVyc2libGUuIEFyZSB5b3Ugc3VyZT8nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnUHJvY2Vzc2luZy4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2Uuc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KEFETUlOX0hBTkRMRVJfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVsb2FkX2V4cGxvcmF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogU3RyaW5nKGV4cGxvcmF0aW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ0RhdGEgcmVsb2FkZWQgc3VjY2Vzc2Z1bGx5LicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm51bUR1bW15RXhwc1RvUHVibGlzaCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubnVtRHVtbXlFeHBzVG9HZW5lcmF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuREVNT19DT0xMRUNUSU9OUyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkRFTU9fRVhQTE9SQVRJT05TID0ge307XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVsb2FkaW5nQWxsRXhwbG9yYXRpb25Qb3NzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVtb0V4cGxvcmF0aW9uSWRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVsb2FkQWxsRXhwbG9yYXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsLnJlbG9hZGluZ0FsbEV4cGxvcmF0aW9uUG9zc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuaXNUYXNrUnVubmluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkd2luZG93LmNvbmZpcm0oJ1RoaXMgYWN0aW9uIGlzIGlycmV2ZXJzaWJsZS4gQXJlIHlvdSBzdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdQcm9jZXNzaW5nLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5zdGFydFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBudW1TdWNjZWVkZWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG51bUZhaWxlZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnVtVHJpZWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByaW50UmVzdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1UcmllZCA8IGRlbW9FeHBsb3JhdGlvbklkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdQcm9jZXNzaW5nLi4uJyArIG51bVRyaWVkICsgJy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbW9FeHBsb3JhdGlvbklkcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnUmVsb2FkZWQgJyArIGRlbW9FeHBsb3JhdGlvbklkcy5sZW5ndGggK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIGV4cGxvcmF0aW9uczogJyArIG51bVN1Y2NlZWRlZCArICcgc3VjY2VlZGVkLCAnICsgbnVtRmFpbGVkICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyBmYWlsZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuZmluaXNoVGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVtb0V4cGxvcmF0aW9uSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBkZW1vRXhwbG9yYXRpb25JZHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdyZWxvYWRfZXhwbG9yYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK251bVN1Y2NlZWRlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1UcmllZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRSZXN1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrbnVtRmFpbGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK251bVRyaWVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludFJlc3VsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBBZG1pbkRhdGFTZXJ2aWNlLmdldERhdGFBc3luYygpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLkRFTU9fRVhQTE9SQVRJT05TID0gcmVzcG9uc2UuZGVtb19leHBsb3JhdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLkRFTU9fQ09MTEVDVElPTlMgPSByZXNwb25zZS5kZW1vX2NvbGxlY3Rpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVtb0V4cGxvcmF0aW9uSWRzID0gcmVzcG9uc2UuZGVtb19leHBsb3JhdGlvbl9pZHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnJlbG9hZGluZ0FsbEV4cGxvcmF0aW9uUG9zc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZW5lcmF0ZUR1bW15RXhwbG9yYXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgZHVtbXkgZXhwbG9yYXRpb25zIHdpdGggcmFuZG9tIHRpdGxlLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwubnVtRHVtbXlFeHBzVG9QdWJsaXNoID4gY3RybC5udW1EdW1teUV4cHNUb0dlbmVyYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdQdWJsaXNoIGNvdW50IHNob3VsZCBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gZ2VuZXJhdGUgY291bnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5zdGFydFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnUHJvY2Vzc2luZy4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dlbmVyYXRlX2R1bW15X2V4cGxvcmF0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtX2R1bW15X2V4cHNfdG9fZ2VuZXJhdGU6IGN0cmwubnVtRHVtbXlFeHBzVG9HZW5lcmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1fZHVtbXlfZXhwc190b19wdWJsaXNoOiBjdHJsLm51bUR1bW15RXhwc1RvUHVibGlzaFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdEdW1teSBleHBsb3JhdGlvbnMgZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVsb2FkQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5pc1Rhc2tSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISR3aW5kb3cuY29uZmlybSgnVGhpcyBhY3Rpb24gaXMgaXJyZXZlcnNpYmxlLiBBcmUgeW91IHN1cmU/JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1Byb2Nlc3NpbmcuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLnN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3JlbG9hZF9jb2xsZWN0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uX2lkOiBTdHJpbmcoY29sbGVjdGlvbklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdEYXRhIHJlbG9hZGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYWN0aXZpdGllcyB0YWIgaW4gdGhlIGFkbWluIHBhbmVsIHdoZW4gT3BwaWFcbiAqIGlzIGluIHByb2R1Y3Rpb24gbW9kZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhZG1pblByb2RNb2RlQWN0aXZpdGllc1RhYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2FkbWluLXBhZ2UvYWN0aXZpdGllcy10YWIvJyArXG4gICAgICAgICAgICAgICAgJ2FkbWluLXByb2QtbW9kZS1hY3Rpdml0aWVzLXRhYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgT3BwaWEgYWRtaW4gcGFnZS5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIGFkbWluX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLmNvbnN0YW50c1wiKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdBRE1JTl9ST0xFX0hBTkRMRVJfVVJMJywgYWRtaW5fcGFnZV9jb25zdGFudHNfMS5BZG1pblBhZ2VDb25zdGFudHMuQURNSU5fUk9MRV9IQU5ETEVSX1VSTCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQURNSU5fSEFORExFUl9VUkwnLCBhZG1pbl9wYWdlX2NvbnN0YW50c18xLkFkbWluUGFnZUNvbnN0YW50cy5BRE1JTl9IQU5ETEVSX1VSTCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQURNSU5fVE9QSUNTX0NTVl9ET1dOTE9BRF9IQU5ETEVSX1VSTCcsIGFkbWluX3BhZ2VfY29uc3RhbnRzXzEuQWRtaW5QYWdlQ29uc3RhbnRzLkFETUlOX1RPUElDU19DU1ZfRE9XTkxPQURfSEFORExFUl9VUkwpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0FETUlOX0pPQl9PVVRQVVRfVVJMX1RFTVBMQVRFJywgYWRtaW5fcGFnZV9jb25zdGFudHNfMS5BZG1pblBhZ2VDb25zdGFudHMuQURNSU5fSk9CX09VVFBVVF9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0FETUlOX1RBQl9VUkxTJywgYWRtaW5fcGFnZV9jb25zdGFudHNfMS5BZG1pblBhZ2VDb25zdGFudHMuQURNSU5fVEFCX1VSTFMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1BST0ZJTEVfVVJMX1RFTVBMQVRFJywgYWRtaW5fcGFnZV9jb25zdGFudHNfMS5BZG1pblBhZ2VDb25zdGFudHMuUFJPRklMRV9VUkxfVEVNUExBVEUpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRoZSBPcHBpYSBhZG1pbiBwYWdlLlxuICovXG52YXIgQWRtaW5QYWdlQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkbWluUGFnZUNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgQWRtaW5QYWdlQ29uc3RhbnRzLkFETUlOX1JPTEVfSEFORExFUl9VUkwgPSAnL2FkbWlucm9sZWhhbmRsZXInO1xuICAgIEFkbWluUGFnZUNvbnN0YW50cy5BRE1JTl9IQU5ETEVSX1VSTCA9ICcvYWRtaW5oYW5kbGVyJztcbiAgICBBZG1pblBhZ2VDb25zdGFudHMuQURNSU5fVE9QSUNTX0NTVl9ET1dOTE9BRF9IQU5ETEVSX1VSTCA9ICcvYWRtaW50b3BpY3Njc3Zkb3dubG9hZGhhbmRsZXInO1xuICAgIEFkbWluUGFnZUNvbnN0YW50cy5BRE1JTl9KT0JfT1VUUFVUX1VSTF9URU1QTEFURSA9ICcvYWRtaW5qb2JvdXRwdXQ/am9iX2lkPTxqb2JJZD4nO1xuICAgIEFkbWluUGFnZUNvbnN0YW50cy5BRE1JTl9UQUJfVVJMUyA9IHtcbiAgICAgICAgQUNUSVZJVElFUzogJyNhY3Rpdml0aWVzJyxcbiAgICAgICAgSk9CUzogJyNqb2JzJyxcbiAgICAgICAgQ09ORklHOiAnI2NvbmZpZycsXG4gICAgICAgIFJPTEVTOiAnI3JvbGVzJyxcbiAgICAgICAgTUlTQzogJyNtaXNjJ1xuICAgIH07XG4gICAgQWRtaW5QYWdlQ29uc3RhbnRzLlBST0ZJTEVfVVJMX1RFTVBMQVRFID0gJy9wcm9maWxlLzx1c2VybmFtZT4nO1xuICAgIHJldHVybiBBZG1pblBhZ2VDb25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5BZG1pblBhZ2VDb25zdGFudHMgPSBBZG1pblBhZ2VDb25zdGFudHM7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERhdGEgYW5kIGRpcmVjdGl2ZSBmb3IgdGhlIE9wcGlhIGFkbWluIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RpcmVjdGl2ZXMvZm9jdXMtb24uZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL25hdmJhci9hZG1pbi1uYXZiYXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FjdGl2aXRpZXMtdGFiL2FkbWluLWRldi1tb2RlLWFjdGl2aXRpZXMtdGFiLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hY3Rpdml0aWVzLXRhYi8nICtcbiAgICAnYWRtaW4tcHJvZC1tb2RlLWFjdGl2aXRpZXMtdGFiLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9jb25maWctdGFiL2FkbWluLWNvbmZpZy10YWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2pvYnMtdGFiL2FkbWluLWpvYnMtdGFiLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9taXNjLXRhYi9hZG1pbi1taXNjLXRhYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2Uvcm9sZXMtdGFiL2FkbWluLXJvbGVzLXRhYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3ZhbHVlX2dlbmVyYXRvcnMvdmFsdWVHZW5lcmF0b3JzUmVxdWlyZXMudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9vYmplY3RzL051bWJlcldpdGhVbml0c09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2Uvc2VydmljZXMvYWRtaW4tZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL3NlcnZpY2VzL2FkbWluLXJvdXRlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Dc3JmVG9rZW5TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9VdGlsc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYWRtaW5QYWdlJywgWydVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJGh0dHAnLCAnJGxvY2F0aW9uJywgJyRzY29wZScsICdBZG1pbkRhdGFTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnQWRtaW5Sb3V0ZXJTZXJ2aWNlJywgJ0NzcmZUb2tlblNlcnZpY2UnLCAnREVWX01PREUnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkaHR0cCwgJGxvY2F0aW9uLCAkc2NvcGUsIEFkbWluRGF0YVNlcnZpY2UsIEFkbWluUm91dGVyU2VydmljZSwgQ3NyZlRva2VuU2VydmljZSwgREVWX01PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJFbWFpbCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBBZG1pbkRhdGFTZXJ2aWNlLmdldERhdGFBc3luYygpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJFbWFpbCA9IHJlc3BvbnNlLnVzZXJfZW1haWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmluRGV2TW9kZSA9IERFVl9NT0RFO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YXR1c01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0FjdGl2aXRpZXNUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzQWN0aXZpdGllc1RhYk9wZW47XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNKb2JzVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc0pvYnNUYWJPcGVuO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzQ29uZmlnVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc0NvbmZpZ1RhYk9wZW47XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNSb2xlc1RhYk9wZW4gPSBBZG1pblJvdXRlclNlcnZpY2UuaXNSb2xlc1RhYk9wZW47XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNNaXNjVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc01pc2NUYWJPcGVuO1xuICAgICAgICAgICAgICAgICAgICBDc3JmVG9rZW5TZXJ2aWNlLmluaXRpYWxpemVUb2tlbigpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UgPSBmdW5jdGlvbiAoc3RhdHVzTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGF0dXNNZXNzYWdlID0gc3RhdHVzTWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluUm91dGVyU2VydmljZS5zaG93VGFiKCRsb2NhdGlvbi5wYXRoKCkucmVwbGFjZSgnLycsICcjJykpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGFkbWluIHBhZ2UuXG4gKi9cbnJlcXVpcmUoXCJjb3JlLWpzL2VzNy9yZWZsZWN0XCIpO1xucmVxdWlyZShcInpvbmUuanNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgaHR0cF8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvbW1vbi9odHRwXCIpO1xuLy8gVGhpcyBjb21wb25lbnQgaXMgbmVlZGVkIHRvIGZvcmNlLWJvb3RzdHJhcCBBbmd1bGFyIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4vLyBhcHAuXG52YXIgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KCkge1xuICAgIH1cbiAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5Db21wb25lbnQoe1xuICAgICAgICAgICAgc2VsZWN0b3I6ICdzZXJ2aWNlLWJvb3RzdHJhcCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJydcbiAgICAgICAgfSlcbiAgICBdLCBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KTtcbiAgICByZXR1cm4gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbn0oKSk7XG5leHBvcnRzLlNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xudmFyIGFwcF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJhcHAuY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBzZXJ2aWNlc19jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJzZXJ2aWNlcy9zZXJ2aWNlcy5jb25zdGFudHNcIik7XG52YXIgYWRtaW5fcGFnZV9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJwYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29uc3RhbnRzXCIpO1xudmFyIEFkbWluUGFnZU1vZHVsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZG1pblBhZ2VNb2R1bGUoKSB7XG4gICAgfVxuICAgIC8vIEVtcHR5IHBsYWNlaG9sZGVyIG1ldGhvZCB0byBzYXRpc2Z5IHRoZSBgQ29tcGlsZXJgLlxuICAgIEFkbWluUGFnZU1vZHVsZS5wcm90b3R5cGUubmdEb0Jvb3RzdHJhcCA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICBBZG1pblBhZ2VNb2R1bGUgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLk5nTW9kdWxlKHtcbiAgICAgICAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybV9icm93c2VyXzEuQnJvd3Nlck1vZHVsZSxcbiAgICAgICAgICAgICAgICBodHRwXzEuSHR0cENsaWVudE1vZHVsZVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgICAgICAgICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBlbnRyeUNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgICAgICAgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbnNfZXh0ZW5zaW9uX2NvbnN0YW50c18xLkludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgb2JqZWN0c19kb21haW5fY29uc3RhbnRzXzEuT2JqZWN0c0RvbWFpbkNvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlc19jb25zdGFudHNfMS5TZXJ2aWNlc0NvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBhZG1pbl9wYWdlX2NvbnN0YW50c18xLkFkbWluUGFnZUNvbnN0YW50c1xuICAgICAgICAgICAgXVxuICAgICAgICB9KVxuICAgIF0sIEFkbWluUGFnZU1vZHVsZSk7XG4gICAgcmV0dXJuIEFkbWluUGFnZU1vZHVsZTtcbn0oKSk7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljXCIpO1xudmFyIHN0YXRpY18yID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGJvb3RzdHJhcEZuID0gZnVuY3Rpb24gKGV4dHJhUHJvdmlkZXJzKSB7XG4gICAgdmFyIHBsYXRmb3JtUmVmID0gcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEucGxhdGZvcm1Ccm93c2VyRHluYW1pYyhleHRyYVByb3ZpZGVycyk7XG4gICAgcmV0dXJuIHBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZShBZG1pblBhZ2VNb2R1bGUpO1xufTtcbnZhciBkb3duZ3JhZGVkTW9kdWxlID0gc3RhdGljXzIuZG93bmdyYWRlTW9kdWxlKGJvb3RzdHJhcEZuKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScsIFtcbiAgICAnZG5kTGlzdHMnLCAnaGVhZHJvb20nLCAnaW5maW5pdGUtc2Nyb2xsJywgJ25nQW5pbWF0ZScsXG4gICAgJ25nQXVkaW8nLCAnbmdDb29raWVzJywgJ25nSW1nQ3JvcCcsICduZ0pveVJpZGUnLCAnbmdNYXRlcmlhbCcsXG4gICAgJ25nUmVzb3VyY2UnLCAnbmdTYW5pdGl6ZScsICduZ1RvdWNoJywgJ3Bhc2NhbHByZWNodC50cmFuc2xhdGUnLFxuICAgICd0b2FzdHInLCAndWkuYm9vdHN0cmFwJywgJ3VpLnNvcnRhYmxlJywgJ3VpLnRyZWUnLCAndWkudmFsaWRhdGUnLFxuICAgIGRvd25ncmFkZWRNb2R1bGVcbl0pXG4gICAgLy8gVGhpcyBkaXJlY3RpdmUgaXMgdGhlIGRvd25ncmFkZWQgdmVyc2lvbiBvZiB0aGUgQW5ndWxhciBjb21wb25lbnQgdG9cbiAgICAvLyBib290c3RyYXAgdGhlIEFuZ3VsYXIgOC5cbiAgICAuZGlyZWN0aXZlKCdzZXJ2aWNlQm9vdHN0cmFwJywgc3RhdGljXzEuZG93bmdyYWRlQ29tcG9uZW50KHtcbiAgICBjb21wb25lbnQ6IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbn0pKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlcyByZXF1aXJlZCBpbiBhZG1pbiBwYW5lbC5cbiAqL1xuLy8gVGhlIG1vZHVsZSBuZWVkcyB0byBiZSBsb2FkZWQgYmVmb3JlIGV2ZXJ5dGhpbmcgZWxzZSBzaW5jZSBpdCBkZWZpbmVzIHRoZVxuLy8gbWFpbiBtb2R1bGUgdGhlIGVsZW1lbnRzIGFyZSBhdHRhY2hlZCB0by5cbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ0FwcC50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLmRpcmVjdGl2ZS50cycpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBjb25maWd1cmF0aW9uIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2Uvc2VydmljZXMvYWRtaW4tZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL3NlcnZpY2VzL2FkbWluLXRhc2stbWFuYWdlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhZG1pbkNvbmZpZ1RhYicsIFtcbiAgICAnJGh0dHAnLCAnJHdpbmRvdycsICdBZG1pbkRhdGFTZXJ2aWNlJywgJ0FkbWluVGFza01hbmFnZXJTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnQURNSU5fSEFORExFUl9VUkwnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHdpbmRvdywgQWRtaW5EYXRhU2VydmljZSwgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBBRE1JTl9IQU5ETEVSX1VSTCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBzZXRTdGF0dXNNZXNzYWdlOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9hZG1pbi1wYWdlL2NvbmZpZy10YWIvYWRtaW4tY29uZmlnLXRhYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbmZpZ1Byb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc05vbmVtcHR5T2JqZWN0ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhc0F0TGVhc3RPbmVFbGVtZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNBdExlYXN0T25lRWxlbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGFzQXRMZWFzdE9uZUVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVsb2FkQ29uZmlnUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluRGF0YVNlcnZpY2UuZ2V0RGF0YUFzeW5jKCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbmZpZ1Byb3BlcnRpZXMgPSByZXNwb25zZS5jb25maWdfcHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnJldmVydFRvRGVmYXVsdENvbmZpZ1Byb3BlcnR5VmFsdWUgPSBmdW5jdGlvbiAoY29uZmlnUHJvcGVydHlJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkd2luZG93LmNvbmZpcm0oJ1RoaXMgYWN0aW9uIGlzIGlycmV2ZXJzaWJsZS4gQXJlIHlvdSBzdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3JldmVydF9jb25maWdfcHJvcGVydHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ19wcm9wZXJ0eV9pZDogY29uZmlnUHJvcGVydHlJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdDb25maWcgcHJvcGVydHkgcmV2ZXJ0ZWQgc3VjY2Vzc2Z1bGx5LicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucmVsb2FkQ29uZmlnUHJvcGVydGllcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zYXZlQ29uZmlnUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5pc1Rhc2tSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISR3aW5kb3cuY29uZmlybSgnVGhpcyBhY3Rpb24gaXMgaXJyZXZlcnNpYmxlLiBBcmUgeW91IHN1cmU/JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1NhdmluZy4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2Uuc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Q29uZmlnUHJvcGVydHlWYWx1ZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIGN0cmwuY29uZmlnUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NvbmZpZ1Byb3BlcnR5VmFsdWVzW3Byb3BlcnR5XSA9IChjdHJsLmNvbmZpZ1Byb3BlcnRpZXNbcHJvcGVydHldLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdzYXZlX2NvbmZpZ19wcm9wZXJ0aWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfY29uZmlnX3Byb3BlcnR5X3ZhbHVlczogbmV3Q29uZmlnUHJvcGVydHlWYWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnRGF0YSBzYXZlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuZmluaXNoVGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuZmluaXNoVGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVsb2FkQ29uZmlnUHJvcGVydGllcygpO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGpvYnMgdGFiIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9zZXJ2aWNlcy9hZG1pbi1kYXRhLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2FkbWluSm9ic1RhYicsIFtcbiAgICAnJGh0dHAnLCAnJHRpbWVvdXQnLCAnQWRtaW5EYXRhU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0FETUlOX0hBTkRMRVJfVVJMJywgJ0FETUlOX0pPQl9PVVRQVVRfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICR0aW1lb3V0LCBBZG1pbkRhdGFTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQURNSU5fSEFORExFUl9VUkwsIEFETUlOX0pPQl9PVVRQVVRfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIHNldFN0YXR1c01lc3NhZ2U6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2FkbWluLXBhZ2Uvam9icy10YWIvYWRtaW4tam9icy10YWIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5IVU1BTl9SRUFEQUJMRV9DVVJSRU5UX1RJTUUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5DT05USU5VT1VTX0NPTVBVVEFUSU9OU19EQVRBID0ge307XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuT05FX09GRl9KT0JfU1BFQ1MgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5VTkZJTklTSEVEX0pPQl9EQVRBID0ge307XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQVVESVRfSk9CX1NQRUNTID0ge307XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuUkVDRU5UX0pPQl9EQVRBID0ge307XG4gICAgICAgICAgICAgICAgICAgIEFkbWluRGF0YVNlcnZpY2UuZ2V0RGF0YUFzeW5jKCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuSFVNQU5fUkVBREFCTEVfQ1VSUkVOVF9USU1FID0gKHJlc3BvbnNlLmh1bWFuX3JlYWRlYWJsZV9jdXJyZW50X3RpbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5DT05USU5VT1VTX0NPTVBVVEFUSU9OU19EQVRBID0gKHJlc3BvbnNlLmNvbnRpbnVvdXNfY29tcHV0YXRpb25zX2RhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5PTkVfT0ZGX0pPQl9TUEVDUyA9IHJlc3BvbnNlLm9uZV9vZmZfam9iX3NwZWNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5VTkZJTklTSEVEX0pPQl9EQVRBID0gcmVzcG9uc2UudW5maW5pc2hlZF9qb2JfZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuQVVESVRfSk9CX1NQRUNTID0gcmVzcG9uc2UuYXVkaXRfam9iX3NwZWNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5SRUNFTlRfSk9CX0RBVEEgPSByZXNwb25zZS5yZWNlbnRfam9iX2RhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dpbmdKb2JPdXRwdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaG93Sm9iT3V0cHV0ID0gZnVuY3Rpb24gKGpvYklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWRtaW5Kb2JPdXRwdXRVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChBRE1JTl9KT0JfT1VUUFVUX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpvYklkOiBqb2JJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5nZXQoYWRtaW5Kb2JPdXRwdXRVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zaG93aW5nSm9iT3V0cHV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmpvYk91dHB1dCA9IHJlc3BvbnNlLmRhdGEub3V0cHV0IHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuam9iT3V0cHV0LnNvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNqb2Itb3V0cHV0Jykuc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YXJ0TmV3Sm9iID0gZnVuY3Rpb24gKGpvYlR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnU3RhcnRpbmcgbmV3IGpvYi4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3N0YXJ0X25ld19qb2InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpvYl90eXBlOiBqb2JUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ0pvYiBzdGFydGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnU2VydmVyIGVycm9yOiAnICsgZXJyb3JSZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNhbmNlbEpvYiA9IGZ1bmN0aW9uIChqb2JJZCwgam9iVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdDYW5jZWxsaW5nIGpvYi4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2NhbmNlbF9qb2InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpvYl9pZDogam9iSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgam9iX3R5cGU6IGpvYlR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnQWJvcnQgc2lnbmFsIHNlbnQgdG8gam9iLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc3RhcnRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uIChjb21wdXRhdGlvblR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnU3RhcnRpbmcgY29tcHV0YXRpb24uLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdzdGFydF9jb21wdXRhdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0YXRpb25fdHlwZTogY29tcHV0YXRpb25UeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ0NvbXB1dGF0aW9uIHN0YXJ0ZWQgc3VjY2Vzc2Z1bGx5LicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc3RvcENvbXB1dGF0aW9uID0gZnVuY3Rpb24gKGNvbXB1dGF0aW9uVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdTdG9wcGluZyBjb21wdXRhdGlvbi4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3N0b3BfY29tcHV0YXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGF0aW9uX3R5cGU6IGNvbXB1dGF0aW9uVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdBYm9ydCBzaWduYWwgc2VudCB0byBjb21wdXRhdGlvbi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnU2VydmVyIGVycm9yOiAnICsgZXJyb3JSZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIG1pc2NlbGxhbmVvdXMgdGFiIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9zZXJ2aWNlcy9hZG1pbi10YXNrLW1hbmFnZXIuc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYWRtaW5NaXNjVGFiJywgW1xuICAgICckaHR0cCcsICckd2luZG93JywgJ0FkbWluVGFza01hbmFnZXJTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnQURNSU5fSEFORExFUl9VUkwnLCAnQURNSU5fVE9QSUNTX0NTVl9ET1dOTE9BRF9IQU5ETEVSX1VSTCcsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkd2luZG93LCBBZG1pblRhc2tNYW5hZ2VyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEFETUlOX0hBTkRMRVJfVVJMLCBBRE1JTl9UT1BJQ1NfQ1NWX0RPV05MT0FEX0hBTkRMRVJfVVJMKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIHNldFN0YXR1c01lc3NhZ2U6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2FkbWluLXBhZ2UvbWlzYy10YWIvYWRtaW4tbWlzYy10YWIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIERBVEFfRVhUUkFDVElPTl9RVUVSWV9IQU5ETEVSX1VSTCA9ICgnL2V4cGxvcmF0aW9uZGF0YWV4dHJhY3Rpb25oYW5kbGVyJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpcnJldmVyc2libGVBY3Rpb25NZXNzYWdlID0gKCdUaGlzIGFjdGlvbiBpcyBpcnJldmVyc2libGUuIEFyZSB5b3Ugc3VyZT8nKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jbGVhclNlYXJjaEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmlzVGFza1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHdpbmRvdy5jb25maXJtKGlycmV2ZXJzaWJsZUFjdGlvbk1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdDbGVhcmluZyBzZWFyY2ggaW5kZXguLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLnN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2NsZWFyX3NlYXJjaF9pbmRleCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnSW5kZXggc3VjY2Vzc2Z1bGx5IGNsZWFyZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuZmluaXNoVGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuZmluaXNoVGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZmx1c2hNaWdyYXRpb25Cb3RDb250cmlidXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmlzVGFza1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHdpbmRvdy5jb25maXJtKGlycmV2ZXJzaWJsZUFjdGlvbk1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdGbHVzaGluZyBtaWdyYXRpb24gYm90IGNvbnRyaWJ1dGlvbnMuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLnN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2ZsdXNoX21pZ3JhdGlvbl9ib3RfY29udHJpYnV0aW9uX2RhdGEnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ01pZ3JhdGlvbiBib3QgY29udHJpYnV0aW9ucyBzdWNjZXNzZnVsbHkgZmx1c2hlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnU2VydmVyIGVycm9yOiAnICsgZXJyb3JSZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51cGxvYWRUb3BpY1NpbWlsYXJpdGllc0ZpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b3BpY1NpbWlsYXJpdGllc0ZpbGUnKS5maWxlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd1cGxvYWRfdG9waWNfc2ltaWxhcml0aWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1RvcGljIHNpbWlsYXJpdGllcyB1cGxvYWRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmRvd25sb2FkVG9waWNTaW1pbGFyaXRpZXNGaWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gQURNSU5fVE9QSUNTX0NTVl9ET1dOTE9BRF9IQU5ETEVSX1VSTDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNldERhdGFFeHRyYWN0aW9uUXVlcnlTdGF0dXNNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd0RhdGFFeHRyYWN0aW9uUXVlcnlTdGF0dXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5kYXRhRXh0cmFjdGlvblF1ZXJ5U3RhdHVzTWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc3VibWl0UXVlcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgU1RBVFVTX1BFTkRJTkcgPSAoJ0RhdGEgZXh0cmFjdGlvbiBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQuIFBsZWFzZSB3YWl0LicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIFNUQVRVU19GSU5JU0hFRCA9ICdMb2FkaW5nIHRoZSBleHRyYWN0ZWQgZGF0YSAuLi4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIFNUQVRVU19GQUlMRUQgPSAnRXJyb3IsICc7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXREYXRhRXh0cmFjdGlvblF1ZXJ5U3RhdHVzTWVzc2FnZShTVEFUVVNfUEVORElORyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZG93bmxvYWRVcmwgPSBEQVRBX0VYVFJBQ1RJT05fUVVFUllfSEFORExFUl9VUkwgKyAnPyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFVybCArPSAnZXhwX2lkPScgKyBlbmNvZGVVUklDb21wb25lbnQoY3RybC5leHBJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFVybCArPSAnJmV4cF92ZXJzaW9uPScgKyBlbmNvZGVVUklDb21wb25lbnQoY3RybC5leHBWZXJzaW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvd25sb2FkVXJsICs9ICcmc3RhdGVfbmFtZT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGN0cmwuc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvd25sb2FkVXJsICs9ICcmbnVtX2Fuc3dlcnM9JyArIGVuY29kZVVSSUNvbXBvbmVudChjdHJsLm51bUFuc3dlcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5vcGVuKGRvd25sb2FkVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5yZXNldEZvcm0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cElkID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cFZlcnNpb24gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGF0ZU5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubnVtQW5zd2VycyA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dEYXRhRXh0cmFjdGlvblF1ZXJ5U3RhdHVzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgbmF2aWdhdGlvbiBiYXIgaW4gdGhlIGFkbWluIHBhbmVsLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL3NlcnZpY2VzL2FkbWluLXJvdXRlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYWRtaW5OYXZiYXInLCBbXG4gICAgJ0FkbWluUm91dGVyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdBRE1JTl9UQUJfVVJMUycsXG4gICAgJ0xPR09VVF9VUkwnLCAnUFJPRklMRV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uIChBZG1pblJvdXRlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBBRE1JTl9UQUJfVVJMUywgTE9HT1VUX1VSTCwgUFJPRklMRV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgZ2V0VXNlckVtYWlsOiAnJnVzZXJFbWFpbCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9hZG1pbi1wYWdlL25hdmJhci9hZG1pbi1uYXZiYXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnVXNlclNlcnZpY2UnLCBmdW5jdGlvbiAoVXNlclNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFETUlOX1RBQl9VUkxTID0gQURNSU5fVEFCX1VSTFM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1RhYiA9IEFkbWluUm91dGVyU2VydmljZS5zaG93VGFiO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzQWN0aXZpdGllc1RhYk9wZW4gPSBBZG1pblJvdXRlclNlcnZpY2UuaXNBY3Rpdml0aWVzVGFiT3BlbjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0pvYnNUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzSm9ic1RhYk9wZW47XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNDb25maWdUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzQ29uZmlnVGFiT3BlbjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1JvbGVzVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc1JvbGVzVGFiT3BlbjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc01pc2NUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzTWlzY1RhYk9wZW47XG4gICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFByb2ZpbGVJbWFnZURhdGFVcmxBc3luYygpLnRoZW4oZnVuY3Rpb24gKGRhdGFVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucHJvZmlsZVBpY3R1cmVEYXRhVXJsID0gZGF0YVVybDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcm5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc01vZGVyYXRvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTdXBlckFkbWluID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9maWxlVXJsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51c2VybmFtZSA9IHVzZXJJbmZvLmdldFVzZXJuYW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTW9kZXJhdG9yID0gdXNlckluZm8uaXNNb2RlcmF0b3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTdXBlckFkbWluID0gdXNlckluZm8uaXNTdXBlckFkbWluKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2ZpbGVVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoUFJPRklMRV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogY3RybC51c2VybmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5sb2dvV2hpdGVJbWdVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2xvZ28vMjg4eDEyOF9sb2dvX3doaXRlLnBuZycpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmxvZ291dFVybCA9IExPR09VVF9VUkw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucHJvZmlsZURyb3Bkb3duSXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbk1vdXNlb3ZlclByb2ZpbGVQaWN0dXJlT3JEcm9wZG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChldnQuY3VycmVudFRhcmdldCkucGFyZW50KCkuYWRkQ2xhc3MoJ29wZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucHJvZmlsZURyb3Bkb3duSXNBY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uTW91c2VvdXRQcm9maWxlUGljdHVyZU9yRHJvcGRvd24gPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZXZ0LmN1cnJlbnRUYXJnZXQpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2ZpbGVEcm9wZG93bklzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgUm9sZXMgdGFiIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvcm9sZS1ncmFwaC5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2Uvc2VydmljZXMvYWRtaW4tZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL3NlcnZpY2VzL2FkbWluLXRhc2stbWFuYWdlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhZG1pblJvbGVzVGFiJywgW1xuICAgICckaHR0cCcsICdBZG1pbkRhdGFTZXJ2aWNlJywgJ0FkbWluVGFza01hbmFnZXJTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnQURNSU5fUk9MRV9IQU5ETEVSX1VSTCcsXG4gICAgZnVuY3Rpb24gKCRodHRwLCBBZG1pbkRhdGFTZXJ2aWNlLCBBZG1pblRhc2tNYW5hZ2VyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEFETUlOX1JPTEVfSEFORExFUl9VUkwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgc2V0U3RhdHVzTWVzc2FnZTogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvcm9sZS1ncmFwaC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnJlc3VsdFJvbGVzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJycpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnZpZXdGb3JtVmFsdWVzID0ge307XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXBkYXRlRm9ybVZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnZpZXdGb3JtVmFsdWVzLm1ldGhvZCA9ICdyb2xlJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5VUERBVEFCTEVfUk9MRVMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5WSUVXQUJMRV9ST0xFUyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnRvcGljU3VtbWFyaWVzID0ge307XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ3JhcGhEYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ3JhcGhEYXRhTG9hZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEFkbWluRGF0YVNlcnZpY2UuZ2V0RGF0YUFzeW5jKCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuVVBEQVRBQkxFX1JPTEVTID0gcmVzcG9uc2UudXBkYXRhYmxlX3JvbGVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5WSUVXQUJMRV9ST0xFUyA9IHJlc3BvbnNlLnZpZXdhYmxlX3JvbGVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC50b3BpY1N1bW1hcmllcyA9IHJlc3BvbnNlLnRvcGljX3N1bW1hcmllcztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZ3JhcGhEYXRhID0gcmVzcG9uc2Uucm9sZV9ncmFwaF9kYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5ncmFwaERhdGFMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0aW5nIGluaXRTdGF0ZUlkIGFuZCBmaW5hbFN0YXRlSWRzIGZvciBncmFwaERhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIHJvbGUgZ3JhcGggaXMgYWN5Y2xpYywgbm9kZSB3aXRoIG5vIGluY29taW5nIGVkZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIGluaXRTdGF0ZSBhbmQgbm9kZXMgd2l0aCBubyBvdXRnb2luZyBlZGdlIGFyZSBmaW5hbFN0YXRlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoYXNJbmNvbWluZ0VkZ2UgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoYXNPdXRnb2luZ0VkZ2UgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3RybC5ncmFwaERhdGEubGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNJbmNvbWluZ0VkZ2UucHVzaChjdHJsLmdyYXBoRGF0YS5saW5rc1tpXS50YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc091dGdvaW5nRWRnZS5wdXNoKGN0cmwuZ3JhcGhEYXRhLmxpbmtzW2ldLnNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmluYWxTdGF0ZUlkcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcm9sZSBpbiBjdHJsLmdyYXBoRGF0YS5ub2Rlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLmdyYXBoRGF0YS5ub2Rlcy5oYXNPd25Qcm9wZXJ0eShyb2xlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzSW5jb21pbmdFZGdlLmluZGV4T2Yocm9sZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmdyYXBoRGF0YS5pbml0U3RhdGVJZCA9IHJvbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc091dGdvaW5nRWRnZS5pbmRleE9mKHJvbGUpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxTdGF0ZUlkcy5wdXNoKHJvbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5ncmFwaERhdGEuZmluYWxTdGF0ZUlkcyA9IGZpbmFsU3RhdGVJZHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmdyYXBoRGF0YUxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnN1Ym1pdFJvbGVWaWV3Rm9ybSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5pc1Rhc2tSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1Byb2Nlc3NpbmcgcXVlcnkuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLnN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5yZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLmdldChBRE1JTl9ST0xFX0hBTkRMRVJfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogdmFsdWVzLm1ldGhvZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9sZTogdmFsdWVzLnJvbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB2YWx1ZXMudXNlcm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucmVzdWx0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoY3RybC5yZXN1bHQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnJlc3VsdFJvbGVzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ05vIHJlc3VsdHMuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnJlc3VsdFJvbGVzVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0U3RhdHVzTWVzc2FnZSgnU3VjY2Vzcy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC52aWV3Rm9ybVZhbHVlcy51c2VybmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudmlld0Zvcm1WYWx1ZXMucm9sZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zdWJtaXRVcGRhdGVSb2xlRm9ybSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5pc1Rhc2tSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1VwZGF0aW5nIFVzZXIgUm9sZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2Uuc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KEFETUlOX1JPTEVfSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb2xlOiB2YWx1ZXMubmV3Um9sZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogdmFsdWVzLnVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcGljX2lkOiB2YWx1ZXMudG9waWNJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdGF0dXNNZXNzYWdlKCdSb2xlIG9mICcgKyB2YWx1ZXMudXNlcm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIHN1Y2Nlc3NmdWxseSB1cGRhdGVkIHRvICcgKyB2YWx1ZXMubmV3Um9sZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51cGRhdGVGb3JtVmFsdWVzLnVzZXJuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51cGRhdGVGb3JtVmFsdWVzLm5ld1JvbGUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVwZGF0ZUZvcm1WYWx1ZXMudG9waWNJZCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGRpc3BsYXlpbmcgUm9sZSBncmFwaC5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9ncmFwaC1zZXJ2aWNlcy9ncmFwaC1sYXlvdXQuc2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdyb2xlR3JhcGgnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIC8vIEFuIG9iamVjdCB3aXRoIHRoZXNlIGtleXM6XG4gICAgICAgICAgICAgICAgLy8gIC0gJ25vZGVzJzogQW4gb2JqZWN0IHdob3NlIGtleXMgYXJlIG5vZGUgaWRzIGFuZCB3aG9zZSB2YWx1ZXMgYXJlXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgbm9kZSBsYWJlbHNcbiAgICAgICAgICAgICAgICAvLyAgLSAnbGlua3MnOiBBIGxpc3Qgb2Ygb2JqZWN0cyB3aXRoIGtleXM6XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAnc291cmNlJzogaWQgb2Ygc291cmNlIG5vZGVcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICd0YXJnZXQnOiBpZCBvZiB0YXJnZXQgbm9kZVxuICAgICAgICAgICAgICAgIC8vICAtICdpbml0U3RhdGVJZCc6IFRoZSBpbml0aWFsIHN0YXRlIGlkXG4gICAgICAgICAgICAgICAgLy8gIC0gJ2ZpbmFsU3RhdGVJZHMnOiBUaGUgbGlzdCBvZiBpZHMgY29ycmVzcG9uZGluZyB0byB0ZXJtaW5hbCBzdGF0ZXNcbiAgICAgICAgICAgICAgICBncmFwaERhdGE6ICc9JyxcbiAgICAgICAgICAgICAgICAvLyBBIGJvb2xlYW4gdmFsdWUgdG8gc2lnbmlmeSB3aGV0aGVyIGdyYXBoRGF0YSBpcyBjb21wbGV0ZWx5IGxvYWRlZC5cbiAgICAgICAgICAgICAgICBncmFwaERhdGFMb2FkZWQ6ICdAJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2FkbWluLXBhZ2Uvcm9sZXMtdGFiL2FkbWluLXJvbGVzLXRhYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckZWxlbWVudCcsICckdGltZW91dCcsICckZmlsdGVyJywgJ1N0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnTUFYX05PREVTX1BFUl9ST1cnLCAnTUFYX05PREVfTEFCRUxfTEVOR1RIJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJGVsZW1lbnQsICR0aW1lb3V0LCAkZmlsdGVyLCBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZSwgTUFYX05PREVTX1BFUl9ST1csIE1BWF9OT0RFX0xBQkVMX0xFTkdUSCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBnZXRFbGVtZW50RGltZW5zaW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaDogJGVsZW1lbnQuaGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdzogJGVsZW1lbnQud2lkdGgoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRHcmFwaEhlaWdodEluUGl4ZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KGN0cmwuR1JBUEhfSEVJR0hULCAzMDApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmRyYXdHcmFwaCA9IGZ1bmN0aW9uIChub2Rlcywgb3JpZ2luYWxMaW5rcywgaW5pdFN0YXRlSWQsIGZpbmFsU3RhdGVJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZmluYWxTdGF0ZUlkcyA9IGZpbmFsU3RhdGVJZHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSBhbmd1bGFyLmNvcHkob3JpZ2luYWxMaW5rcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZURhdGEgPSBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5jb21wdXRlTGF5b3V0KG5vZGVzLCBsaW5rcywgaW5pdFN0YXRlSWQsIGFuZ3VsYXIuY29weShmaW5hbFN0YXRlSWRzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLkdSQVBIX1dJRFRIID0gU3RhdGVHcmFwaExheW91dFNlcnZpY2UuZ2V0R3JhcGhXaWR0aChNQVhfTk9ERVNfUEVSX1JPVywgTUFYX05PREVfTEFCRUxfTEVOR1RIKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuR1JBUEhfSEVJR0hUID0gU3RhdGVHcmFwaExheW91dFNlcnZpY2UuZ2V0R3JhcGhIZWlnaHQobm9kZURhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZURhdGEgPSBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5tb2RpZnlQb3NpdGlvblZhbHVlcyhub2RlRGF0YSwgY3RybC5HUkFQSF9XSURUSCwgY3RybC5HUkFQSF9IRUlHSFQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hdWdtZW50ZWRMaW5rcyA9IFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlLmdldEF1Z21lbnRlZExpbmtzKG5vZGVEYXRhLCBsaW5rcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmdldE5vZGVUaXRsZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUubGFiZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRUcnVuY2F0ZWRMYWJlbCA9IGZ1bmN0aW9uIChub2RlTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcigndHJ1bmNhdGUnKShub2RlTGFiZWwsIE1BWF9OT0RFX0xBQkVMX0xFTkdUSCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRpbmcgbGlzdCBvZiBub2RlcyB0byBkaXNwbGF5LlxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5ub2RlTGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbm9kZUlkIGluIG5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5ub2RlTGlzdC5wdXNoKG5vZGVEYXRhW25vZGVJZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5ncmFwaERhdGFMb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZHJhd0dyYXBoKGN0cmwuZ3JhcGhEYXRhLm5vZGVzLCBjdHJsLmdyYXBoRGF0YS5saW5rcywgY3RybC5ncmFwaERhdGEuaW5pdFN0YXRlSWQsIGN0cmwuZ3JhcGhEYXRhLmZpbmFsU3RhdGVJZHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRoYXQgbWFuYWdlcyBhZG1pbiBkYXRhLlxuICovXG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQWRtaW5EYXRhU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnQURNSU5fSEFORExFUl9VUkwnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgQURNSU5fSEFORExFUl9VUkwpIHtcbiAgICAgICAgdmFyIGRhdGFQcm9taXNlID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldERhdGFBc3luYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVByb21pc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRhdGFQcm9taXNlID0gJGh0dHAuZ2V0KEFETUlOX0hBTkRMRVJfVVJMKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gbWFpbnRhaW4gdGhlIHJvdXRpbmcgc3RhdGUgb2YgdGhlIGFkbWluIHBhZ2UsXG4gKiBwcm92aWRlIHJvdXRpbmcgZnVuY3Rpb25hbGl0eSwgYW5kIHN0b3JlIGFsbCBhdmFpbGFibGUgdGFiIHN0YXRlcy5cbiAqL1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0FkbWluUm91dGVyU2VydmljZScsIFtcbiAgICAnQURNSU5fVEFCX1VSTFMnLFxuICAgIGZ1bmN0aW9uIChBRE1JTl9UQUJfVVJMUykge1xuICAgICAgICB2YXIgY3VycmVudFRhYkhhc2ggPSBBRE1JTl9UQUJfVVJMUy5BQ1RJVklUSUVTO1xuICAgICAgICB2YXIgZ2V0VGFiTmFtZUJ5SGFzaCA9IGZ1bmN0aW9uICh0YWJIYXNoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciB0YWJOYW1lIGluIEFETUlOX1RBQl9VUkxTKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFETUlOX1RBQl9VUkxTW3RhYk5hbWVdID09PSB0YWJIYXNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJOYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBOYXZpZ2F0ZXMgdGhlIHBhZ2UgdG8gdGhlIHNwZWNpZmllZCB0YWIgYmFzZWQgb24gaXRzIEhUTUwgaGFzaC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2hvd1RhYjogZnVuY3Rpb24gKHRhYkhhc2gpIHtcbiAgICAgICAgICAgICAgICBpZiAoZ2V0VGFiTmFtZUJ5SGFzaCh0YWJIYXNoKSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VGFiSGFzaCA9IHRhYkhhc2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBhY3Rpdml0aWVzIHRhYiBpcyBvcGVuLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0FjdGl2aXRpZXNUYWJPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUYWJIYXNoID09PSBBRE1JTl9UQUJfVVJMUy5BQ1RJVklUSUVTO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBqb2JzIHRhYiBpcyBvcGVuLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0pvYnNUYWJPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUYWJIYXNoID09PSBBRE1JTl9UQUJfVVJMUy5KT0JTO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBjb25maWcgdGFiIGlzIG9wZW4uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlzQ29uZmlnVGFiT3BlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50VGFiSGFzaCA9PT0gQURNSU5fVEFCX1VSTFMuQ09ORklHO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSByb2xlcyB0YWIgaXMgb3Blbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNSb2xlc1RhYk9wZW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudFRhYkhhc2ggPT09IEFETUlOX1RBQl9VUkxTLlJPTEVTO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBtaXNjZWxsYW5lb3VzIHRhYiBpcyBvcGVuLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc01pc2NUYWJPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUYWJIYXNoID09PSBBRE1JTl9UQUJfVVJMUy5NSVNDO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHF1ZXJ5IGFuZCBzdGFydCBuZXcgdGFza3Mgc3luY2hyb25vdXNseSBpbiB0aGUgYWRtaW5cbiAqIHBhZ2UuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBBZG1pblRhc2tNYW5hZ2VyU2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZG1pblRhc2tNYW5hZ2VyU2VydmljZSgpIHtcbiAgICB9XG4gICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2VfMSA9IEFkbWluVGFza01hbmFnZXJTZXJ2aWNlO1xuICAgIC8qKlxuICAgICAqIE5vdGlmaWVzIHRoZSBtYW5hZ2VyIGEgbmV3IHRhc2sgaXMgc3RhcnRpbmcuXG4gICAgICovXG4gICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UucHJvdG90eXBlLnN0YXJ0VGFzayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2VfMS50YXNrSXNSdW5uaW5nID0gdHJ1ZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgd2hldGhlciBhIHRhc2sgaXMgY3VycmVudGx5IHJ1bm5pbmcuXG4gICAgICovXG4gICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UucHJvdG90eXBlLmlzVGFza1J1bm5pbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBBZG1pblRhc2tNYW5hZ2VyU2VydmljZV8xLnRhc2tJc1J1bm5pbmc7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBOb3RpZmllcyB0aGUgbWFuYWdlciBhIHRhc2sgaGFzIGNvbXBsZXRlZC5cbiAgICAgKi9cbiAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5wcm90b3R5cGUuZmluaXNoVGFzayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2VfMS50YXNrSXNSdW5uaW5nID0gZmFsc2U7XG4gICAgfTtcbiAgICB2YXIgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2VfMTtcbiAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS50YXNrSXNSdW5uaW5nID0gZmFsc2U7XG4gICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UgPSBBZG1pblRhc2tNYW5hZ2VyU2VydmljZV8xID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlKTtcbiAgICByZXR1cm4gQWRtaW5UYXNrTWFuYWdlclNlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5BZG1pblRhc2tNYW5hZ2VyU2VydmljZSA9IEFkbWluVGFza01hbmFnZXJTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEFkbWluVGFza01hbmFnZXJTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgY29waWVyIHZhbHVlIGdlbmVyYXRvci5cbiAqL1xuLy8gVE9ETyhzbGwpOiBSZW1vdmUgdGhpcyBkaXJlY3RpdmUgKGFzIHdlbGwgYXMgdGhlIHdob2xlIG9mIHRoZSB2YWx1ZVxuLy8gZ2VuZXJhdG9ycyBmcmFtZXdvcmspLlxucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9vYmplY3QtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdjb3BpZXInLCBbJyRjb21waWxlJywgZnVuY3Rpb24gKCRjb21waWxlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBzY29wZS5nZXRUZW1wbGF0ZVVybCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcvdmFsdWVfZ2VuZXJhdG9yX2hhbmRsZXIvJyArIHNjb3BlLmdlbmVyYXRvcklkO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgJGNvbXBpbGUoZWxlbWVudC5jb250ZW50cygpKShzY29wZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ3M6ICc9JyxcbiAgICAgICAgICAgICAgICBnZXRHZW5lcmF0b3JJZDogJyYnLFxuICAgICAgICAgICAgICAgIGdldEluaXRBcmdzOiAnJicsXG4gICAgICAgICAgICAgICAgZ2V0T2JqVHlwZTogJyYnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPHNwYW4gbmctaW5jbHVkZT1cImdldFRlbXBsYXRlVXJsKClcIj48L3NwYW4+JyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZ2VuZXJhdG9ySWQgPSAkc2NvcGUuZ2V0R2VuZXJhdG9ySWQoKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW5pdEFyZ3MgPSAkc2NvcGUuZ2V0SW5pdEFyZ3MoKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUub2JqVHlwZSA9ICRzY29wZS5nZXRPYmpUeXBlKCk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnaW5pdEFyZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pbml0QXJncyA9ICRzY29wZS5nZXRJbml0QXJncygpO1xuICAgICAgICAgICAgICAgIH0sIHRydWUpO1xuICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ29ialR5cGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5vYmpUeXBlID0gJHNjb3BlLmdldE9ialR5cGUoKTtcbiAgICAgICAgICAgICAgICB9LCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgcmFuZG9tIHNlbGVjdG9yIHZhbHVlIGdlbmVyYXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdyYW5kb21TZWxlY3RvcicsIFtcbiAgICAnJGNvbXBpbGUnLCBmdW5jdGlvbiAoJGNvbXBpbGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLmdldFRlbXBsYXRlVXJsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJy92YWx1ZV9nZW5lcmF0b3JfaGFuZGxlci8nICsgc2NvcGUuZ2VuZXJhdG9ySWQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAkY29tcGlsZShlbGVtZW50LmNvbnRlbnRzKCkpKHNjb3BlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25BcmdzOiAnPScsXG4gICAgICAgICAgICAgICAgZ2V0R2VuZXJhdG9ySWQ6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiBuZy1pbmNsdWRlPVwiZ2V0VGVtcGxhdGVVcmwoKVwiPjwvZGl2PicsXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGN0cmwuU0NIRU1BID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGlzdCcsXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndW5pY29kZSdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdWlfY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRfZWxlbWVudF90ZXh0OiAnQWRkIE5ldyBDaG9pY2UnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGN0cmwuZ2VuZXJhdG9ySWQgPSBjdHJsLmdldEdlbmVyYXRvcklkKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFjdHJsLmN1c3RvbWl6YXRpb25BcmdzLmxpc3Rfb2ZfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY3VzdG9taXphdGlvbkFyZ3MubGlzdF9vZl92YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJlcXVpcmVzIGZvciBhbGwgdGhlIHZhbHVlIGdlbmVyYXRvcnMgZGlyZWN0aXZlcy5cbiAqL1xucmVxdWlyZSgndmFsdWVfZ2VuZXJhdG9ycy90ZW1wbGF0ZXMvY29waWVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgndmFsdWVfZ2VuZXJhdG9ycy90ZW1wbGF0ZXMvcmFuZG9tLXNlbGVjdG9yLmRpcmVjdGl2ZS50cycpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==