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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/admin-page/admin-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","admin~app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~sto~7c5e036a","admin~creator_dashboard~exploration_editor~exploration_player~moderator~skill_editor~story_editor~to~3f6ef738","admin~app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~top~61bb2de1","admin~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~topic_e~3a7281d0","admin~app"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/StateGraphLayoutService.ts":
/*!***********************************************************************!*\
  !*** ./core/templates/dev/head/components/StateGraphLayoutService.ts ***!
  \***********************************************************************/
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
 * @fileoverview Directives for reusable data visualization components.
 */
// Service for computing layout of state graph nodes.
oppia.factory('StateGraphLayoutService', [
    '$filter', '$log', 'MAX_NODES_PER_ROW',
    function ($filter, $log, MAX_NODES_PER_ROW) {
        var MAX_INDENTATION_LEVEL = 2.5;
        // The last result of a call to computeLayout(). Used for determining the
        // order in which to specify states in rules.
        var lastComputedArrangement = null;
        var getGraphAsAdjacencyLists = function (nodes, links) {
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
        var getIndentationLevels = function (adjacencyLists, trunkNodeIds) {
            var indentationLevels = [];
            // Recursively find and indent the longest shortcut for the segment of
            // nodes ranging from trunkNodeIds[startInd] to trunkNodeIds[endInd]
            // (inclusive). It's possible that this shortcut starts from a trunk
            // node within this interval (A, say) and ends at a trunk node after
            // this interval, in which case we indent all nodes from A + 1 onwards.
            // NOTE: this mutates indentationLevels as a side-effect.
            var indentLongestShortcut = function (startInd, endInd) {
                if (startInd >= endInd ||
                    indentationLevels[startInd] >= MAX_INDENTATION_LEVEL) {
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
        return {
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
            computeLayout: function (nodes, links, initNodeId, finalNodeIds) {
                var adjacencyLists = getGraphAsAdjacencyLists(nodes, links);
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
                            bestPath = angular.copy(currentPath);
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
                var trunkNodesIndentationLevels = getIndentationLevels(adjacencyLists, bestPath);
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
                            if (computedOffset >= MAX_NODES_PER_ROW) {
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
                var totalColumns = MAX_NODES_PER_ROW;
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
                lastComputedArrangement = angular.copy(nodeData);
                return nodeData;
            },
            getLastComputedArrangement: function () {
                return angular.copy(lastComputedArrangement);
            },
            getGraphBoundaries: function (nodeData) {
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
            },
            getAugmentedLinks: function (nodeData, nodeLinks) {
                var links = angular.copy(nodeLinks);
                var augmentedLinks = links.map(function (link) {
                    return {
                        source: angular.copy(nodeData[link.source]),
                        target: angular.copy(nodeData[link.target])
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
            },
            modifyPositionValues: function (nodeData, graphWidth, graphHeight) {
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
            },
            getGraphWidth: function (maxNodesPerRow, maxNodeLabelLength) {
                // A rough upper bound for the width of a single letter, in pixels,
                // to use as a scaling factor to determine the width of graph nodes.
                // This is not an entirely accurate description because it also takes
                // into account the horizontal whitespace between graph nodes.
                var letterWidthInPixels = 10.5;
                return maxNodesPerRow * maxNodeLabelLength * letterWidthInPixels;
            },
            getGraphHeight: function (nodeData) {
                var maxDepth = 0;
                for (var nodeId in nodeData) {
                    maxDepth = Math.max(maxDepth, nodeData[nodeId].depth);
                }
                return 70.0 * (maxDepth + 1);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts":
/*!**************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts ***!
  \**************************************************************************************************************************************************/
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
 * @fileoverview Directive for a schema-based editor for expressions.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('schemaBasedExpressionEditorModule').directive('schemaBasedExpressionEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                // TODO(sll): Currently only takes a string which is either 'bool',
                // 'int' or 'float'. May need to generalize.
                outputType: '&',
                labelForFocusTarget: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/' +
                'schema-based-expression-editor/' +
                'schema-based-expression-editor.directive.html'),
            restrict: 'E'
        };
    }
]);


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
angular.module('stringUtilityFiltersModule').filter('truncate', ['$filter', function ($filter) {
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
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.directive.ts":
/*!******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.directive.ts ***!
  \******************************************************************************************************************************************/
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
__webpack_require__(/*! pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts");
angular.module('adminDevModeActivitiesTabModule').directive('adminDevModeActivitiesTab', [
    '$http', 'AdminTaskManagerService', 'UrlInterpolationService',
    'ADMIN_HANDLER_URL',
    function ($http, AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/activities-tab/admin-dev-mode-activities-tab/' +
                'admin-dev-mode-activities-tab.directive.html'),
            controller: ['$scope', function ($scope) {
                    $scope.reloadExploration = function (explorationId) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        $scope.setStatusMessage('Processing...');
                        AdminTaskManagerService.startTask();
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'reload_exploration',
                            exploration_id: String(explorationId)
                        }).then(function () {
                            $scope.setStatusMessage('Data reloaded successfully.');
                            AdminTaskManagerService.finishTask();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                            AdminTaskManagerService.finishTask();
                        });
                    };
                    $scope.DEMO_EXPLORATIONS = GLOBALS.DEMO_EXPLORATIONS;
                    $scope.DEMO_COLLECTIONS = GLOBALS.DEMO_COLLECTIONS;
                    $scope.numDummyExpsToPublish = 0;
                    $scope.numDummyExpsToGenerate = 0;
                    $scope.reloadAllExplorations = function () {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        $scope.setStatusMessage('Processing...');
                        AdminTaskManagerService.startTask();
                        var numSucceeded = 0;
                        var numFailed = 0;
                        var numTried = 0;
                        var printResult = function () {
                            if (numTried < GLOBALS.DEMO_EXPLORATION_IDS.length) {
                                $scope.setStatusMessage('Processing...' + numTried + '/' +
                                    GLOBALS.DEMO_EXPLORATION_IDS.length);
                                return;
                            }
                            $scope.setStatusMessage('Reloaded ' + GLOBALS.DEMO_EXPLORATION_IDS.length +
                                ' explorations: ' + numSucceeded + ' succeeded, ' + numFailed +
                                ' failed.');
                            AdminTaskManagerService.finishTask();
                        };
                        for (var i = 0; i < GLOBALS.DEMO_EXPLORATION_IDS.length; ++i) {
                            var explorationId = GLOBALS.DEMO_EXPLORATION_IDS[i];
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
                    $scope.generateDummyExplorations = function () {
                        // Generate dummy explorations with random title.
                        if ($scope.numDummyExpsToPublish > $scope.numDummyExpsToGenerate) {
                            $scope.setStatusMessage('Publish count should be less than or equal to generate count');
                            return;
                        }
                        AdminTaskManagerService.startTask();
                        $scope.setStatusMessage('Processing...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'generate_dummy_explorations',
                            num_dummy_exps_to_generate: $scope.numDummyExpsToGenerate,
                            num_dummy_exps_to_publish: $scope.numDummyExpsToPublish
                        }).then(function () {
                            $scope.setStatusMessage('Dummy explorations generated successfully.');
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                    $scope.reloadCollection = function (collectionId) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        $scope.setStatusMessage('Processing...');
                        AdminTaskManagerService.startTask();
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'reload_collection',
                            collection_id: String(collectionId)
                        }).then(function () {
                            $scope.setStatusMessage('Data reloaded successfully.');
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.directive.ts":
/*!********************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.directive.ts ***!
  \********************************************************************************************************************************************/
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
angular.module('adminProdModeActivitiesTab').directive('adminProdModeActivitiesTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin/activities_tab/' +
                'admin_prod_mode_activities_tab_directive.html')
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-navbar/admin-navbar.directive.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-navbar/admin-navbar.directive.ts ***!
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
/**
 * @fileoverview Directive for the navigation bar in the admin panel.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/admin-page-services/admin-router/admin-router.service.ts */ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-router/admin-router.service.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('adminNavbarModule').directive('adminNavbar', [
    'AdminRouterService', 'UrlInterpolationService', 'ADMIN_TAB_URLS',
    'LOGOUT_URL', 'PROFILE_URL_TEMPLATE',
    function (AdminRouterService, UrlInterpolationService, ADMIN_TAB_URLS, LOGOUT_URL, PROFILE_URL_TEMPLATE) {
        return {
            restrict: 'E',
            scope: {
                getUserEmail: '&userEmail'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/admin-navbar/' +
                'admin-navbar.directive.html'),
            controller: ['$scope', 'UserService', function ($scope, UserService) {
                    $scope.ADMIN_TAB_URLS = ADMIN_TAB_URLS;
                    $scope.showTab = AdminRouterService.showTab;
                    $scope.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
                    $scope.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
                    $scope.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
                    $scope.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
                    $scope.isMiscTabOpen = AdminRouterService.isMiscTabOpen;
                    UserService.getProfileImageDataUrlAsync().then(function (dataUrl) {
                        $scope.profilePictureDataUrl = dataUrl;
                    });
                    $scope.username = '';
                    $scope.isModerator = null;
                    $scope.isSuperAdmin = null;
                    $scope.profileUrl = '';
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        $scope.username = userInfo.getUsername();
                        $scope.isModerator = userInfo.isModerator();
                        $scope.isSuperAdmin = userInfo.isSuperAdmin();
                        $scope.profileUrl = (UrlInterpolationService.interpolateUrl(PROFILE_URL_TEMPLATE, {
                            username: $scope.username
                        }));
                    });
                    $scope.logoWhiteImgUrl = UrlInterpolationService.getStaticImageUrl('/logo/288x128_logo_white.png');
                    $scope.logoutUrl = LOGOUT_URL;
                    $scope.profileDropdownIsActive = false;
                    $scope.onMouseoverProfilePictureOrDropdown = function (evt) {
                        angular.element(evt.currentTarget).parent().addClass('open');
                        $scope.profileDropdownIsActive = true;
                    };
                    $scope.onMouseoutProfilePictureOrDropdown = function (evt) {
                        angular.element(evt.currentTarget).parent().removeClass('open');
                        $scope.profileDropdownIsActive = false;
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-router/admin-router.service.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page-services/admin-router/admin-router.service.ts ***!
  \***********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
angular.module('adminPageModule').factory('AdminRouterService', [
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

/***/ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts ***!
  \***********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service to query and start new tasks synchronously in the admin
 * page.
 */
angular.module('adminPageModule').factory('AdminTaskManagerService', [
    function () {
        var taskIsRunning = false;
        return {
            /**
             * Notifies the manager a new task is starting.
             */
            startTask: function () {
                taskIsRunning = true;
            },
            /**
             * Returns whether a task is currently running.
             */
            isTaskRunning: function () {
                return taskIsRunning;
            },
            /**
             * Notifies the manager a task has completed.
             */
            finishTask: function () {
                taskIsRunning = false;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page.controller.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page.controller.ts ***!
  \***************************************************************************/
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
 * @fileoverview Controllers for the Oppia admin page.
 */
// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
// require('components/forms/forms-validators/forms-validators.module.ts');
// require('filters/string-utility-filters/string-utility-filters.module.ts');
// require(
//   'components/forms/forms-directives/apply-validation/' +
//   'apply-validation.module.ts');
// require(
//   'components/forms/forms-directives/object-editor/object-editor.module.ts');
// require(
//   'components/forms/forms-directives/require-is-float/' +
//   'require-is-float.module.ts');
//   require(
//     'components/forms/forms-schema-editors/schema-based-editor/' +
//     'schema-based-bool-editor/schema-based-bool-editor.module.ts');
//     require(
//       'components/forms/forms-schema-editors/schema-based-editor/' +
//       'schema-based-choices-editor/schema-based-choices-editor.module.ts');
//       require(
//         'components/forms/forms-schema-editors/schema-based-editor/' +
//         'schema-based-custom-editor/schema-based-custom-editor.module.ts');
//         require(
//           'components/forms/forms-schema-editors/schema-based-editor/' +
//           'schema-based-float-editor/schema-based-float-editor.module.ts');
__webpack_require__(/*! components/button-directives/create-button/create-activity-button.module.ts */ "./core/templates/dev/head/components/button-directives/create-button/create-activity-button.module.ts");
__webpack_require__(/*! components/button-directives/exploration-embed-modal/exploration-embed-button.module.ts */ "./core/templates/dev/head/components/button-directives/exploration-embed-modal/exploration-embed-button.module.ts");
__webpack_require__(/*! components/button-directives/hint-and-solution-buttons/hint-and-solution-buttons.module.ts */ "./core/templates/dev/head/components/button-directives/hint-and-solution-buttons/hint-and-solution-buttons.module.ts");
__webpack_require__(/*! components/button-directives/social-buttons/social-buttons.module.ts */ "./core/templates/dev/head/components/button-directives/social-buttons/social-buttons.module.ts");
__webpack_require__(/*! components/button-directives/buttons-directives.module.ts */ "./core/templates/dev/head/components/button-directives/buttons-directives.module.ts");
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.module.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.module.ts");
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.module.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.module.ts");
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-helpers.module.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-helpers.module.ts");
__webpack_require__(/*! components/codemirror-mergeview/codemirror-mergeview.module.ts */ "./core/templates/dev/head/components/codemirror-mergeview/codemirror-mergeview.module.ts");
__webpack_require__(/*! components/common-layout-directives/alert-message/alert-message.module.ts */ "./core/templates/dev/head/components/common-layout-directives/alert-message/alert-message.module.ts");
__webpack_require__(/*! components/common-layout-directives/attribution-guide/attribution-guide.module.ts */ "./core/templates/dev/head/components/common-layout-directives/attribution-guide/attribution-guide.module.ts");
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.module.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.module.ts");
__webpack_require__(/*! components/common-layout-directives/loading-dots/loading-dots.module.ts */ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.module.ts");
__webpack_require__(/*! components/common-layout-directives/promo-bar/promo-bar.module.ts */ "./core/templates/dev/head/components/common-layout-directives/promo-bar/promo-bar.module.ts");
__webpack_require__(/*! components/common-layout-directives/sharing-links/sharing-links.module.ts */ "./core/templates/dev/head/components/common-layout-directives/sharing-links/sharing-links.module.ts");
__webpack_require__(/*! components/common-layout-directives/side-navigation-bar/side-navigation-bar.module.ts */ "./core/templates/dev/head/components/common-layout-directives/side-navigation-bar/side-navigation-bar.module.ts");
__webpack_require__(/*! components/common-layout-directives/top-navigation-bar/top-navigation-bar.module.ts */ "./core/templates/dev/head/components/common-layout-directives/top-navigation-bar/top-navigation-bar.module.ts");
__webpack_require__(/*! components/common-layout-directives/common-layout-directives.module.ts */ "./core/templates/dev/head/components/common-layout-directives/common-layout-directives.module.ts");
__webpack_require__(/*! components/entity-creation-services/entity-creation-services.module.ts */ "./core/templates/dev/head/components/entity-creation-services/entity-creation-services.module.ts");
__webpack_require__(/*! components/forms/forms-directives/apply-validation/apply-validation.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/apply-validation/apply-validation.module.ts");
__webpack_require__(/*! components/forms/forms-directives/audio-file-uploader/audio-file-uploader.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/audio-file-uploader/audio-file-uploader.module.ts");
__webpack_require__(/*! components/forms/forms-directives/html-select/html-select.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/html-select/html-select.module.ts");
__webpack_require__(/*! components/forms/forms-directives/image-uploader/image-uploader.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/image-uploader/image-uploader.module.ts");
__webpack_require__(/*! components/forms/forms-directives/object-editor/object-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/object-editor/object-editor.module.ts");
__webpack_require__(/*! components/forms/forms-directives/require-is-float/require-is-float.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/require-is-float/require-is-float.module.ts");
__webpack_require__(/*! components/forms/forms-directives/select2-dropdown/select2-dropdown.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.module.ts");
__webpack_require__(/*! components/forms/forms-directives/forms-directives.module.ts */ "./core/templates/dev/head/components/forms/forms-directives/forms-directives.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.module.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/forms-schema-editors.module.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/forms-schema-editors.module.ts");
__webpack_require__(/*! components/forms/forms-unicode-filters/forms-unicode-filters.module.ts */ "./core/templates/dev/head/components/forms/forms-unicode-filters/forms-unicode-filters.module.ts");
__webpack_require__(/*! components/forms/forms-validators/forms-validators.module.ts */ "./core/templates/dev/head/components/forms/forms-validators/forms-validators.module.ts");
__webpack_require__(/*! components/forms/forms.module.ts */ "./core/templates/dev/head/components/forms/forms.module.ts");
__webpack_require__(/*! components/profile-link-directives/circular-image/circular-image.module.ts */ "./core/templates/dev/head/components/profile-link-directives/circular-image/circular-image.module.ts");
__webpack_require__(/*! components/profile-link-directives/profile-link-image/profile-link-image.module.ts */ "./core/templates/dev/head/components/profile-link-directives/profile-link-image/profile-link-image.module.ts");
__webpack_require__(/*! components/profile-link-directives/profile-link-text/profile-link-text.module.ts */ "./core/templates/dev/head/components/profile-link-directives/profile-link-text/profile-link-text.module.ts");
__webpack_require__(/*! components/profile-link-directives/profile-link-directives.module.ts */ "./core/templates/dev/head/components/profile-link-directives/profile-link-directives.module.ts");
__webpack_require__(/*! components/ratings/rating-display/rating-display.module.ts */ "./core/templates/dev/head/components/ratings/rating-display/rating-display.module.ts");
__webpack_require__(/*! components/ratings/ratings.module.ts */ "./core/templates/dev/head/components/ratings/ratings.module.ts");
__webpack_require__(/*! components/state/answer-group-editor/answer-group-editor.module.ts */ "./core/templates/dev/head/components/state/answer-group-editor/answer-group-editor.module.ts");
__webpack_require__(/*! components/state/hint-editor/hint-editor.module.ts */ "./core/templates/dev/head/components/state/hint-editor/hint-editor.module.ts");
__webpack_require__(/*! components/state/outcome-editor/outcome-destination-editor/outcome-destination-editor.module.ts */ "./core/templates/dev/head/components/state/outcome-editor/outcome-destination-editor/outcome-destination-editor.module.ts");
__webpack_require__(/*! components/state/outcome-editor/outcome-feedback-editor/outcome-feedback-editor.module.ts */ "./core/templates/dev/head/components/state/outcome-editor/outcome-feedback-editor/outcome-feedback-editor.module.ts");
__webpack_require__(/*! components/state/outcome-editor/outcome-editor.module.ts */ "./core/templates/dev/head/components/state/outcome-editor/outcome-editor.module.ts");
__webpack_require__(/*! components/state/response-header/response-header.module.ts */ "./core/templates/dev/head/components/state/response-header/response-header.module.ts");
__webpack_require__(/*! components/state/rule-editor/rule-editor.module.ts */ "./core/templates/dev/head/components/state/rule-editor/rule-editor.module.ts");
__webpack_require__(/*! components/state/rule-type-selector/rule-type-selector.module.ts */ "./core/templates/dev/head/components/state/rule-type-selector/rule-type-selector.module.ts");
__webpack_require__(/*! components/state/solution-editor/solution-explanation-editor/solution-explanation-editor.module.ts */ "./core/templates/dev/head/components/state/solution-editor/solution-explanation-editor/solution-explanation-editor.module.ts");
__webpack_require__(/*! components/state/solution-editor/solution-editor.module.ts */ "./core/templates/dev/head/components/state/solution-editor/solution-editor.module.ts");
__webpack_require__(/*! components/state/state.module.ts */ "./core/templates/dev/head/components/state/state.module.ts");
__webpack_require__(/*! components/summary-list-header/summary-list-header.module.ts */ "./core/templates/dev/head/components/summary-list-header/summary-list-header.module.ts");
__webpack_require__(/*! components/summary-tile-directives/collection-summary-tile/collection-summary-tile.module.ts */ "./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.module.ts");
__webpack_require__(/*! components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.module.ts */ "./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.module.ts");
__webpack_require__(/*! components/summary-tile-directives/story-summary-tile/story-summary-tile.module.ts */ "./core/templates/dev/head/components/summary-tile-directives/story-summary-tile/story-summary-tile.module.ts");
__webpack_require__(/*! components/summary-tile-directives/summary-tile-directives.module.ts */ "./core/templates/dev/head/components/summary-tile-directives/summary-tile-directives.module.ts");
__webpack_require__(/*! components/version-diff-visualization/version-diff-visualization.module.ts */ "./core/templates/dev/head/components/version-diff-visualization/version-diff-visualization.module.ts");
__webpack_require__(/*! filters/string-utility-filters/string-utility-filters.module.ts */ "./core/templates/dev/head/filters/string-utility-filters/string-utility-filters.module.ts");
__webpack_require__(/*! filters/filters.module.ts */ "./core/templates/dev/head/filters/filters.module.ts");
__webpack_require__(/*! pages/about-page/about-page.module.ts */ "./core/templates/dev/head/pages/about-page/about-page.module.ts");
__webpack_require__(/*! pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.module.ts */ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.module.ts");
__webpack_require__(/*! pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.module.ts */ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.module.ts");
__webpack_require__(/*! pages/admin-page/admin-navbar/admin-navbar.module.ts */ "./core/templates/dev/head/pages/admin-page/admin-navbar/admin-navbar.module.ts");
__webpack_require__(/*! pages/admin-page/config-tab/admin-config-tab.module.ts */ "./core/templates/dev/head/pages/admin-page/config-tab/admin-config-tab.module.ts");
__webpack_require__(/*! pages/admin-page/jobs-tab/admin-jobs-tab.module.ts */ "./core/templates/dev/head/pages/admin-page/jobs-tab/admin-jobs-tab.module.ts");
__webpack_require__(/*! pages/admin-page/misc-tab/admin-misc-tab.module.ts */ "./core/templates/dev/head/pages/admin-page/misc-tab/admin-misc-tab.module.ts");
__webpack_require__(/*! pages/admin-page/roles-tab/roles-graph/role-graph.module.ts */ "./core/templates/dev/head/pages/admin-page/roles-tab/roles-graph/role-graph.module.ts");
__webpack_require__(/*! pages/admin-page/roles-tab/admin-roles-tab.module.ts */ "./core/templates/dev/head/pages/admin-page/roles-tab/admin-roles-tab.module.ts");
__webpack_require__(/*! pages/admin-page/admin-page.module.ts */ "./core/templates/dev/head/pages/admin-page/admin-page.module.ts");
__webpack_require__(/*! pages/collection-player-page/collection-footer/collection-footer.module.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-footer/collection-footer.module.ts");
__webpack_require__(/*! pages/collection-player-page/collection-local-nav/collection-local-nav.module.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.module.ts");
__webpack_require__(/*! pages/collection-player-page/collection-node-list/collection-node-list.module.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-node-list/collection-node-list.module.ts");
__webpack_require__(/*! pages/collection-player-page/collection-player-page.module.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.module.ts");
__webpack_require__(/*! pages/creator-dashboard-page/creator-dashboard-page.module.ts */ "./core/templates/dev/head/pages/creator-dashboard-page/creator-dashboard-page.module.ts");
__webpack_require__(/*! pages/donate-page/donate-page.module.ts */ "./core/templates/dev/head/pages/donate-page/donate-page.module.ts");
__webpack_require__(/*! pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.module.ts */ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.module.ts");
__webpack_require__(/*! pages/email-dashboard-page/email-dashboard-page.module.ts */ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page.module.ts");
__webpack_require__(/*! pages/error-page/error-page.module.ts */ "./core/templates/dev/head/pages/error-page/error-page.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/editor-navbar-breadcrumb/editor-navbar-breadcrumb.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/editor-navbar-breadcrumb/editor-navbar-breadcrumb.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/editor-navigation/editor-navigation.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/editor-navigation/editor-navigation.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-graph/exploration-graph.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-graph/exploration-graph.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/state-graph-visualization/state-graph-visualization.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-graph-visualization/state-graph-visualization.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/state-name-editor/state-name-editor.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-name-editor/state-name-editor.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/state-param-changes-editor/state-param-changes-editor.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-param-changes-editor/state-param-changes-editor.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/test-interaction-panel/test-interaction-panel.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/test-interaction-panel/test-interaction-panel.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/training-panel/training-panel.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/training-panel/training-panel.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/unresolved-answers-overview/unresolved-answers-overview.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/unresolved-answers-overview/unresolved-answers-overview.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-objective-editor/exploration-objective-editor.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-objective-editor/exploration-objective-editor.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-title-editor/exploration-title-editor.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-title-editor/exploration-title-editor.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/feedback-tab/thread-table/thread-table.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/thread-table/thread-table.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/feedback-tab/feedback-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/feedback-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/history-tab/history-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/history-tab/history-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/improvements-tab/playthrough-improvement-card/playthrough-improvement-card.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/improvements-tab/playthrough-improvement-card/playthrough-improvement-card.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/improvements-tab/improvements-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/improvements-tab/improvements-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/mark-all-audio-and-translations-as-needing-update/mark-all-audio-and-translations-as-needing-update.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/mark-all-audio-and-translations-as-needing-update/mark-all-audio-and-translations-as-needing-update.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/param-changes-editor/param-changes-editor.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/param-changes-editor/param-changes-editor.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/preview-tab/preview-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/preview-tab/preview-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/settings-tab/settings-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/settings-tab/settings-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/statistics-tab/bar-chart/bar-chart.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/bar-chart/bar-chart.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/statistics-tab/cyclic-transitions-issue/cyclic-transitions-issue.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/cyclic-transitions-issue/cyclic-transitions-issue.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/statistics-tab/early-quit-issue/early-quit-issue.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/early-quit-issue/early-quit-issue.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/statistics-tab/multiple-incorrect-issue/multiple-incorrect-issue.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/multiple-incorrect-issue/multiple-incorrect-issue.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/statistics-tab/pie-chart/pie-chart.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/pie-chart/pie-chart.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/statistics-tab/playthrough-issues/playthrough-issues.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/playthrough-issues/playthrough-issues.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/statistics-tab/statistics-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/statistics-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/audio-translation-bar/audio-translation-bar.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/audio-translation-bar/audio-translation-bar.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/state-translation/state-translation.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation/state-translation.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/state-translation-editor/state-translation-editor.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation-editor/state-translation-editor.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/state-translation-status-graph/state-translation-status-graph.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation-status-graph/state-translation-status-graph.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/translator-overview/translator-overview.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/translator-overview/translator-overview.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/translation-tab.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/translation-tab.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/value-generator-editor/value-generator-editor.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/value-generator-editor/value-generator-editor.module.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page.module.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page.module.ts");
__webpack_require__(/*! pages/learner-dashboard-page/learner-dashboard-page.module.ts */ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.module.ts");
__webpack_require__(/*! pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.module.ts */ "./core/templates/dev/head/pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.module.ts");
__webpack_require__(/*! pages/library-page/search-bar/search-bar.module.ts */ "./core/templates/dev/head/pages/library-page/search-bar/search-bar.module.ts");
__webpack_require__(/*! pages/library-page/search-results/search-results.module.ts */ "./core/templates/dev/head/pages/library-page/search-results/search-results.module.ts");
__webpack_require__(/*! pages/library-page/library-footer/library-footer.module.ts */ "./core/templates/dev/head/pages/library-page/library-footer/library-footer.module.ts");
__webpack_require__(/*! pages/library-page/library-page.module.ts */ "./core/templates/dev/head/pages/library-page/library-page.module.ts");
__webpack_require__(/*! pages/maintenance-page/maintenance-page.module.ts */ "./core/templates/dev/head/pages/maintenance-page/maintenance-page.module.ts");
__webpack_require__(/*! pages/moderator-page/moderator-page.module.ts */ "./core/templates/dev/head/pages/moderator-page/moderator-page.module.ts");
__webpack_require__(/*! pages/notifications-dashboard-page/notifications-dashboard-page.module.ts */ "./core/templates/dev/head/pages/notifications-dashboard-page/notifications-dashboard-page.module.ts");
__webpack_require__(/*! pages/practice-session-page/practice-session-page.module.ts */ "./core/templates/dev/head/pages/practice-session-page/practice-session-page.module.ts");
__webpack_require__(/*! pages/preferences-page/preferences-page.module.ts */ "./core/templates/dev/head/pages/preferences-page/preferences-page.module.ts");
__webpack_require__(/*! pages/profile-page/profile-page.module.ts */ "./core/templates/dev/head/pages/profile-page/profile-page.module.ts");
__webpack_require__(/*! pages/question-editor-page/question-editor-page.module.ts */ "./core/templates/dev/head/pages/question-editor-page/question-editor-page.module.ts");
__webpack_require__(/*! pages/question-player-page/question-player-page.module.ts */ "./core/templates/dev/head/pages/question-player-page/question-player-page.module.ts");
__webpack_require__(/*! pages/questions-list-page/questions-list-page.module.ts */ "./core/templates/dev/head/pages/questions-list-page/questions-list-page.module.ts");
__webpack_require__(/*! pages/show-suggestion-editor-pages/show-suggestion-modal-for-creator-view/show-suggestion-modal-for-creator-view.module.ts */ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-creator-view/show-suggestion-modal-for-creator-view.module.ts");
__webpack_require__(/*! pages/show-suggestion-editor-pages/show-suggestion-modal-for-editor-view/show-suggestion-modal-for-editor-view.module.ts */ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-editor-view/show-suggestion-modal-for-editor-view.module.ts");
__webpack_require__(/*! pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-local-view/show-suggestion-modal-for-learner-local-view.module.ts */ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-local-view/show-suggestion-modal-for-learner-local-view.module.ts");
__webpack_require__(/*! pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.module.ts */ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.module.ts");
__webpack_require__(/*! pages/show-suggestion-editor-pages/suggestion-modal.module.ts */ "./core/templates/dev/head/pages/show-suggestion-editor-pages/suggestion-modal.module.ts");
__webpack_require__(/*! pages/signup-page/signup-page.module.ts */ "./core/templates/dev/head/pages/signup-page/signup-page.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/worked-example-editor/worked-example-editor.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/worked-example-editor/worked-example-editor.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/skill-concept-card-editor.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/skill-concept-card-editor.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-main-tab/skill-description-editor/skill-description-editor.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-description-editor/skill-description-editor.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/misconception-editor/misconception-editor.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/misconception-editor/misconception-editor.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/skill-misconceptions-editor.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/skill-misconceptions-editor.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-main-tab/skill-editor-main-tab.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-editor-main-tab.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-navbar/skill-editor-navbar.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-navbar/skill-editor-navbar.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-navbar-breadcrumb/skill-editor-navbar-breadcrumb.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-navbar-breadcrumb/skill-editor-navbar-breadcrumb.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-questions-tab/skill-editor-questions-tab.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-questions-tab/skill-editor-questions-tab.module.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-page.module.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.module.ts");
__webpack_require__(/*! pages/splash-page/splash-page.module.ts */ "./core/templates/dev/head/pages/splash-page/splash-page.module.ts");
__webpack_require__(/*! pages/state-editor/state-content-editor/state-content-editor.module.ts */ "./core/templates/dev/head/pages/state-editor/state-content-editor/state-content-editor.module.ts");
__webpack_require__(/*! pages/state-editor/state-hints-editor/state-hints-editor.module.ts */ "./core/templates/dev/head/pages/state-editor/state-hints-editor/state-hints-editor.module.ts");
__webpack_require__(/*! pages/state-editor/state-interaction-editor/state-interaction-editor.module.ts */ "./core/templates/dev/head/pages/state-editor/state-interaction-editor/state-interaction-editor.module.ts");
__webpack_require__(/*! pages/state-editor/state-responses/state-responses.module.ts */ "./core/templates/dev/head/pages/state-editor/state-responses/state-responses.module.ts");
__webpack_require__(/*! pages/state-editor/state-solution-editor/state-solution-editor.module.ts */ "./core/templates/dev/head/pages/state-editor/state-solution-editor/state-solution-editor.module.ts");
__webpack_require__(/*! pages/state-editor/state-editor.module.ts */ "./core/templates/dev/head/pages/state-editor/state-editor.module.ts");
__webpack_require__(/*! pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.module.ts */ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.module.ts");
__webpack_require__(/*! pages/story-editor-page/main-story-editor/main-story-editor.module.ts */ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/main-story-editor.module.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-navbar/story-editor-navbar.module.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar/story-editor-navbar.module.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.module.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.module.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.module.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.module.ts");
__webpack_require__(/*! pages/thanks-page/thanks-page.module.ts */ "./core/templates/dev/head/pages/thanks-page/thanks-page.module.ts");
__webpack_require__(/*! pages/teach-page/teach-page.module.ts */ "./core/templates/dev/head/pages/teach-page/teach-page.module.ts");
__webpack_require__(/*! pages/topic-editor-page/main-topic-editor/main-topic-editor-stories-list/main-topic-editor-stories-list.module.ts */ "./core/templates/dev/head/pages/topic-editor-page/main-topic-editor/main-topic-editor-stories-list/main-topic-editor-stories-list.module.ts");
__webpack_require__(/*! pages/topic-editor-page/main-topic-editor/main-topic-editor.module.ts */ "./core/templates/dev/head/pages/topic-editor-page/main-topic-editor/main-topic-editor.module.ts");
__webpack_require__(/*! pages/topic-editor-page/questions-tab/questions-tab.module.ts */ "./core/templates/dev/head/pages/topic-editor-page/questions-tab/questions-tab.module.ts");
__webpack_require__(/*! pages/topic-editor-page/subtopics-list-tab/subtopics-list-tab.module.ts */ "./core/templates/dev/head/pages/topic-editor-page/subtopics-list-tab/subtopics-list-tab.module.ts");
__webpack_require__(/*! pages/topic-editor-page/topic-editor-navbar/topic-editor-navbar.module.ts */ "./core/templates/dev/head/pages/topic-editor-page/topic-editor-navbar/topic-editor-navbar.module.ts");
__webpack_require__(/*! pages/topic-editor-page/topic-editor-navbar-breadcrumb/topic-editor-navbar-breadcrumb.module.ts */ "./core/templates/dev/head/pages/topic-editor-page/topic-editor-navbar-breadcrumb/topic-editor-navbar-breadcrumb.module.ts");
__webpack_require__(/*! pages/topic-editor-page/topic-editor-page.module.ts */ "./core/templates/dev/head/pages/topic-editor-page/topic-editor-page.module.ts");
__webpack_require__(/*! pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.module.ts */ "./core/templates/dev/head/pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.module.ts");
__webpack_require__(/*! pages/topic-landing-page/topic-landing-page.module.ts */ "./core/templates/dev/head/pages/topic-landing-page/topic-landing-page.module.ts");
__webpack_require__(/*! pages/topic-viewer-page/stories-list/stories-list.module.ts */ "./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.module.ts");
__webpack_require__(/*! pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.module.ts */ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.module.ts");
__webpack_require__(/*! pages/topic-viewer-page/topic-viewer-page.module.ts */ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.module.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/select-topics/select-topics.module.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/select-topics/select-topics.module.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/skills-list/skills-list.module.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/skills-list/skills-list.module.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.module.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.module.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.module.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.module.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-list/topics-list.module.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-list/topics-list.module.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts");
__webpack_require__(/*! I18nFooter.ts */ "./core/templates/dev/head/I18nFooter.ts");
__webpack_require__(/*! directives/FocusOnDirective.ts */ "./core/templates/dev/head/directives/FocusOnDirective.ts");
__webpack_require__(/*! pages/Base.ts */ "./core/templates/dev/head/pages/Base.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/NavigationService.ts */ "./core/templates/dev/head/services/NavigationService.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
__webpack_require__(/*! services/DebouncerService.ts */ "./core/templates/dev/head/services/DebouncerService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/TranslationFileHashLoaderService.ts */ "./core/templates/dev/head/services/TranslationFileHashLoaderService.ts");
__webpack_require__(/*! services/RteHelperService.ts */ "./core/templates/dev/head/services/RteHelperService.ts");
__webpack_require__(/*! services/StateRulesStatsService.ts */ "./core/templates/dev/head/services/StateRulesStatsService.ts");
__webpack_require__(/*! services/ConstructTranslationIdsService.ts */ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/PromoBarService.ts */ "./core/templates/dev/head/services/PromoBarService.ts");
__webpack_require__(/*! services/contextual/DeviceInfoService.ts */ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
__webpack_require__(/*! services/stateful/BackgroundMaskService.ts */ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! components/common-layout-directives/alert-message/alert-message.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/alert-message/alert-message.directive.ts");
__webpack_require__(/*! components/button-directives/create-button/create-activity-button.directive.ts */ "./core/templates/dev/head/components/button-directives/create-button/create-activity-button.directive.ts");
__webpack_require__(/*! components/forms/forms-directives/object-editor/object-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/object-editor/object-editor.directive.ts");
__webpack_require__(/*! components/common-layout-directives/promo-bar/promo-bar.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/promo-bar/promo-bar.directive.ts");
__webpack_require__(/*! components/common-layout-directives/side-navigation-bar/side-navigation-bar.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/side-navigation-bar/side-navigation-bar.directive.ts");
__webpack_require__(/*! components/button-directives/social-buttons/social-buttons.directive.ts */ "./core/templates/dev/head/components/button-directives/social-buttons/social-buttons.directive.ts");
__webpack_require__(/*! components/common-layout-directives/top-navigation-bar/top-navigation-bar.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/top-navigation-bar/top-navigation-bar.directive.ts");
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/user/UserInfoObjectFactory.ts */ "./core/templates/dev/head/domain/user/UserInfoObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! directives/FocusOnDirective.ts */ "./core/templates/dev/head/directives/FocusOnDirective.ts");
__webpack_require__(/*! components/forms/forms-validators/is-at-least.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-at-least.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-at-most.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-at-most.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-float.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-float.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-integer.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-integer.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-nonempty.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-nonempty.filter.ts");
__webpack_require__(/*! components/forms/forms-directives/apply-validation/apply-validation.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/apply-validation/apply-validation.directive.ts");
__webpack_require__(/*! components/forms/forms-directives/object-editor/object-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/object-editor/object-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-directives/require-is-float/require-is-float.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/require-is-float/require-is-float.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts");
// ^^^ this block of requires should be removed ^^^
__webpack_require__(/*! pages/admin-page/admin-navbar/admin-navbar.directive.ts */ "./core/templates/dev/head/pages/admin-page/admin-navbar/admin-navbar.directive.ts");
__webpack_require__(/*! pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/config-tab/admin-config-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/config-tab/admin-config-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/jobs-tab/admin-jobs-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/misc-tab/admin-misc-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/misc-tab/admin-misc-tab.directive.ts");
__webpack_require__(/*! pages/admin-page/roles-tab/admin-roles-tab.directive.ts */ "./core/templates/dev/head/pages/admin-page/roles-tab/admin-roles-tab.directive.ts");
__webpack_require__(/*! domain/objects/NumberWithUnitsObjectFactory.ts */ "./core/templates/dev/head/domain/objects/NumberWithUnitsObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/admin-page-services/admin-router/admin-router.service.ts */ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-router/admin-router.service.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
oppia.controller('Admin', [
    '$http', '$location', '$scope', 'AdminRouterService', 'DEV_MODE',
    function ($http, $location, $scope, AdminRouterService, DEV_MODE) {
        $scope.userEmail = GLOBALS.USER_EMAIL;
        $scope.inDevMode = DEV_MODE;
        $scope.statusMessage = '';
        $scope.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
        $scope.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
        $scope.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
        $scope.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
        $scope.isMiscTabOpen = AdminRouterService.isMiscTabOpen;
        $scope.setStatusMessage = function (statusMessage) {
            $scope.statusMessage = statusMessage;
        };
        $scope.$on('$locationChangeSuccess', function () {
            AdminRouterService.showTab($location.path().replace('/', '#'));
        });
    }
]);


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
__webpack_require__(/*! pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts");
angular.module('adminConfigTabModule').directive('adminConfigTab', [
    '$http', 'AdminTaskManagerService', 'UrlInterpolationService',
    'ADMIN_HANDLER_URL', function ($http, AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/config-tab/' +
                'admin-config-tab.directive.html'),
            controller: ['$scope', function ($scope) {
                    $scope.configProperties = {};
                    $scope.isNonemptyObject = function (object) {
                        var hasAtLeastOneElement = false;
                        for (var property in object) {
                            hasAtLeastOneElement = true;
                        }
                        return hasAtLeastOneElement;
                    };
                    $scope.reloadConfigProperties = function () {
                        $http.get(ADMIN_HANDLER_URL).then(function (response) {
                            $scope.configProperties = response.data.config_properties;
                        });
                    };
                    $scope.revertToDefaultConfigPropertyValue = function (configPropertyId) {
                        if (!confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'revert_config_property',
                            config_property_id: configPropertyId
                        }).then(function () {
                            $scope.setStatusMessage('Config property reverted successfully.');
                            $scope.reloadConfigProperties();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    $scope.saveConfigProperties = function () {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        $scope.setStatusMessage('Saving...');
                        AdminTaskManagerService.startTask();
                        var newConfigPropertyValues = {};
                        for (var property in $scope.configProperties) {
                            newConfigPropertyValues[property] = ($scope.configProperties[property].value);
                        }
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'save_config_properties',
                            new_config_property_values: newConfigPropertyValues
                        }).then(function () {
                            $scope.setStatusMessage('Data saved successfully.');
                            AdminTaskManagerService.finishTask();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                            AdminTaskManagerService.finishTask();
                        });
                    };
                    $scope.reloadConfigProperties();
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
angular.module('adminJobsTabModule').directive('adminJobsTab', [
    '$http', '$timeout', 'UrlInterpolationService', 'ADMIN_HANDLER_URL',
    'ADMIN_JOB_OUTPUT_URL_TEMPLATE',
    function ($http, $timeout, UrlInterpolationService, ADMIN_HANDLER_URL, ADMIN_JOB_OUTPUT_URL_TEMPLATE) {
        return {
            restrict: 'E',
            scope: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/jobs-tab/' +
                'admin-jobs-tab.directive.html'),
            controller: ['$scope', function ($scope) {
                    $scope.HUMAN_READABLE_CURRENT_TIME = (GLOBALS.HUMAN_READABLE_CURRENT_TIME);
                    $scope.CONTINUOUS_COMPUTATIONS_DATA = (GLOBALS.CONTINUOUS_COMPUTATIONS_DATA);
                    $scope.ONE_OFF_JOB_SPECS = GLOBALS.ONE_OFF_JOB_SPECS;
                    $scope.UNFINISHED_JOB_DATA = GLOBALS.UNFINISHED_JOB_DATA;
                    $scope.RECENT_JOB_DATA = GLOBALS.RECENT_JOB_DATA;
                    $scope.showingJobOutput = false;
                    $scope.showJobOutput = function (jobId) {
                        var adminJobOutputUrl = UrlInterpolationService.interpolateUrl(ADMIN_JOB_OUTPUT_URL_TEMPLATE, {
                            jobId: jobId
                        });
                        $http.get(adminJobOutputUrl).then(function (response) {
                            $scope.showingJobOutput = true;
                            $scope.jobOutput = response.data.output || [];
                            $scope.jobOutput.sort();
                            $timeout(function () {
                                document.querySelector('#job-output').scrollIntoView();
                            });
                        });
                    };
                    $scope.startNewJob = function (jobType) {
                        $scope.setStatusMessage('Starting new job...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'start_new_job',
                            job_type: jobType
                        }).then(function () {
                            $scope.setStatusMessage('Job started successfully.');
                            window.location.reload();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    $scope.cancelJob = function (jobId, jobType) {
                        $scope.setStatusMessage('Cancelling job...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'cancel_job',
                            job_id: jobId,
                            job_type: jobType
                        }).then(function () {
                            $scope.setStatusMessage('Abort signal sent to job.');
                            window.location.reload();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    $scope.startComputation = function (computationType) {
                        $scope.setStatusMessage('Starting computation...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'start_computation',
                            computation_type: computationType
                        }).then(function () {
                            $scope.setStatusMessage('Computation started successfully.');
                            window.location.reload();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                    };
                    $scope.stopComputation = function (computationType) {
                        $scope.setStatusMessage('Stopping computation...');
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'stop_computation',
                            computation_type: computationType
                        }).then(function () {
                            $scope.setStatusMessage('Abort signal sent to computation.');
                            window.location.reload();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
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
__webpack_require__(/*! pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts");
angular.module('adminMiscTabModule').directive('adminMiscTab', [
    '$http', '$window', 'AdminTaskManagerService', 'UrlInterpolationService',
    'ADMIN_HANDLER_URL', 'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL',
    function ($http, $window, AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL, ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/misc-tab/' +
                'admin-misc-tab.directive.html'),
            controller: ['$scope', function ($scope) {
                    var DATA_EXTRACTION_QUERY_HANDLER_URL = ('/explorationdataextractionhandler');
                    $scope.clearSearchIndex = function () {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        if (!confirm('This action is irreversible. Are you sure?')) {
                            return;
                        }
                        $scope.setStatusMessage('Clearing search index...');
                        AdminTaskManagerService.startTask();
                        $http.post(ADMIN_HANDLER_URL, {
                            action: 'clear_search_index'
                        }).then(function () {
                            $scope.setStatusMessage('Index successfully cleared.');
                            AdminTaskManagerService.finishTask();
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                            AdminTaskManagerService.finishTask();
                        });
                    };
                    $scope.uploadTopicSimilaritiesFile = function () {
                        var file = document.getElementById('topicSimilaritiesFile').files[0];
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var data = e.target.result;
                            $http.post(ADMIN_HANDLER_URL, {
                                action: 'upload_topic_similarities',
                                data: data
                            }).then(function () {
                                $scope.setStatusMessage('Topic similarities uploaded successfully.');
                            }, function (errorResponse) {
                                $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                            });
                        };
                        reader.readAsText(file);
                    };
                    $scope.downloadTopicSimilaritiesFile = function () {
                        $window.location.href = ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
                    };
                    var setDataExtractionQueryStatusMessage = function (message) {
                        $scope.showDataExtractionQueryStatus = true;
                        $scope.dataExtractionQueryStatusMessage = message;
                    };
                    $scope.submitQuery = function () {
                        var STATUS_PENDING = ('Data extraction query has been submitted. Please wait.');
                        var STATUS_FINISHED = 'Loading the extracted data ...';
                        var STATUS_FAILED = 'Error, ';
                        setDataExtractionQueryStatusMessage(STATUS_PENDING);
                        var downloadUrl = DATA_EXTRACTION_QUERY_HANDLER_URL + '?';
                        downloadUrl += 'exp_id=' + encodeURIComponent($scope.expId);
                        downloadUrl += '&exp_version=' + encodeURIComponent($scope.expVersion);
                        downloadUrl += '&state_name=' + encodeURIComponent($scope.stateName);
                        downloadUrl += '&num_answers=' + encodeURIComponent($scope.numAnswers);
                        $window.open(downloadUrl);
                    };
                    $scope.resetForm = function () {
                        $scope.expId = '';
                        $scope.expVersion = 0;
                        $scope.stateName = '';
                        $scope.numAnswers = 0;
                        $scope.showDataExtractionQueryStatus = false;
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
__webpack_require__(/*! pages/admin-page/roles-tab/roles-graph/role-graph.directive.ts */ "./core/templates/dev/head/pages/admin-page/roles-tab/roles-graph/role-graph.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts */ "./core/templates/dev/head/pages/admin-page/admin-page-services/admin-task-manager/admin-task-manager.service.ts");
angular.module('adminRolesTabModule').directive('adminRolesTab', [
    '$http', 'AdminTaskManagerService', 'UrlInterpolationService',
    'ADMIN_ROLE_HANDLER_URL',
    function ($http, AdminTaskManagerService, UrlInterpolationService, ADMIN_ROLE_HANDLER_URL) {
        return {
            restrict: 'E',
            scope: {
                setStatusMessage: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/roles-tab/admin-roles-tab.directive.html'),
            controller: ['$scope', function ($scope) {
                    $scope.UPDATABLE_ROLES = GLOBALS.UPDATABLE_ROLES;
                    $scope.VIEWABLE_ROLES = GLOBALS.VIEWABLE_ROLES;
                    $scope.topicSummaries = GLOBALS.TOPIC_SUMMARIES;
                    $scope.graphData = GLOBALS.ROLE_GRAPH_DATA;
                    $scope.resultRolesVisible = false;
                    $scope.result = {};
                    $scope.setStatusMessage('');
                    $scope.viewFormValues = {};
                    $scope.updateFormValues = {};
                    $scope.viewFormValues.method = 'role';
                    $scope.graphDataLoaded = false;
                    // Calculating initStateId and finalStateIds for graphData
                    // Since role graph is acyclic, node with no incoming edge
                    // is initState and nodes with no outgoing edge are finalStates.
                    var hasIncomingEdge = [];
                    var hasOutgoingEdge = [];
                    for (var i = 0; i < $scope.graphData.links.length; i++) {
                        hasIncomingEdge.push($scope.graphData.links[i].target);
                        hasOutgoingEdge.push($scope.graphData.links[i].source);
                    }
                    var finalStateIds = [];
                    for (var role in $scope.graphData.nodes) {
                        if ($scope.graphData.nodes.hasOwnProperty(role)) {
                            if (hasIncomingEdge.indexOf(role) === -1) {
                                $scope.graphData.initStateId = role;
                            }
                            if (hasOutgoingEdge.indexOf(role) === -1) {
                                finalStateIds.push(role);
                            }
                        }
                    }
                    $scope.graphData.finalStateIds = finalStateIds;
                    $scope.graphDataLoaded = true;
                    $scope.submitRoleViewForm = function (values) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        $scope.setStatusMessage('Processing query...');
                        AdminTaskManagerService.startTask();
                        $scope.result = {};
                        $http.get(ADMIN_ROLE_HANDLER_URL, {
                            params: {
                                method: values.method,
                                role: values.role,
                                username: values.username
                            }
                        }).then(function (response) {
                            $scope.result = response.data;
                            if (Object.keys($scope.result).length === 0) {
                                $scope.resultRolesVisible = false;
                                $scope.setStatusMessage('No results.');
                            }
                            else {
                                $scope.resultRolesVisible = true;
                                $scope.setStatusMessage('Success.');
                            }
                            $scope.viewFormValues.username = '';
                            $scope.viewFormValues.role = '';
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                    $scope.submitUpdateRoleForm = function (values) {
                        if (AdminTaskManagerService.isTaskRunning()) {
                            return;
                        }
                        $scope.setStatusMessage('Updating User Role');
                        AdminTaskManagerService.startTask();
                        $http.post(ADMIN_ROLE_HANDLER_URL, {
                            role: values.newRole,
                            username: values.username,
                            topic_id: values.topicId
                        }).then(function () {
                            $scope.setStatusMessage('Role of ' + values.username +
                                ' successfully updated to ' + values.newRole);
                            $scope.updateFormValues.username = '';
                            $scope.updateFormValues.newRole = '';
                            $scope.updateFormValues.topicId = '';
                        }, function (errorResponse) {
                            $scope.setStatusMessage('Server error: ' + errorResponse.data.error);
                        });
                        AdminTaskManagerService.finishTask();
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/roles-tab/roles-graph/role-graph.directive.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/roles-tab/roles-graph/role-graph.directive.ts ***!
  \************************************************************************************************/
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
__webpack_require__(/*! components/StateGraphLayoutService.ts */ "./core/templates/dev/head/components/StateGraphLayoutService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
angular.module('roleGraphModule').directive('roleGraph', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
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
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/admin-page/roles-tab/roles-graph/role-graph.directive.html'),
            controller: [
                '$scope', '$element', '$timeout', '$filter', 'StateGraphLayoutService',
                'MAX_NODES_PER_ROW', 'MAX_NODE_LABEL_LENGTH',
                function ($scope, $element, $timeout, $filter, StateGraphLayoutService, MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH) {
                    var getElementDimensions = function () {
                        return {
                            h: $element.height(),
                            w: $element.width()
                        };
                    };
                    $scope.getGraphHeightInPixels = function () {
                        return Math.max($scope.GRAPH_HEIGHT, 300);
                    };
                    $scope.drawGraph = function (nodes, originalLinks, initStateId, finalStateIds) {
                        $scope.finalStateIds = finalStateIds;
                        var links = angular.copy(originalLinks);
                        var nodeData = StateGraphLayoutService.computeLayout(nodes, links, initStateId, angular.copy(finalStateIds));
                        $scope.GRAPH_WIDTH = StateGraphLayoutService.getGraphWidth(MAX_NODES_PER_ROW, MAX_NODE_LABEL_LENGTH);
                        $scope.GRAPH_HEIGHT = StateGraphLayoutService.getGraphHeight(nodeData);
                        nodeData = StateGraphLayoutService.modifyPositionValues(nodeData, $scope.GRAPH_WIDTH, $scope.GRAPH_HEIGHT);
                        $scope.augmentedLinks = StateGraphLayoutService.getAugmentedLinks(nodeData, links);
                        $scope.getNodeTitle = function (node) {
                            return node.label;
                        };
                        $scope.getTruncatedLabel = function (nodeLabel) {
                            return $filter('truncate')(nodeLabel, MAX_NODE_LABEL_LENGTH);
                        };
                        // creating list of nodes to display.
                        $scope.nodeList = [];
                        for (var nodeId in nodeData) {
                            $scope.nodeList.push(nodeData[nodeId]);
                        }
                    };
                    if ($scope.graphDataLoaded) {
                        $scope.drawGraph($scope.graphData.nodes, $scope.graphData.links, $scope.graphData.initStateId, $scope.graphData.finalStateIds);
                    }
                }
            ]
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9TdGF0ZUdyYXBoTGF5b3V0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1leHByZXNzaW9uLWVkaXRvci9zY2hlbWEtYmFzZWQtZXhwcmVzc2lvbi1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy90cnVuY2F0ZS5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hY3Rpdml0aWVzLXRhYi9hZG1pbi1kZXYtbW9kZS1hY3Rpdml0aWVzLXRhYi9hZG1pbi1kZXYtbW9kZS1hY3Rpdml0aWVzLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hY3Rpdml0aWVzLXRhYi9hZG1pbi1wcm9kLW1vZGUtYWN0aXZpdGllcy10YWIvYWRtaW4tcHJvZC1tb2RlLWFjdGl2aXRpZXMtdGFiLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLW5hdmJhci9hZG1pbi1uYXZiYXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tcGFnZS1zZXJ2aWNlcy9hZG1pbi1yb3V0ZXIvYWRtaW4tcm91dGVyLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLXNlcnZpY2VzL2FkbWluLXRhc2stbWFuYWdlci9hZG1pbi10YXNrLW1hbmFnZXIuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2NvbmZpZy10YWIvYWRtaW4tY29uZmlnLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9qb2JzLXRhYi9hZG1pbi1qb2JzLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9taXNjLXRhYi9hZG1pbi1taXNjLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvYWRtaW4tcm9sZXMtdGFiLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL3JvbGVzLXRhYi9yb2xlcy1ncmFwaC9yb2xlLWdyYXBoLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBUSxvQkFBb0I7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBaUIsNEJBQTRCO0FBQzdDO0FBQ0E7QUFDQSwwQkFBa0IsMkJB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QUFPLENBQUMsc01BQ3lCO0FBQ2pDLG1CQUFPLENBQUMsa0xBQXlFO0FBQ2pGLG1CQUFPLENBQUMsc0tBQW1FO0FBQzNFLG1CQUFPLENBQUMsc0xBQTJFO0FBQ25GLG1CQUFPLENBQUMsOE1BQzJCO0FBQ25DLG1CQUFPLENBQUMsME1BQzBCO0FBQ2xDLG1CQUFPLENBQUMsZ0xBQXdFO0FBQ2hGLG1CQUFPLENBQUMsZ0xBQXdFO0FBQ2hGLG1CQUFPLENBQUMsOExBQ3dCO0FBQ2hDLG1CQUFPLENBQUMsME1BQzJCO0FBQ25DLG1CQUFPLENBQUMsMEtBQXFFO0FBQzdFLG1CQUFPLENBQUMsc0xBQTJFO0FBQ25GLG1CQUFPLENBQUMsa0xBQXlFO0FBQ2pGLG1CQUFPLENBQUMsOExBQ3dCO0FBQ2hDLG1CQUFPLENBQUMsOExBQ3dCO0FBQ2hDLG1CQUFPLENBQUMsNEpBQThEO0FBQ3RFLG1CQUFPLENBQUMsOFFBQ3lEO0FBQ2pFLG1CQUFPLENBQUMsMFJBQytEO0FBQ3ZFLG1CQUFPLENBQUMsc1JBQzZEO0FBQ3JFLG1CQUFPLENBQUMsOFFBQ3lEO0FBQ2pFLG1CQUFPLENBQUMsa1JBQzJEO0FBQ25FLG1CQUFPLENBQUMsOFFBQ3lEO0FBQ2pFLG1CQUFPLENBQUMsMFFBQ3VEO0FBQy9ELG1CQUFPLENBQUMsOFFBQ3lEO0FBQ2pFLG1CQUFPLENBQUMsMFJBQytEO0FBQ3ZFLG1CQUFPLENBQUMsOFBBQ3NDO0FBQzlDLG1CQUFPLENBQUMsa05BQzJCO0FBQ25DLG1CQUFPLENBQUMsNEtBQXNFO0FBQzlFLG1CQUFPLENBQUMsZ0xBQXdFO0FBQ2hGLG1CQUFPLENBQUMsNEpBQThEO0FBQ3RFLG1CQUFPLENBQUMsb0dBQWtDO0FBQzFDLG1CQUFPLENBQUMsd0xBQTRFO0FBQ3BGLG1CQUFPLENBQUMsd01BQzBCO0FBQ2xDLG1CQUFPLENBQUMsb01BQ3lCO0FBQ2pDLG1CQUFPLENBQUMsNEtBQXNFO0FBQzlFLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsNEdBQXNDO0FBQzlDLG1CQUFPLENBQUMsd0tBQW9FO0FBQzVFLG1CQUFPLENBQUMsd0lBQW9EO0FBQzVELG1CQUFPLENBQUMsa09BQ2tDO0FBQzFDLG1CQUFPLENBQUMsc05BQytCO0FBQ3ZDLG1CQUFPLENBQUMsb0pBQTBEO0FBQ2xFLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsd0lBQW9EO0FBQzVELG1CQUFPLENBQUMsb0tBQWtFO0FBQzFFLG1CQUFPLENBQUMsd09BQ21DO0FBQzNDLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsb0dBQWtDO0FBQzFDLG1CQUFPLENBQUMsNEpBQThEO0FBQ3RFLG1CQUFPLENBQUMsNE5BQytCO0FBQ3ZDLG1CQUFPLENBQUMsZ09BQ2dDO0FBQ3hDLG1CQUFPLENBQUMsd01BQzBCO0FBQ2xDLG1CQUFPLENBQUMsNEtBQXNFO0FBQzlFLG1CQUFPLENBQUMsd0xBQTRFO0FBQ3BGLG1CQUFPLENBQUMsa0tBQWlFO0FBQ3pFLG1CQUFPLENBQUMsc0ZBQTJCO0FBQ25DLG1CQUFPLENBQUMsOEdBQXVDO0FBQy9DLG1CQUFPLENBQUMsOE9BQ3FDO0FBQzdDLG1CQUFPLENBQUMsa1BBQ3NDO0FBQzlDLG1CQUFPLENBQUMsNElBQXNEO0FBQzlELG1CQUFPLENBQUMsZ0pBQXdEO0FBQ2hFLG1CQUFPLENBQUMsd0lBQW9EO0FBQzVELG1CQUFPLENBQUMsd0lBQW9EO0FBQzVELG1CQUFPLENBQUMsMEpBQTZEO0FBQ3JFLG1CQUFPLENBQUMsNElBQXNEO0FBQzlELG1CQUFPLENBQUMsOEdBQXVDO0FBQy9DLG1CQUFPLENBQUMsd0xBQTRFO0FBQ3BGLG1CQUFPLENBQUMsb01BQzRCO0FBQ3BDLG1CQUFPLENBQUMsb01BQzRCO0FBQ3BDLG1CQUFPLENBQUMsOEpBQStEO0FBQ3ZFLG1CQUFPLENBQUMsOEpBQStEO0FBQ3ZFLG1CQUFPLENBQUMsa0hBQXlDO0FBQ2pELG1CQUFPLENBQUMsd01BQzhCO0FBQ3RDLG1CQUFPLENBQUMsc0pBQTJEO0FBQ25FLG1CQUFPLENBQUMsOEdBQXVDO0FBQy9DLG1CQUFPLENBQUMsc05BQ2dDO0FBQ3hDLG1CQUFPLENBQUMsMExBQ3lCO0FBQ2pDLG1CQUFPLENBQUMsd09BQ3lCO0FBQ2pDLG1CQUFPLENBQUMsd1FBQzJEO0FBQ25FLG1CQUFPLENBQUMsd09BQ3lCO0FBQ2pDLG1CQUFPLENBQUMsNFFBQzZEO0FBQ3JFLG1CQUFPLENBQUMsNFBBQ3FEO0FBQzdELG1CQUFPLENBQUMsNE5BQ3NCO0FBQzlCLG1CQUFPLENBQUMsZ1JBQytEO0FBQ3ZFLG1CQUFPLENBQUMsOE1BQzhCO0FBQ3RDLG1CQUFPLENBQUMsc09BQ29DO0FBQzVDLG1CQUFPLENBQUMsc1FBQzRDO0FBQ3BELG1CQUFPLENBQUMsc05BQ2dDO0FBQ3hDLG1CQUFPLENBQUMsZ01BQ29CO0FBQzVCLG1CQUFPLENBQUMsc0tBQW1FO0FBQzNFLG1CQUFPLENBQUMsa0tBQWlFO0FBQ3pFLG1CQUFPLENBQUMsd1FBQ2lFO0FBQ3pFLG1CQUFPLENBQUMsc0xBQTJFO0FBQ25GLG1CQUFPLENBQUMsMFRBRXlEO0FBQ2pFLG1CQUFPLENBQUMsc01BQzRCO0FBQ3BDLG1CQUFPLENBQUMsa0tBQWlFO0FBQ3pFLG1CQUFPLENBQUMsc0tBQW1FO0FBQzNFLG1CQUFPLENBQUMsd0xBQTRFO0FBQ3BGLG1CQUFPLENBQUMsb1BBQ2dDO0FBQ3hDLG1CQUFPLENBQUMsb05BQ3dCO0FBQ2hDLG1CQUFPLENBQUMsb1BBQ2dDO0FBQ3hDLG1CQUFPLENBQUMsd0xBQTRFO0FBQ3BGLG1CQUFPLENBQUMsNE5BQzBCO0FBQ2xDLG1CQUFPLENBQUMsOEtBQXVFO0FBQy9FLG1CQUFPLENBQUMsME9BQzZCO0FBQ3JDLG1CQUFPLENBQUMsME5BQ3lCO0FBQ2pDLG1CQUFPLENBQUMsc1BBQ2dDO0FBQ3hDLG1CQUFPLENBQUMsOFFBQ3FFO0FBQzdFLG1CQUFPLENBQUMsa09BQzJCO0FBQ25DLG1CQUFPLENBQUMsa0xBQXlFO0FBQ2pGLG1CQUFPLENBQUMsOE1BQzhCO0FBQ3RDLG1CQUFPLENBQUMsa0tBQWlFO0FBQ3pFLG1CQUFPLENBQUMsOEpBQStEO0FBQ3ZFLG1CQUFPLENBQUMsZ05BQ29DO0FBQzVDLG1CQUFPLENBQUMsd0lBQW9EO0FBQzVELG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsc0hBQTJDO0FBQ25ELG1CQUFPLENBQUMsc0lBQW1EO0FBQzNELG1CQUFPLENBQUMsOEhBQStDO0FBQ3ZELG1CQUFPLENBQUMsc0xBQTJFO0FBQ25GLG1CQUFPLENBQUMsMEpBQTZEO0FBQ3JFLG1CQUFPLENBQUMsc0lBQW1EO0FBQzNELG1CQUFPLENBQUMsc0hBQTJDO0FBQ25ELG1CQUFPLENBQUMsc0pBQTJEO0FBQ25FLG1CQUFPLENBQUMsc0pBQTJEO0FBQ25FLG1CQUFPLENBQUMsa0pBQXlEO0FBQ2pFLG1CQUFPLENBQUMsd1JBQzhDO0FBQ3RELG1CQUFPLENBQUMsb1JBQzZDO0FBQ3JELG1CQUFPLENBQUMsZ1RBRW9EO0FBQzVELG1CQUFPLENBQUMsd1JBQzhDO0FBQ3RELG1CQUFPLENBQUMsOEpBQStEO0FBQ3ZFLG1CQUFPLENBQUMsa0hBQXlDO0FBQ2pELG1CQUFPLENBQUMsOFJBQ21EO0FBQzNELG1CQUFPLENBQUMsMFBBQ2lDO0FBQ3pDLG1CQUFPLENBQUMsc1BBQ2dDO0FBQ3hDLG1CQUFPLENBQUMsOFJBQ2lEO0FBQ3pELG1CQUFPLENBQUMsa1FBQ21DO0FBQzNDLG1CQUFPLENBQUMsOExBQzZCO0FBQ3JDLG1CQUFPLENBQUMsc0xBQTJFO0FBQ25GLG1CQUFPLENBQUMsa09BQ3NDO0FBQzlDLG1CQUFPLENBQUMsa05BQ2tDO0FBQzFDLG1CQUFPLENBQUMsMElBQXFEO0FBQzdELG1CQUFPLENBQUMsa0hBQXlDO0FBQ2pELG1CQUFPLENBQUMsZ0xBQXdFO0FBQ2hGLG1CQUFPLENBQUMsd0tBQW9FO0FBQzVFLG1CQUFPLENBQUMsZ01BQ2dDO0FBQ3hDLG1CQUFPLENBQUMsNEpBQThEO0FBQ3RFLG1CQUFPLENBQUMsb0xBQTBFO0FBQ2xGLG1CQUFPLENBQUMsc0hBQTJDO0FBQ25ELG1C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QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDhHQUF1QztBQUMvQyxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNJQUFtRDtBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWRtaW4uYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJhZG1pblwiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLmNvbnRyb2xsZXIudHNcIixcImFib3V0fmFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lbWFpbF9kYXNoYm9hcmR+YzFlNTBjYzBcIixcImFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfnNraWxsX2VkaXRvcn5zdG9+N2M1ZTAzNmFcIixcImFkbWlufmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+bW9kZXJhdG9yfnNraWxsX2VkaXRvcn5zdG9yeV9lZGl0b3J+dG9+M2Y2ZWY3MzhcIixcImFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfnNraWxsX2VkaXRvcn50b3B+NjFiYjJkZTFcIixcImFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+c2tpbGxfZWRpdG9yfnRvcGljX2V+M2E3MjgxZDBcIixcImFkbWlufmFwcFwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlcyBmb3IgcmV1c2FibGUgZGF0YSB2aXN1YWxpemF0aW9uIGNvbXBvbmVudHMuXG4gKi9cbi8vIFNlcnZpY2UgZm9yIGNvbXB1dGluZyBsYXlvdXQgb2Ygc3RhdGUgZ3JhcGggbm9kZXMuXG5vcHBpYS5mYWN0b3J5KCdTdGF0ZUdyYXBoTGF5b3V0U2VydmljZScsIFtcbiAgICAnJGZpbHRlcicsICckbG9nJywgJ01BWF9OT0RFU19QRVJfUk9XJyxcbiAgICBmdW5jdGlvbiAoJGZpbHRlciwgJGxvZywgTUFYX05PREVTX1BFUl9ST1cpIHtcbiAgICAgICAgdmFyIE1BWF9JTkRFTlRBVElPTl9MRVZFTCA9IDIuNTtcbiAgICAgICAgLy8gVGhlIGxhc3QgcmVzdWx0IG9mIGEgY2FsbCB0byBjb21wdXRlTGF5b3V0KCkuIFVzZWQgZm9yIGRldGVybWluaW5nIHRoZVxuICAgICAgICAvLyBvcmRlciBpbiB3aGljaCB0byBzcGVjaWZ5IHN0YXRlcyBpbiBydWxlcy5cbiAgICAgICAgdmFyIGxhc3RDb21wdXRlZEFycmFuZ2VtZW50ID0gbnVsbDtcbiAgICAgICAgdmFyIGdldEdyYXBoQXNBZGphY2VuY3lMaXN0cyA9IGZ1bmN0aW9uIChub2RlcywgbGlua3MpIHtcbiAgICAgICAgICAgIHZhciBhZGphY2VuY3lMaXN0cyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgbm9kZUlkIGluIG5vZGVzKSB7XG4gICAgICAgICAgICAgICAgYWRqYWNlbmN5TGlzdHNbbm9kZUlkXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsaW5rc1tpXS5zb3VyY2UgIT09IGxpbmtzW2ldLnRhcmdldCAmJlxuICAgICAgICAgICAgICAgICAgICBhZGphY2VuY3lMaXN0c1tsaW5rc1tpXS5zb3VyY2VdLmluZGV4T2YobGlua3NbaV0udGFyZ2V0KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRqYWNlbmN5TGlzdHNbbGlua3NbaV0uc291cmNlXS5wdXNoKGxpbmtzW2ldLnRhcmdldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFkamFjZW5jeUxpc3RzO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZ2V0SW5kZW50YXRpb25MZXZlbHMgPSBmdW5jdGlvbiAoYWRqYWNlbmN5TGlzdHMsIHRydW5rTm9kZUlkcykge1xuICAgICAgICAgICAgdmFyIGluZGVudGF0aW9uTGV2ZWxzID0gW107XG4gICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBmaW5kIGFuZCBpbmRlbnQgdGhlIGxvbmdlc3Qgc2hvcnRjdXQgZm9yIHRoZSBzZWdtZW50IG9mXG4gICAgICAgICAgICAvLyBub2RlcyByYW5naW5nIGZyb20gdHJ1bmtOb2RlSWRzW3N0YXJ0SW5kXSB0byB0cnVua05vZGVJZHNbZW5kSW5kXVxuICAgICAgICAgICAgLy8gKGluY2x1c2l2ZSkuIEl0J3MgcG9zc2libGUgdGhhdCB0aGlzIHNob3J0Y3V0IHN0YXJ0cyBmcm9tIGEgdHJ1bmtcbiAgICAgICAgICAgIC8vIG5vZGUgd2l0aGluIHRoaXMgaW50ZXJ2YWwgKEEsIHNheSkgYW5kIGVuZHMgYXQgYSB0cnVuayBub2RlIGFmdGVyXG4gICAgICAgICAgICAvLyB0aGlzIGludGVydmFsLCBpbiB3aGljaCBjYXNlIHdlIGluZGVudCBhbGwgbm9kZXMgZnJvbSBBICsgMSBvbndhcmRzLlxuICAgICAgICAgICAgLy8gTk9URTogdGhpcyBtdXRhdGVzIGluZGVudGF0aW9uTGV2ZWxzIGFzIGEgc2lkZS1lZmZlY3QuXG4gICAgICAgICAgICB2YXIgaW5kZW50TG9uZ2VzdFNob3J0Y3V0ID0gZnVuY3Rpb24gKHN0YXJ0SW5kLCBlbmRJbmQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRJbmQgPj0gZW5kSW5kIHx8XG4gICAgICAgICAgICAgICAgICAgIGluZGVudGF0aW9uTGV2ZWxzW3N0YXJ0SW5kXSA+PSBNQVhfSU5ERU5UQVRJT05fTEVWRUwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYmVzdFNvdXJjZUluZCA9IC0xO1xuICAgICAgICAgICAgICAgIHZhciBiZXN0VGFyZ2V0SW5kID0gLTE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgc291cmNlSW5kID0gc3RhcnRJbmQ7IHNvdXJjZUluZCA8IGVuZEluZDsgc291cmNlSW5kKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNvdXJjZU5vZGVJZCA9IHRydW5rTm9kZUlkc1tzb3VyY2VJbmRdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFkamFjZW5jeUxpc3RzW3NvdXJjZU5vZGVJZF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwb3NzaWJsZVRhcmdldEluZCA9IHRydW5rTm9kZUlkcy5pbmRleE9mKGFkamFjZW5jeUxpc3RzW3NvdXJjZU5vZGVJZF1baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvc3NpYmxlVGFyZ2V0SW5kICE9PSAtMSAmJiBzb3VyY2VJbmQgPCBwb3NzaWJsZVRhcmdldEluZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJbmQgPSBNYXRoLm1pbihwb3NzaWJsZVRhcmdldEluZCwgZW5kSW5kICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldEluZCAtIHNvdXJjZUluZCA+IGJlc3RUYXJnZXRJbmQgLSBiZXN0U291cmNlSW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RTb3VyY2VJbmQgPSBzb3VyY2VJbmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RUYXJnZXRJbmQgPSB0YXJnZXRJbmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChiZXN0VGFyZ2V0SW5kIC0gYmVzdFNvdXJjZUluZCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW5kZW50IG5vZGVzIGluIFtiZXN0U291cmNlSW5kICsgMSwgYmVzdFRhcmdldEluZCAtIDFdLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gYmVzdFNvdXJjZUluZCArIDE7IGkgPCBiZXN0VGFyZ2V0SW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGVudGF0aW9uTGV2ZWxzW2ldICs9IDAuNTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBhdHRlbXB0IHRvIGluZGVudCBub2RlcyBiZWZvcmUsIHdpdGhpbiBhbmQgYWZ0ZXIgdGhpc1xuICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcnZhbC5cbiAgICAgICAgICAgICAgICAgICAgaW5kZW50TG9uZ2VzdFNob3J0Y3V0KHN0YXJ0SW5kLCBiZXN0U291cmNlSW5kKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50TG9uZ2VzdFNob3J0Y3V0KGJlc3RTb3VyY2VJbmQgKyAxLCBiZXN0VGFyZ2V0SW5kIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIGluZGVudExvbmdlc3RTaG9ydGN1dChiZXN0VGFyZ2V0SW5kLCBlbmRJbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRydW5rTm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGluZGVudGF0aW9uTGV2ZWxzLnB1c2goMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRlbnRMb25nZXN0U2hvcnRjdXQoMCwgdHJ1bmtOb2RlSWRzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgcmV0dXJuIGluZGVudGF0aW9uTGV2ZWxzO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gUmV0dXJucyBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBub2RlcyBvZiB0aGUgZ3JhcGguIFRoZSBrZXlzIG9mIHRoZVxuICAgICAgICAgICAgLy8gb2JqZWN0IGFyZSB0aGUgbm9kZSBsYWJlbHMuIFRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcyBhcmUgb2JqZWN0cyB3aXRoXG4gICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIGtleXM6XG4gICAgICAgICAgICAvLyAgIC0geDA6IHRoZSB4LXBvc2l0aW9uIG9mIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlIG5vZGUsIG1lYXN1cmVkXG4gICAgICAgICAgICAvLyAgICAgICBhcyBhIGZyYWN0aW9uIG9mIHRoZSB0b3RhbCB3aWR0aC5cbiAgICAgICAgICAgIC8vICAgLSB5MDogdGhlIHktcG9zaXRpb24gb2YgdGhlIHRvcC1sZWZ0IGNvcm5lciBvZiB0aGUgbm9kZSwgbWVhc3VyZWRcbiAgICAgICAgICAgIC8vICAgICAgIGFzIGEgZnJhY3Rpb24gb2YgdGhlIHRvdGFsIGhlaWdodC5cbiAgICAgICAgICAgIC8vICAgLSB3aWR0aDogdGhlIHdpZHRoIG9mIHRoZSBub2RlLCBtZWFzdXJlZCBhcyBhIGZyYWN0aW9uIG9mIHRoZSB0b3RhbFxuICAgICAgICAgICAgLy8gICAgICAgd2lkdGguXG4gICAgICAgICAgICAvLyAgIC0gaGVpZ2h0OiB0aGUgaGVpZ2h0IG9mIHRoZSBub2RlLCBtZWFzdXJlZCBhcyBhIGZyYWN0aW9uIG9mIHRoZSB0b3RhbFxuICAgICAgICAgICAgLy8gICAgICAgaGVpZ2h0LlxuICAgICAgICAgICAgLy8gICAtIHhMYWJlbDogdGhlIHgtcG9zaXRpb24gb2YgdGhlIG1pZGRsZSBvZiB0aGUgYm94IGNvbnRhaW5pbmdcbiAgICAgICAgICAgIC8vICAgICAgIHRoZSBub2RlIGxhYmVsLCBtZWFzdXJlZCBhcyBhIGZyYWN0aW9uIG9mIHRoZSB0b3RhbCB3aWR0aC5cbiAgICAgICAgICAgIC8vICAgICAgIFRoZSBub2RlIGxhYmVsIGlzIGNlbnRlcmVkIGhvcml6b250YWxseSB3aXRoaW4gdGhpcyBib3guXG4gICAgICAgICAgICAvLyAgIC0geUxhYmVsOiB0aGUgeS1wb3NpdGlvbiBvZiB0aGUgbWlkZGxlIG9mIHRoZSBib3ggY29udGFpbmluZ1xuICAgICAgICAgICAgLy8gICAgICAgdGhlIG5vZGUgbGFiZWwsIG1lYXN1cmVkIGFzIGEgZnJhY3Rpb24gb2YgdGhlIHRvdGFsIGhlaWdodC5cbiAgICAgICAgICAgIC8vICAgICAgIFRoZSBub2RlIGxhYmVsIGlzIGNlbnRlcmVkIHZlcnRpY2FsbHkgd2l0aGluIHRoaXMgYm94LlxuICAgICAgICAgICAgLy8gICAtIHJlYWNoYWJsZTogd2hldGhlciB0aGVyZSBpcyBhIHBhdGggZnJvbSB0aGUgc3RhcnQgbm9kZSB0byB0aGlzXG4gICAgICAgICAgICAvLyAgICAgICBub2RlLlxuICAgICAgICAgICAgLy8gICAtIHJlYWNoYWJsZUZyb21FbmQ6IHdoZXRoZXIgdGhlcmUgaXMgYSBwYXRoIGZyb20gdGhpcyBub2RlIHRvIHRoZVxuICAgICAgICAgICAgLy8gICAgICAgRU5EIG5vZGUuXG4gICAgICAgICAgICAvLyAgIC0gaWQ6IGEgdW5pcXVlIGlkIGZvciB0aGUgbm9kZS5cbiAgICAgICAgICAgIC8vICAgLSBsYWJlbDogdGhlIGZ1bGwgbGFiZWwgb2YgdGhlIG5vZGUuXG4gICAgICAgICAgICBjb21wdXRlTGF5b3V0OiBmdW5jdGlvbiAobm9kZXMsIGxpbmtzLCBpbml0Tm9kZUlkLCBmaW5hbE5vZGVJZHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYWRqYWNlbmN5TGlzdHMgPSBnZXRHcmFwaEFzQWRqYWNlbmN5TGlzdHMobm9kZXMsIGxpbmtzKTtcbiAgICAgICAgICAgICAgICAvLyBGaW5kIGEgbG9uZyBwYXRoIHRocm91Z2ggdGhlIGdyYXBoIGZyb20gdGhlIGluaXRpYWwgc3RhdGUgdG8gYVxuICAgICAgICAgICAgICAgIC8vIHRlcm1pbmFsIHN0YXRlIHZpYSBzaW1wbGUgYmFja3RyYWNraW5nLiBMaW1pdCB0aGUgYWxnb3JpdGhtIHRvIGFcbiAgICAgICAgICAgICAgICAvLyBjb25zdGFudCBudW1iZXIgb2YgY2FsbHMgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIGNhbGN1bGF0aW9uXG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3QgdGFrZSB0b28gbG9uZy5cbiAgICAgICAgICAgICAgICB2YXIgTUFYX0JBQ0tUUkFDS0lOR19DQUxMUyA9IDEwMDA7XG4gICAgICAgICAgICAgICAgdmFyIG51bUJhY2t0cmFja2luZ0NhbGxzID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgYmVzdFBhdGggPSBbaW5pdE5vZGVJZF07XG4gICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgYSAnZ2xvYmFsIHZhcmlhYmxlJyBmb3IgdGhlIHB1cnBvc2VzIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGJhY2t0cmFja2luZyBjb21wdXRhdGlvbi5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFBhdGggPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgYmFja3RyYWNrID0gZnVuY3Rpb24gKGN1cnJlbnROb2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGgucHVzaChjdXJyZW50Tm9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgbm9kZSBsZWFkcyB0byBubyBvdGhlciBub2Rlcywgd2UgY29uc2lkZXIgaXQgYVxuICAgICAgICAgICAgICAgICAgICAvLyAndGVybWluYWwgc3RhdGUnLlxuICAgICAgICAgICAgICAgICAgICBpZiAoYWRqYWNlbmN5TGlzdHNbY3VycmVudE5vZGVJZF0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFBhdGgubGVuZ3RoID4gYmVzdFBhdGgubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVzdFBhdGggPSBhbmd1bGFyLmNvcHkoY3VycmVudFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbnVtQmFja3RyYWNraW5nQ2FsbHMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1CYWNrdHJhY2tpbmdDYWxscyA8PSBNQVhfQkFDS1RSQUNLSU5HX0NBTExTKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGphY2VuY3lMaXN0c1tjdXJyZW50Tm9kZUlkXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFBhdGguaW5kZXhPZihhZGphY2VuY3lMaXN0c1tjdXJyZW50Tm9kZUlkXVtpXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2soYWRqYWNlbmN5TGlzdHNbY3VycmVudE5vZGVJZF1baV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYmFja3RyYWNrKGluaXROb2RlSWQpO1xuICAgICAgICAgICAgICAgIC8vIEluIHRoaXMgaW1wbGVtZW50YXRpb24sIG5vZGVzIGFyZSBhbGlnbmVkIHdpdGggYSByZWN0YW5ndWxhciBncmlkLlxuICAgICAgICAgICAgICAgIC8vIFdlIGNhbGN1bGF0ZSB0d28gYWRkaXRpb25hbCBpbnRlcm5hbCB2YXJpYWJsZXMgZm9yIGVhY2ggbm9kZSBpblxuICAgICAgICAgICAgICAgIC8vIG5vZGVEYXRhOlxuICAgICAgICAgICAgICAgIC8vICAgLSBkZXB0aDogaXRzIGRlcHRoIGluIHRoZSBncmFwaC5cbiAgICAgICAgICAgICAgICAvLyAgIC0gb2Zmc2V0OiBpdHMgaG9yaXpvbnRhbCBvZmZzZXQgaW4gdGhlIGdyYXBoLlxuICAgICAgICAgICAgICAgIC8vIFRoZSBkZXB0aCBhbmQgb2Zmc2V0IGFyZSBtZWFzdXJlZCBpbiB0ZXJtcyBvZiBncmlkIHNxdWFyZXMuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBXZSBmaXJzdCB0YWtlIHRoZSBsb25nZXN0IHBhdGggdGhyb3VnaCB0aGUgZ3JhcGggKHRoZSAndHJ1bmsnKSBhbmRcbiAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBsb25nZXN0IHBvc3NpYmxlIHNob3J0Y3V0cyB3aXRoaW4gdGhhdCBwYXRoLCB0aGVuIGluZGVudFxuICAgICAgICAgICAgICAgIC8vIHRoZSBub2RlcyB3aXRoaW4gdGhvc2Ugc2hvcnRjdXRzIGFuZCBhc3NpZ24gZGVwdGhzL29mZnNldHMgdG8gdGhlbS5cbiAgICAgICAgICAgICAgICAvLyBUaGUgaW5kZW50YXRpb24gaXMgZG9uZSBieSBvbmx5IGhhbGYgYSBub2RlIHdpZHRoLCBzbyB0aGF0IHRoZSBub2Rlc1xuICAgICAgICAgICAgICAgIC8vIHN0aWxsIGZlZWwgJ2Nsb3NlJyB0b2dldGhlci5cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIEFmdGVyIHRoYXQsIHdlIHRyYXZlcnNlIGFsbCByZW1haW5pbmcgbm9kZXMgdmlhIEJGUyBhbmQgYXJyYW5nZSB0aGVtXG4gICAgICAgICAgICAgICAgLy8gc3VjaCB0aGF0IG5vZGVzIHRoYXQgYXJlIGltbWVkaWF0ZSBkZXNjZW5kYW50cyBvZiBub2RlcyBpbiB0aGUgdHJ1bmtcbiAgICAgICAgICAgICAgICAvLyBmYWxsIGluIHRoZSBsZXZlbCBqdXN0IGJlbG93IHRoZWlyIHBhcmVudCwgYW5kIHRoZWlyIGNoaWxkcmVuIGZhbGwgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgbmV4dCBsZXZlbCwgZXRjLiBBbGwgdGhlc2Ugbm9kZXMgYXJlIHBsYWNlZCB0byB0aGUgcmlnaHQgb2YgdGhlXG4gICAgICAgICAgICAgICAgLy8gdHJ1bmsuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBOT1RFOiBUaGlzIGFsZ29yaXRobSBkb2VzIG5vdCB3b3JrIHNvIHdlbGwgaW4gY2xhcmlmeWluZyBhcnRpY3VsYXRpb25cbiAgICAgICAgICAgICAgICAvLyBwb2ludHMgYW5kICdzdWJjbHVzdGVycycgd2l0aGluIGEgZ3JhcGguIEZvciBhbiBpbGx1c3RyYXRpb24gb2YgdGhpcyxcbiAgICAgICAgICAgICAgICAvLyBzZWUgdGhlICdQYXJhbWV0ZXJpemVkIEFkdmVudHVyZScgZGVtbyBleHBsb3JhdGlvbi5cbiAgICAgICAgICAgICAgICB2YXIgU0VOVElORUxfREVQVEggPSAtMTtcbiAgICAgICAgICAgICAgICB2YXIgU0VOVElORUxfT0ZGU0VUID0gLTE7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVEYXRhID0ge307XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbm9kZUlkIGluIG5vZGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXB0aDogU0VOVElORUxfREVQVEgsXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IFNFTlRJTkVMX09GRlNFVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYWNoYWJsZTogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG1heERlcHRoID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgbWF4T2Zmc2V0SW5FYWNoTGV2ZWwgPSB7XG4gICAgICAgICAgICAgICAgICAgIDA6IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciB0cnVua05vZGVzSW5kZW50YXRpb25MZXZlbHMgPSBnZXRJbmRlbnRhdGlvbkxldmVscyhhZGphY2VuY3lMaXN0cywgYmVzdFBhdGgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmVzdFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbYmVzdFBhdGhbaV1dLmRlcHRoID0gbWF4RGVwdGg7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW2Jlc3RQYXRoW2ldXS5vZmZzZXQgPSB0cnVua05vZGVzSW5kZW50YXRpb25MZXZlbHNbaV07XG4gICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW2Jlc3RQYXRoW2ldXS5yZWFjaGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBtYXhPZmZzZXRJbkVhY2hMZXZlbFttYXhEZXB0aF0gPSB0cnVua05vZGVzSW5kZW50YXRpb25MZXZlbHNbaV07XG4gICAgICAgICAgICAgICAgICAgIG1heERlcHRoKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIERvIGEgYnJlYWR0aC1maXJzdCBzZWFyY2ggdG8gY2FsY3VsYXRlIHRoZSBkZXB0aHMgYW5kIG9mZnNldHMgZm9yXG4gICAgICAgICAgICAgICAgLy8gb3RoZXIgbm9kZXMuXG4gICAgICAgICAgICAgICAgdmFyIHNlZW5Ob2RlcyA9IFtpbml0Tm9kZUlkXTtcbiAgICAgICAgICAgICAgICB2YXIgcXVldWUgPSBbaW5pdE5vZGVJZF07XG4gICAgICAgICAgICAgICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJOb2RlSWQgPSBxdWV1ZVswXTtcbiAgICAgICAgICAgICAgICAgICAgcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbY3Vyck5vZGVJZF0ucmVhY2hhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGphY2VuY3lMaXN0c1tjdXJyTm9kZUlkXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBhZGphY2VuY3lMaXN0c1tjdXJyTm9kZUlkXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSB0YXJnZXQgbm9kZSBpcyBhIHRydW5rIG5vZGUsIGJ1dCBpc24ndCBhdCB0aGUgY29ycmVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGVwdGggdG8gcHJvY2VzcyBub3csIHdlIGlnbm9yZSBpdCBmb3Igbm93IGFuZCBzdGljayBpdCBiYWNrIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcXVldWUgdG8gYmUgcHJvY2Vzc2VkIGxhdGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJlc3RQYXRoLmluZGV4T2YobGlua1RhcmdldCkgIT09IC0xICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbbGlua1RhcmdldF0uZGVwdGggIT09IG5vZGVEYXRhW2N1cnJOb2RlSWRdLmRlcHRoICsgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWVuTm9kZXMuaW5kZXhPZihsaW5rVGFyZ2V0KSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUuaW5kZXhPZihsaW5rVGFyZ2V0KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChsaW5rVGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3NpZ24gZGVwdGhzIGFuZCBvZmZzZXRzIHRvIG5vZGVzIG9ubHkgaWYgd2UncmUgcHJvY2Vzc2luZyB0aGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2Vlbk5vZGVzLmluZGV4T2YobGlua1RhcmdldCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vlbk5vZGVzLnB1c2gobGlua1RhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVEYXRhW2xpbmtUYXJnZXRdLmRlcHRoID09PSBTRU5USU5FTF9ERVBUSCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtsaW5rVGFyZ2V0XS5kZXB0aCA9IG5vZGVEYXRhW2N1cnJOb2RlSWRdLmRlcHRoICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbbGlua1RhcmdldF0ub2Zmc2V0ID0gKG5vZGVEYXRhW2xpbmtUYXJnZXRdLmRlcHRoIGluIG1heE9mZnNldEluRWFjaExldmVsID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heE9mZnNldEluRWFjaExldmVsW25vZGVEYXRhW2xpbmtUYXJnZXRdLmRlcHRoXSArIDEgOiAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4RGVwdGggPSBNYXRoLm1heChtYXhEZXB0aCwgbm9kZURhdGFbbGlua1RhcmdldF0uZGVwdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhPZmZzZXRJbkVhY2hMZXZlbFtub2RlRGF0YVtsaW5rVGFyZ2V0XS5kZXB0aF0gPSAobm9kZURhdGFbbGlua1RhcmdldF0ub2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmluZGV4T2YobGlua1RhcmdldCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2gobGlua1RhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBub2RlcyB0aGF0IHdlcmUgbm90IHZpc2l0ZWQgaW4gdGhlIGZvcndhcmQgdHJhdmVyc2FsLlxuICAgICAgICAgICAgICAgIG1heE9mZnNldEluRWFjaExldmVsW21heERlcHRoICsgMV0gPSAwO1xuICAgICAgICAgICAgICAgIG1heERlcHRoICs9IDE7XG4gICAgICAgICAgICAgICAgdmFyIG9ycGhhbmVkTm9kZXNFeGlzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZURhdGFbbm9kZUlkXS5kZXB0aCA9PT0gU0VOVElORUxfREVQVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ycGhhbmVkTm9kZXNFeGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLmRlcHRoID0gbWF4RGVwdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLm9mZnNldCA9IG1heE9mZnNldEluRWFjaExldmVsW21heERlcHRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heE9mZnNldEluRWFjaExldmVsW21heERlcHRoXSArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvcnBoYW5lZE5vZGVzRXhpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4RGVwdGgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQnVpbGQgdGhlICdpbnZlcnNlIGluZGV4JyAtLSBmb3IgZWFjaCByb3csIHN0b3JlIHRoZSAob2Zmc2V0LCBub2RlSWQpXG4gICAgICAgICAgICAgICAgLy8gcGFpcnMgaW4gYXNjZW5kaW5nIG9yZGVyIG9mIG9mZnNldC5cbiAgICAgICAgICAgICAgICB2YXIgbm9kZVBvc2l0aW9uc1RvSWRzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbWF4RGVwdGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBub2RlUG9zaXRpb25zVG9JZHMucHVzaChbXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZURhdGFbbm9kZUlkXS5kZXB0aCAhPT0gU0VOVElORUxfREVQVEgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVQb3NpdGlvbnNUb0lkc1tub2RlRGF0YVtub2RlSWRdLmRlcHRoXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGVJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG5vZGVEYXRhW25vZGVJZF0ub2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBtYXhEZXB0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVQb3NpdGlvbnNUb0lkc1tpXS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5vZmZzZXQgLSBiLm9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFJlY2FsY3VsYXRlIHRoZSBub2RlIGRlcHRocyBhbmQgb2Zmc2V0cywgdGFraW5nIGludG8gYWNjb3VudFxuICAgICAgICAgICAgICAgIC8vIE1BWF9OT0RFU19QRVJfUk9XLiBJZiB0aGVyZSBhcmUgdG9vIG1hbnkgbm9kZXMgaW4gYSByb3csIHdlIG92ZXJmbG93XG4gICAgICAgICAgICAgICAgLy8gdGhlbSBpbnRvIHRoZSBuZXh0IG9uZS5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudERlcHRoID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudExlZnRNYXJnaW4gPSAwO1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50TGVmdE9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbWF4RGVwdGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZVBvc2l0aW9uc1RvSWRzW2ldLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBvZmZzZXQgb2YgdGhlIGxlZnRtb3N0IG5vZGUgYXQgdGhpcyBkZXB0aC4gSWYgdGhlcmUgYXJlIHRvb1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWFueSBub2RlcyBpbiB0aGlzIGRlcHRoLCB0aGlzIHZhcmlhYmxlIGlzIHVzZWQgdG8gZmlndXJlIG91dFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2hpY2ggb2Zmc2V0IHRvIHN0YXJ0IHRoZSBjb250aW51YXRpb24gcm93cyBmcm9tLlxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudExlZnRNYXJnaW4gPSBub2RlUG9zaXRpb25zVG9JZHNbaV1bMF0ub2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG9mZnNldCBvZiB0aGUgY3VycmVudCBub2RlIHVuZGVyIGNvbnNpZGVyYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50TGVmdE9mZnNldCA9IGN1cnJlbnRMZWZ0TWFyZ2luO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBub2RlUG9zaXRpb25zVG9JZHNbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRPZmZzZXQgPSBjdXJyZW50TGVmdE9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcHV0ZWRPZmZzZXQgPj0gTUFYX05PREVTX1BFUl9ST1cpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudERlcHRoKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkT2Zmc2V0ID0gY3VycmVudExlZnRNYXJnaW4gKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50TGVmdE9mZnNldCA9IGNvbXB1dGVkT2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlUG9zaXRpb25zVG9JZHNbaV1bal0ubm9kZUlkXS5kZXB0aCA9IGN1cnJlbnREZXB0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlUG9zaXRpb25zVG9JZHNbaV1bal0ubm9kZUlkXS5vZmZzZXQgPSAoY3VycmVudExlZnRPZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRMZWZ0T2Zmc2V0ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50RGVwdGgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIHdpZHRoIGFuZCBoZWlnaHQgb2YgZWFjaCBncmlkIHJlY3RhbmdsZS5cbiAgICAgICAgICAgICAgICB2YXIgdG90YWxSb3dzID0gY3VycmVudERlcHRoO1xuICAgICAgICAgICAgICAgIC8vIFNldCB0b3RhbENvbHVtbnMgdG8gYmUgTUFYX05PREVTX1BFUl9ST1csIHNvIHRoYXQgdGhlIHdpZHRoIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGdyYXBoIHZpc3VhbGl6YXRpb24gY2FuIGJlIGNhbGN1bGF0ZWQgYmFzZWQgb24gYSBmaXhlZCBjb25zdGFudCxcbiAgICAgICAgICAgICAgICAvLyBNQVhfTk9ERVNfUEVSX1JPVy4gT3RoZXJ3aXNlLCB0aGUgd2lkdGggb2YgdGhlIGluZGl2aWR1YWwgbm9kZXMgaXNcbiAgICAgICAgICAgICAgICAvLyBkZXBlbmRlbnQgb24gdGhlIG51bWJlciBvZiBub2RlcyBpbiB0aGUgbG9uZ2VzdCByb3csIGFuZCB0aGlzIG1ha2VzXG4gICAgICAgICAgICAgICAgLy8gdGhlIG5vZGVzIHRvbyB3aWRlIGlmLCBlLmcuLCB0aGUgb3ZlcmFsbCBncmFwaCBpcyBqdXN0IGEgc2luZ2xlXG4gICAgICAgICAgICAgICAgLy8gY29sdW1uIHdpZGUuXG4gICAgICAgICAgICAgICAgdmFyIHRvdGFsQ29sdW1ucyA9IE1BWF9OT0RFU19QRVJfUk9XO1xuICAgICAgICAgICAgICAgIC8vIEhvcml6b250YWwgcGFkZGluZyBiZXR3ZWVuIHRoZSBncmFwaCBhbmQgdGhlIGVkZ2Ugb2YgdGhlIGdyYXBoXG4gICAgICAgICAgICAgICAgLy8gdmlzdWFsaXphdGlvbiwgbWVhc3VyZWQgYXMgYSBmcmFjdGlvbiBvZiB0aGUgZW50aXJlIGhlaWdodC5cbiAgICAgICAgICAgICAgICB2YXIgSE9SSVpPTlRBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gPSAwLjA1O1xuICAgICAgICAgICAgICAgIC8vIFZlcnRpY2FsIGVkZ2UgcGFkZGluZyBiZXR3ZWVuIHRoZSBncmFwaCBhbmQgdGhlIGVkZ2Ugb2YgdGhlIGdyYXBoXG4gICAgICAgICAgICAgICAgLy8gdmlzdWFsaXphdGlvbiwgbWVhc3VyZWQgYXMgYSBmcmFjdGlvbiBvZiB0aGUgZW50aXJlIGhlaWdodC5cbiAgICAgICAgICAgICAgICB2YXIgVkVSVElDQUxfRURHRV9QQURESU5HX0ZSQUNUSU9OID0gMC4xO1xuICAgICAgICAgICAgICAgIC8vIFRoZSB2ZXJ0aWNhbCBwYWRkaW5nLCBtZWFzdXJlZCBhcyBhIGZyYWN0aW9uIG9mIHRoZSBoZWlnaHQgb2YgYSBncmlkXG4gICAgICAgICAgICAgICAgLy8gcmVjdGFuZ2xlLCBiZXR3ZWVuIHRoZSB0b3Agb2YgdGhlIGdyaWQgcmVjdGFuZ2xlIGFuZCB0aGUgdG9wIG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIG5vZGUuIEFuIGVxdWl2YWxlbnQgYW1vdW50IG9mIHBhZGRpbmcgd2lsbCBiZSB1c2VkIGZvciB0aGUgc3BhY2VcbiAgICAgICAgICAgICAgICAvLyBiZXR3ZWVuIHRoZSBib3R0b20gb2YgdGhlIGdyaWQgcmVjdGFuZ2xlIGFuZCB0aGUgYm90dG9tIG9mIHRoZSBub2RlLlxuICAgICAgICAgICAgICAgIHZhciBHUklEX05PREVfWV9QQURESU5HX0ZSQUNUSU9OID0gMC4yO1xuICAgICAgICAgICAgICAgIC8vIEFzIGFib3ZlLCBidXQgZm9yIHRoZSBob3Jpem9udGFsIHBhZGRpbmcuXG4gICAgICAgICAgICAgICAgdmFyIEdSSURfTk9ERV9YX1BBRERJTkdfRlJBQ1RJT04gPSAwLjE7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHZlcnRpY2FsIHBhZGRpbmcsIG1lYXN1cmVkIGFzIGEgZnJhY3Rpb24gb2YgdGhlIGhlaWdodCBvZiBhIGdyaWRcbiAgICAgICAgICAgICAgICAvLyByZWN0YW5nbGUsIGJldHdlZW4gdGhlIHRvcCBvZiB0aGUgbm9kZSBhbmQgdGhlIHRvcCBvZiB0aGUgbm9kZSBsYWJlbC5cbiAgICAgICAgICAgICAgICAvLyBBbiBlcXVpdmFsZW50IGFtb3VudCBvZiBwYWRkaW5nIHdpbGwgYmUgdXNlZCBmb3IgdGhlIHNwYWNlIGJldHdlZW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgYm90dG9tIG9mIHRoZSBub2RlIGFuZCB0aGUgYm90dG9tIG9mIHRoZSBub2RlIGxhYmVsLlxuICAgICAgICAgICAgICAgIHZhciBOT0RFX0xBQkVMX1lfUEFERElOR19GUkFDVElPTiA9IDAuMTU7XG4gICAgICAgICAgICAgICAgLy8gQXMgYWJvdmUsIGJ1dCBmb3IgdGhlIGhvcml6b250YWwgcGFkZGluZy5cbiAgICAgICAgICAgICAgICB2YXIgTk9ERV9MQUJFTF9YX1BBRERJTkdfRlJBQ1RJT04gPSAwLjA1O1xuICAgICAgICAgICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBob3Jpem9udGFsIHBvc2l0aW9uLCBpbiB0ZXJtcyBvZiBhXG4gICAgICAgICAgICAgICAgLy8gZnJhY3Rpb24gb2YgdGhlIHRvdGFsIHdpZHRoLCBnaXZlbiBhIGhvcml6b250YWwgb2Zmc2V0IGluIHRlcm1zIG9mXG4gICAgICAgICAgICAgICAgLy8gZ3JpZCByZWN0YW5nbGVzLlxuICAgICAgICAgICAgICAgIHZhciBnZXRIb3Jpem9udGFsUG9zaXRpb24gPSBmdW5jdGlvbiAob2Zmc2V0SW5HcmlkUmVjdGFuZ2xlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZnJhY3Rpb25hbEdyaWRXaWR0aCA9ICgoMS4wIC0gSE9SSVpPTlRBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gKiAyKSAvIHRvdGFsQ29sdW1ucyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoSE9SSVpPTlRBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gK1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhY3Rpb25hbEdyaWRXaWR0aCAqIG9mZnNldEluR3JpZFJlY3RhbmdsZXMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHZlcnRpY2FsIHBvc2l0aW9uLCBpbiB0ZXJtcyBvZiBhXG4gICAgICAgICAgICAgICAgLy8gZnJhY3Rpb24gb2YgdGhlIHRvdGFsIGhlaWdodCwgZ2l2ZW4gYSB2ZXJ0aWNhbCBvZmZzZXQgaW4gdGVybXMgb2ZcbiAgICAgICAgICAgICAgICAvLyBncmlkIHJlY3RhbmdsZXMuXG4gICAgICAgICAgICAgICAgdmFyIGdldFZlcnRpY2FsUG9zaXRpb24gPSBmdW5jdGlvbiAob2Zmc2V0SW5HcmlkUmVjdGFuZ2xlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZnJhY3Rpb25hbEdyaWRIZWlnaHQgPSAoKDEuMCAtIFZFUlRJQ0FMX0VER0VfUEFERElOR19GUkFDVElPTiAqIDIpIC8gdG90YWxSb3dzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChWRVJUSUNBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gK1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhY3Rpb25hbEdyaWRIZWlnaHQgKiBvZmZzZXRJbkdyaWRSZWN0YW5nbGVzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLnkwID0gZ2V0VmVydGljYWxQb3NpdGlvbihub2RlRGF0YVtub2RlSWRdLmRlcHRoICsgR1JJRF9OT0RFX1lfUEFERElOR19GUkFDVElPTik7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF0ueDAgPSBnZXRIb3Jpem9udGFsUG9zaXRpb24obm9kZURhdGFbbm9kZUlkXS5vZmZzZXQgKyBHUklEX05PREVfWF9QQURESU5HX0ZSQUNUSU9OKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXS55TGFiZWwgPSBnZXRWZXJ0aWNhbFBvc2l0aW9uKG5vZGVEYXRhW25vZGVJZF0uZGVwdGggKyAwLjUpO1xuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLnhMYWJlbCA9IGdldEhvcml6b250YWxQb3NpdGlvbihub2RlRGF0YVtub2RlSWRdLm9mZnNldCArIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF0uaGVpZ2h0ID0gKCgxLjAgLSBWRVJUSUNBTF9FREdFX1BBRERJTkdfRlJBQ1RJT04gKiAyKSAvIHRvdGFsUm93cykgKiAoMS4wIC0gR1JJRF9OT0RFX1lfUEFERElOR19GUkFDVElPTiAqIDIpO1xuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLndpZHRoID0gKCgxLjAgLSBIT1JJWk9OVEFMX0VER0VfUEFERElOR19GUkFDVElPTiAqIDIpIC8gdG90YWxDb2x1bW5zKSAqICgxLjAgLSBHUklEX05PREVfWF9QQURESU5HX0ZSQUNUSU9OICogMik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFzc2lnbiBpZCBhbmQgbGFiZWwgdG8gZWFjaCBub2RlLlxuICAgICAgICAgICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLmlkID0gbm9kZUlkO1xuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtub2RlSWRdLmxhYmVsID0gbm9kZXNbbm9kZUlkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTWFyayBub2RlcyB0aGF0IGFyZSByZWFjaGFibGUgZnJvbSBhbnkgZW5kIHN0YXRlIHZpYSBiYWNrd2FyZCBsaW5rcy5cbiAgICAgICAgICAgICAgICBxdWV1ZSA9IGZpbmFsTm9kZUlkcztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbmFsTm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBub2RlRGF0YVtmaW5hbE5vZGVJZHNbaV1dLnJlYWNoYWJsZUZyb21FbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyck5vZGVJZCA9IHF1ZXVlWzBdO1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGlua3NbaV0udGFyZ2V0ID09PSBjdXJyTm9kZUlkICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIW5vZGVEYXRhW2xpbmtzW2ldLnNvdXJjZV0ucmVhY2hhYmxlRnJvbUVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW2xpbmtzW2ldLnNvdXJjZV0ucmVhY2hhYmxlRnJvbUVuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChsaW5rc1tpXS5zb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3RDb21wdXRlZEFycmFuZ2VtZW50ID0gYW5ndWxhci5jb3B5KG5vZGVEYXRhKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZURhdGE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TGFzdENvbXB1dGVkQXJyYW5nZW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KGxhc3RDb21wdXRlZEFycmFuZ2VtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRHcmFwaEJvdW5kYXJpZXM6IGZ1bmN0aW9uIChub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBJTkZJTklUWSA9IDFlMzA7XG4gICAgICAgICAgICAgICAgdmFyIEJPUkRFUl9QQURESU5HID0gNTtcbiAgICAgICAgICAgICAgICB2YXIgbGVmdEVkZ2UgPSBJTkZJTklUWTtcbiAgICAgICAgICAgICAgICB2YXIgdG9wRWRnZSA9IElORklOSVRZO1xuICAgICAgICAgICAgICAgIHZhciBib3R0b21FZGdlID0gLUlORklOSVRZO1xuICAgICAgICAgICAgICAgIHZhciByaWdodEVkZ2UgPSAtSU5GSU5JVFk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbm9kZUlkIGluIG5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnRFZGdlID0gTWF0aC5taW4obm9kZURhdGFbbm9kZUlkXS54MCAtIEJPUkRFUl9QQURESU5HLCBsZWZ0RWRnZSk7XG4gICAgICAgICAgICAgICAgICAgIHRvcEVkZ2UgPSBNYXRoLm1pbihub2RlRGF0YVtub2RlSWRdLnkwIC0gQk9SREVSX1BBRERJTkcsIHRvcEVkZ2UpO1xuICAgICAgICAgICAgICAgICAgICByaWdodEVkZ2UgPSBNYXRoLm1heChub2RlRGF0YVtub2RlSWRdLngwICsgQk9SREVSX1BBRERJTkcgKyBub2RlRGF0YVtub2RlSWRdLndpZHRoLCByaWdodEVkZ2UpO1xuICAgICAgICAgICAgICAgICAgICBib3R0b21FZGdlID0gTWF0aC5tYXgobm9kZURhdGFbbm9kZUlkXS55MCArIEJPUkRFUl9QQURESU5HICsgbm9kZURhdGFbbm9kZUlkXS5oZWlnaHQsIGJvdHRvbUVkZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBib3R0b206IGJvdHRvbUVkZ2UsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IGxlZnRFZGdlLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogcmlnaHRFZGdlLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcEVkZ2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEF1Z21lbnRlZExpbmtzOiBmdW5jdGlvbiAobm9kZURhdGEsIG5vZGVMaW5rcykge1xuICAgICAgICAgICAgICAgIHZhciBsaW5rcyA9IGFuZ3VsYXIuY29weShub2RlTGlua3MpO1xuICAgICAgICAgICAgICAgIHZhciBhdWdtZW50ZWRMaW5rcyA9IGxpbmtzLm1hcChmdW5jdGlvbiAobGluaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBhbmd1bGFyLmNvcHkobm9kZURhdGFbbGluay5zb3VyY2VdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogYW5ndWxhci5jb3B5KG5vZGVEYXRhW2xpbmsudGFyZ2V0XSlcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF1Z21lbnRlZExpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rID0gYXVnbWVudGVkTGlua3NbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5rLnNvdXJjZS5sYWJlbCAhPT0gbGluay50YXJnZXQubGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzb3VyY2V4ID0gbGluay5zb3VyY2UueExhYmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNvdXJjZXkgPSBsaW5rLnNvdXJjZS55TGFiZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0eCA9IGxpbmsudGFyZ2V0LnhMYWJlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXR5ID0gbGluay50YXJnZXQueUxhYmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZXggPT09IHRhcmdldHggJiYgc291cmNleSA9PT0gdGFyZ2V0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogSW52ZXN0aWdhdGUgd2h5IHRoaXMgaGFwcGVucy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc291cmNlV2lkdGggPSBsaW5rLnNvdXJjZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzb3VyY2VIZWlnaHQgPSBsaW5rLnNvdXJjZS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0V2lkdGggPSBsaW5rLnRhcmdldC53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRIZWlnaHQgPSBsaW5rLnRhcmdldC5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZHggPSB0YXJnZXR4IC0gc291cmNleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkeSA9IHRhcmdldHkgLSBzb3VyY2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogRnJhY3Rpb25hbCBhbW91bnQgb2YgdHJ1bmNhdGlvbiB0byBiZSBhcHBsaWVkIHRvIHRoZSBlbmQgb2ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhY2ggbGluay4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGFydEN1dG9mZiA9IChzb3VyY2VXaWR0aCAvIDIpIC8gTWF0aC5hYnMoZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVuZEN1dG9mZiA9ICh0YXJnZXRXaWR0aCAvIDIpIC8gTWF0aC5hYnMoZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGR4ID09PSAwIHx8IGR5ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRDdXRvZmYgPSAoKGR4ID09PSAwKSA/IChzb3VyY2VIZWlnaHQgLyAyKSAvIE1hdGguYWJzKGR5KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKHN0YXJ0Q3V0b2ZmLCAoc291cmNlSGVpZ2h0IC8gMikgLyBNYXRoLmFicyhkeSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRDdXRvZmYgPSAoKGR4ID09PSAwKSA/ICh0YXJnZXRIZWlnaHQgLyAyKSAvIE1hdGguYWJzKGR5KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKGVuZEN1dG9mZiwgKHRhcmdldEhlaWdodCAvIDIpIC8gTWF0aC5hYnMoZHkpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZHhwZXJwID0gdGFyZ2V0eSAtIHNvdXJjZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZHlwZXJwID0gc291cmNleCAtIHRhcmdldHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9ybSA9IE1hdGguc3FydChkeHBlcnAgKiBkeHBlcnAgKyBkeXBlcnAgKiBkeXBlcnApO1xuICAgICAgICAgICAgICAgICAgICAgICAgZHhwZXJwIC89IG5vcm07XG4gICAgICAgICAgICAgICAgICAgICAgICBkeXBlcnAgLz0gbm9ybTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtaWR4ID0gc291cmNleCArIGR4IC8gMiArIGR4cGVycCAqIChzb3VyY2VIZWlnaHQgLyA0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtaWR5ID0gc291cmNleSArIGR5IC8gMiArIGR5cGVycCAqICh0YXJnZXRIZWlnaHQgLyA0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGFydHggPSBzb3VyY2V4ICsgc3RhcnRDdXRvZmYgKiBkeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGFydHkgPSBzb3VyY2V5ICsgc3RhcnRDdXRvZmYgKiBkeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmR4ID0gdGFyZ2V0eCAtIGVuZEN1dG9mZiAqIGR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVuZHkgPSB0YXJnZXR5IC0gZW5kQ3V0b2ZmICogZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IGEgcXVhZHJhdGljIGJlemllciBjdXJ2ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGF1Z21lbnRlZExpbmtzW2ldLmQgPSAoJ00nICsgc3RhcnR4ICsgJyAnICsgc3RhcnR5ICsgJyBRICcgKyBtaWR4ICsgJyAnICsgbWlkeSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAnICsgZW5keCArICcgJyArIGVuZHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhdWdtZW50ZWRMaW5rcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb2RpZnlQb3NpdGlvblZhbHVlczogZnVuY3Rpb24gKG5vZGVEYXRhLCBncmFwaFdpZHRoLCBncmFwaEhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciBIT1JJWk9OVEFMX05PREVfUFJPUEVSVElFUyA9IFsneDAnLCAnd2lkdGgnLCAneExhYmVsJ107XG4gICAgICAgICAgICAgICAgdmFyIFZFUlRJQ0FMX05PREVfUFJPUEVSVElFUyA9IFsneTAnLCAnaGVpZ2h0JywgJ3lMYWJlbCddO1xuICAgICAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgcG9zaXRpb24gdmFsdWVzIGluIG5vZGVEYXRhIHRvIHVzZSBwaXhlbHMuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbm9kZUlkIGluIG5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgSE9SSVpPTlRBTF9OT0RFX1BST1BFUlRJRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF1bSE9SSVpPTlRBTF9OT0RFX1BST1BFUlRJRVNbaV1dID0gKGdyYXBoV2lkdGggKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF1bSE9SSVpPTlRBTF9OT0RFX1BST1BFUlRJRVNbaV1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhW25vZGVJZF1bVkVSVElDQUxfTk9ERV9QUk9QRVJUSUVTW2ldXSA9IChncmFwaEhlaWdodCAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZURhdGFbbm9kZUlkXVtWRVJUSUNBTF9OT0RFX1BST1BFUlRJRVNbaV1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZURhdGE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0R3JhcGhXaWR0aDogZnVuY3Rpb24gKG1heE5vZGVzUGVyUm93LCBtYXhOb2RlTGFiZWxMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBBIHJvdWdoIHVwcGVyIGJvdW5kIGZvciB0aGUgd2lkdGggb2YgYSBzaW5nbGUgbGV0dGVyLCBpbiBwaXhlbHMsXG4gICAgICAgICAgICAgICAgLy8gdG8gdXNlIGFzIGEgc2NhbGluZyBmYWN0b3IgdG8gZGV0ZXJtaW5lIHRoZSB3aWR0aCBvZiBncmFwaCBub2Rlcy5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIG5vdCBhbiBlbnRpcmVseSBhY2N1cmF0ZSBkZXNjcmlwdGlvbiBiZWNhdXNlIGl0IGFsc28gdGFrZXNcbiAgICAgICAgICAgICAgICAvLyBpbnRvIGFjY291bnQgdGhlIGhvcml6b250YWwgd2hpdGVzcGFjZSBiZXR3ZWVuIGdyYXBoIG5vZGVzLlxuICAgICAgICAgICAgICAgIHZhciBsZXR0ZXJXaWR0aEluUGl4ZWxzID0gMTAuNTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF4Tm9kZXNQZXJSb3cgKiBtYXhOb2RlTGFiZWxMZW5ndGggKiBsZXR0ZXJXaWR0aEluUGl4ZWxzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEdyYXBoSGVpZ2h0OiBmdW5jdGlvbiAobm9kZURhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF4RGVwdGggPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBtYXhEZXB0aCA9IE1hdGgubWF4KG1heERlcHRoLCBub2RlRGF0YVtub2RlSWRdLmRlcHRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIDcwLjAgKiAobWF4RGVwdGggKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGV4cHJlc3Npb25zLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRFeHByZXNzaW9uRWRpdG9yTW9kdWxlJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEV4cHJlc3Npb25FZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBDdXJyZW50bHkgb25seSB0YWtlcyBhIHN0cmluZyB3aGljaCBpcyBlaXRoZXIgJ2Jvb2wnLFxuICAgICAgICAgICAgICAgIC8vICdpbnQnIG9yICdmbG9hdCcuIE1heSBuZWVkIHRvIGdlbmVyYWxpemUuXG4gICAgICAgICAgICAgICAgb3V0cHV0VHlwZTogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1leHByZXNzaW9uLWVkaXRvci8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWV4cHJlc3Npb24tZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRydW5jYXRlIGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9jb252ZXJ0LXRvLXBsYWluLXRleHQuZmlsdGVyLnRzJyk7XG4vLyBGaWx0ZXIgdGhhdCB0cnVuY2F0ZXMgbG9uZyBkZXNjcmlwdG9ycy5cbmFuZ3VsYXIubW9kdWxlKCdzdHJpbmdVdGlsaXR5RmlsdGVyc01vZHVsZScpLmZpbHRlcigndHJ1bmNhdGUnLCBbJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0LCBsZW5ndGgsIHN1ZmZpeCkge1xuICAgICAgICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc05hTihsZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gNzA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3VmZml4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWZmaXggPSAnLi4uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1N0cmluZyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IFN0cmluZyhpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnB1dCA9ICRmaWx0ZXIoJ2NvbnZlcnRUb1BsYWluVGV4dCcpKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQubGVuZ3RoIDw9IGxlbmd0aCA/IGlucHV0IDogKGlucHV0LnN1YnN0cmluZygwLCBsZW5ndGggLSBzdWZmaXgubGVuZ3RoKSArIHN1ZmZpeCkpO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBhY3Rpdml0aWVzIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwgd2hlbiBPcHBpYVxuICogaXMgaW4gZGV2ZWxvcGVyIG1vZGUuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9vYmplY3RzL051bWJlcldpdGhVbml0c09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tcGFnZS1zZXJ2aWNlcy9hZG1pbi10YXNrLW1hbmFnZXIvYWRtaW4tdGFzay1tYW5hZ2VyLnNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdhZG1pbkRldk1vZGVBY3Rpdml0aWVzVGFiTW9kdWxlJykuZGlyZWN0aXZlKCdhZG1pbkRldk1vZGVBY3Rpdml0aWVzVGFiJywgW1xuICAgICckaHR0cCcsICdBZG1pblRhc2tNYW5hZ2VyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0FETUlOX0hBTkRMRVJfVVJMJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQURNSU5fSEFORExFUl9VUkwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHNldFN0YXR1c01lc3NhZ2U6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2FkbWluLXBhZ2UvYWN0aXZpdGllcy10YWIvYWRtaW4tZGV2LW1vZGUtYWN0aXZpdGllcy10YWIvJyArXG4gICAgICAgICAgICAgICAgJ2FkbWluLWRldi1tb2RlLWFjdGl2aXRpZXMtdGFiLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbG9hZEV4cGxvcmF0aW9uID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5pc1Rhc2tSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbmZpcm0oJ1RoaXMgYWN0aW9uIGlzIGlycmV2ZXJzaWJsZS4gQXJlIHlvdSBzdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1Byb2Nlc3NpbmcuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLnN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3JlbG9hZF9leHBsb3JhdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IFN0cmluZyhleHBsb3JhdGlvbklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ0RhdGEgcmVsb2FkZWQgc3VjY2Vzc2Z1bGx5LicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuZmluaXNoVGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5ERU1PX0VYUExPUkFUSU9OUyA9IEdMT0JBTFMuREVNT19FWFBMT1JBVElPTlM7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5ERU1PX0NPTExFQ1RJT05TID0gR0xPQkFMUy5ERU1PX0NPTExFQ1RJT05TO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubnVtRHVtbXlFeHBzVG9QdWJsaXNoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm51bUR1bW15RXhwc1RvR2VuZXJhdGUgPSAwO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVsb2FkQWxsRXhwbG9yYXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmlzVGFza1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29uZmlybSgnVGhpcyBhY3Rpb24gaXMgaXJyZXZlcnNpYmxlLiBBcmUgeW91IHN1cmU/JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnUHJvY2Vzc2luZy4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2Uuc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnVtU3VjY2VlZGVkID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBudW1GYWlsZWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG51bVRyaWVkID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmludFJlc3VsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtVHJpZWQgPCBHTE9CQUxTLkRFTU9fRVhQTE9SQVRJT05fSURTLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnUHJvY2Vzc2luZy4uLicgKyBudW1UcmllZCArICcvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBHTE9CQUxTLkRFTU9fRVhQTE9SQVRJT05fSURTLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1JlbG9hZGVkICcgKyBHTE9CQUxTLkRFTU9fRVhQTE9SQVRJT05fSURTLmxlbmd0aCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgZXhwbG9yYXRpb25zOiAnICsgbnVtU3VjY2VlZGVkICsgJyBzdWNjZWVkZWQsICcgKyBudW1GYWlsZWQgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIGZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBHTE9CQUxTLkRFTU9fRVhQTE9SQVRJT05fSURTLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBHTE9CQUxTLkRFTU9fRVhQTE9SQVRJT05fSURTW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVsb2FkX2V4cGxvcmF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1TdWNjZWVkZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrbnVtVHJpZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50UmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK251bUZhaWxlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1UcmllZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRSZXN1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdlbmVyYXRlRHVtbXlFeHBsb3JhdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBkdW1teSBleHBsb3JhdGlvbnMgd2l0aCByYW5kb20gdGl0bGUuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLm51bUR1bW15RXhwc1RvUHVibGlzaCA+ICRzY29wZS5udW1EdW1teUV4cHNUb0dlbmVyYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1B1Ymxpc2ggY291bnQgc2hvdWxkIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byBnZW5lcmF0ZSBjb3VudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLnN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1Byb2Nlc3NpbmcuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZW5lcmF0ZV9kdW1teV9leHBsb3JhdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bV9kdW1teV9leHBzX3RvX2dlbmVyYXRlOiAkc2NvcGUubnVtRHVtbXlFeHBzVG9HZW5lcmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1fZHVtbXlfZXhwc190b19wdWJsaXNoOiAkc2NvcGUubnVtRHVtbXlFeHBzVG9QdWJsaXNoXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnRHVtbXkgZXhwbG9yYXRpb25zIGdlbmVyYXRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWxvYWRDb2xsZWN0aW9uID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmlzVGFza1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29uZmlybSgnVGhpcyBhY3Rpb24gaXMgaXJyZXZlcnNpYmxlLiBBcmUgeW91IHN1cmU/JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnUHJvY2Vzc2luZy4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2Uuc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KEFETUlOX0hBTkRMRVJfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVsb2FkX2NvbGxlY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IFN0cmluZyhjb2xsZWN0aW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnRGF0YSByZWxvYWRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYWN0aXZpdGllcyB0YWIgaW4gdGhlIGFkbWluIHBhbmVsIHdoZW4gT3BwaWFcbiAqIGlzIGluIHByb2R1Y3Rpb24gbW9kZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2FkbWluUHJvZE1vZGVBY3Rpdml0aWVzVGFiJykuZGlyZWN0aXZlKCdhZG1pblByb2RNb2RlQWN0aXZpdGllc1RhYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9hZG1pbi9hY3Rpdml0aWVzX3RhYi8nICtcbiAgICAgICAgICAgICAgICAnYWRtaW5fcHJvZF9tb2RlX2FjdGl2aXRpZXNfdGFiX2RpcmVjdGl2ZS5odG1sJylcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgbmF2aWdhdGlvbiBiYXIgaW4gdGhlIGFkbWluIHBhbmVsLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FkbWluLXBhZ2Utc2VydmljZXMvYWRtaW4tcm91dGVyL2FkbWluLXJvdXRlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2FkbWluTmF2YmFyTW9kdWxlJykuZGlyZWN0aXZlKCdhZG1pbk5hdmJhcicsIFtcbiAgICAnQWRtaW5Sb3V0ZXJTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ0FETUlOX1RBQl9VUkxTJyxcbiAgICAnTE9HT1VUX1VSTCcsICdQUk9GSUxFX1VSTF9URU1QTEFURScsXG4gICAgZnVuY3Rpb24gKEFkbWluUm91dGVyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEFETUlOX1RBQl9VUkxTLCBMT0dPVVRfVVJMLCBQUk9GSUxFX1VSTF9URU1QTEFURSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0VXNlckVtYWlsOiAnJnVzZXJFbWFpbCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLW5hdmJhci8nICtcbiAgICAgICAgICAgICAgICAnYWRtaW4tbmF2YmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICdVc2VyU2VydmljZScsIGZ1bmN0aW9uICgkc2NvcGUsIFVzZXJTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5BRE1JTl9UQUJfVVJMUyA9IEFETUlOX1RBQl9VUkxTO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd1RhYiA9IEFkbWluUm91dGVyU2VydmljZS5zaG93VGFiO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNBY3Rpdml0aWVzVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc0FjdGl2aXRpZXNUYWJPcGVuO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNKb2JzVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc0pvYnNUYWJPcGVuO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNDb25maWdUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzQ29uZmlnVGFiT3BlbjtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzUm9sZXNUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzUm9sZXNUYWJPcGVuO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNNaXNjVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc01pc2NUYWJPcGVuO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRQcm9maWxlSW1hZ2VEYXRhVXJsQXN5bmMoKS50aGVuKGZ1bmN0aW9uIChkYXRhVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucHJvZmlsZVBpY3R1cmVEYXRhVXJsID0gZGF0YVVybDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51c2VybmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNNb2RlcmF0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTdXBlckFkbWluID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnByb2ZpbGVVcmwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlcm5hbWUgPSB1c2VySW5mby5nZXRVc2VybmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzTW9kZXJhdG9yID0gdXNlckluZm8uaXNNb2RlcmF0b3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1N1cGVyQWRtaW4gPSB1c2VySW5mby5pc1N1cGVyQWRtaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wcm9maWxlVXJsID0gKFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFBST0ZJTEVfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6ICRzY29wZS51c2VybmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvZ29XaGl0ZUltZ1VybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKCcvbG9nby8yODh4MTI4X2xvZ29fd2hpdGUucG5nJyk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2dvdXRVcmwgPSBMT0dPVVRfVVJMO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucHJvZmlsZURyb3Bkb3duSXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uTW91c2VvdmVyUHJvZmlsZVBpY3R1cmVPckRyb3Bkb3duID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGV2dC5jdXJyZW50VGFyZ2V0KS5wYXJlbnQoKS5hZGRDbGFzcygnb3BlbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnByb2ZpbGVEcm9wZG93bklzQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uTW91c2VvdXRQcm9maWxlUGljdHVyZU9yRHJvcGRvd24gPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZXZ0LmN1cnJlbnRUYXJnZXQpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucHJvZmlsZURyb3Bkb3duSXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIG1haW50YWluIHRoZSByb3V0aW5nIHN0YXRlIG9mIHRoZSBhZG1pbiBwYWdlLFxuICogcHJvdmlkZSByb3V0aW5nIGZ1bmN0aW9uYWxpdHksIGFuZCBzdG9yZSBhbGwgYXZhaWxhYmxlIHRhYiBzdGF0ZXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhZG1pblBhZ2VNb2R1bGUnKS5mYWN0b3J5KCdBZG1pblJvdXRlclNlcnZpY2UnLCBbXG4gICAgJ0FETUlOX1RBQl9VUkxTJyxcbiAgICBmdW5jdGlvbiAoQURNSU5fVEFCX1VSTFMpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRUYWJIYXNoID0gQURNSU5fVEFCX1VSTFMuQUNUSVZJVElFUztcbiAgICAgICAgdmFyIGdldFRhYk5hbWVCeUhhc2ggPSBmdW5jdGlvbiAodGFiSGFzaCkge1xuICAgICAgICAgICAgZm9yICh2YXIgdGFiTmFtZSBpbiBBRE1JTl9UQUJfVVJMUykge1xuICAgICAgICAgICAgICAgIGlmIChBRE1JTl9UQUJfVVJMU1t0YWJOYW1lXSA9PT0gdGFiSGFzaCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFiTmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTmF2aWdhdGVzIHRoZSBwYWdlIHRvIHRoZSBzcGVjaWZpZWQgdGFiIGJhc2VkIG9uIGl0cyBIVE1MIGhhc2guXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNob3dUYWI6IGZ1bmN0aW9uICh0YWJIYXNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGdldFRhYk5hbWVCeUhhc2godGFiSGFzaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFRhYkhhc2ggPSB0YWJIYXNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgYWN0aXZpdGllcyB0YWIgaXMgb3Blbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNBY3Rpdml0aWVzVGFiT3BlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50VGFiSGFzaCA9PT0gQURNSU5fVEFCX1VSTFMuQUNUSVZJVElFUztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgam9icyB0YWIgaXMgb3Blbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNKb2JzVGFiT3BlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50VGFiSGFzaCA9PT0gQURNSU5fVEFCX1VSTFMuSk9CUztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgY29uZmlnIHRhYiBpcyBvcGVuLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0NvbmZpZ1RhYk9wZW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudFRhYkhhc2ggPT09IEFETUlOX1RBQl9VUkxTLkNPTkZJRztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgcm9sZXMgdGFiIGlzIG9wZW4uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlzUm9sZXNUYWJPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUYWJIYXNoID09PSBBRE1JTl9UQUJfVVJMUy5ST0xFUztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgbWlzY2VsbGFuZW91cyB0YWIgaXMgb3Blbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNNaXNjVGFiT3BlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50VGFiSGFzaCA9PT0gQURNSU5fVEFCX1VSTFMuTUlTQztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBxdWVyeSBhbmQgc3RhcnQgbmV3IHRhc2tzIHN5bmNocm9ub3VzbHkgaW4gdGhlIGFkbWluXG4gKiBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW5QYWdlTW9kdWxlJykuZmFjdG9yeSgnQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UnLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGFza0lzUnVubmluZyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBOb3RpZmllcyB0aGUgbWFuYWdlciBhIG5ldyB0YXNrIGlzIHN0YXJ0aW5nLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzdGFydFRhc2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0YXNrSXNSdW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciBhIHRhc2sgaXMgY3VycmVudGx5IHJ1bm5pbmcuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlzVGFza1J1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFza0lzUnVubmluZztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE5vdGlmaWVzIHRoZSBtYW5hZ2VyIGEgdGFzayBoYXMgY29tcGxldGVkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmaW5pc2hUYXNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGFza0lzUnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVycyBmb3IgdGhlIE9wcGlhIGFkbWluIHBhZ2UuXG4gKi9cbi8vIFRPRE8odm9qdGVjaGplbGluZWspOiB0aGlzIGJsb2NrIG9mIHJlcXVpcmVzIHNob3VsZCBiZSByZW1vdmVkIGFmdGVyIHdlXG4vLyBpbnRyb2R1Y2Ugd2VicGFjayBmb3IgL2V4dGVuc2lvbnNcbi8vIHJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdmFsaWRhdG9ycy9mb3Jtcy12YWxpZGF0b3JzLm1vZHVsZS50cycpO1xuLy8gcmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMubW9kdWxlLnRzJyk7XG4vLyByZXF1aXJlKFxuLy8gICAnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL2FwcGx5LXZhbGlkYXRpb24vJyArXG4vLyAgICdhcHBseS12YWxpZGF0aW9uLm1vZHVsZS50cycpO1xuLy8gcmVxdWlyZShcbi8vICAgJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9vYmplY3QtZWRpdG9yL29iamVjdC1lZGl0b3IubW9kdWxlLnRzJyk7XG4vLyByZXF1aXJlKFxuLy8gICAnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3JlcXVpcmUtaXMtZmxvYXQvJyArXG4vLyAgICdyZXF1aXJlLWlzLWZsb2F0Lm1vZHVsZS50cycpO1xuLy8gICByZXF1aXJlKFxuLy8gICAgICdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4vLyAgICAgJ3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci9zY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3IubW9kdWxlLnRzJyk7XG4vLyAgICAgcmVxdWlyZShcbi8vICAgICAgICdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4vLyAgICAgICAnc2NoZW1hLWJhc2VkLWNob2ljZXMtZWRpdG9yL3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci5tb2R1bGUudHMnKTtcbi8vICAgICAgIHJlcXVpcmUoXG4vLyAgICAgICAgICdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4vLyAgICAgICAgICdzY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci9zY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci5tb2R1bGUudHMnKTtcbi8vICAgICAgICAgcmVxdWlyZShcbi8vICAgICAgICAgICAnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuLy8gICAgICAgICAgICdzY2hlbWEtYmFzZWQtZmxvYXQtZWRpdG9yL3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL2NyZWF0ZS1idXR0b24vJyArXG4gICAgJ2NyZWF0ZS1hY3Rpdml0eS1idXR0b24ubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL2V4cGxvcmF0aW9uLWVtYmVkLW1vZGFsLycgK1xuICAgICdleHBsb3JhdGlvbi1lbWJlZC1idXR0b24ubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL2hpbnQtYW5kLXNvbHV0aW9uLWJ1dHRvbnMvJyArXG4gICAgJ2hpbnQtYW5kLXNvbHV0aW9uLWJ1dHRvbnMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL3NvY2lhbC1idXR0b25zL3NvY2lhbC1idXR0b25zLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9idXR0b25zLWRpcmVjdGl2ZXMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzL2NrLWVkaXRvci1ydGUvY2stZWRpdG9yLXJ0ZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY2stZWRpdG9yLWhlbHBlcnMvY2stZWRpdG9yLXdpZGdldHMvY2stZWRpdG9yLXdpZGdldHMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzL2NrLWVkaXRvci1oZWxwZXJzLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb2RlbWlycm9yLW1lcmdldmlldy9jb2RlbWlycm9yLW1lcmdldmlldy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2FsZXJ0LW1lc3NhZ2UvYWxlcnQtbWVzc2FnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2F0dHJpYnV0aW9uLWd1aWRlLycgK1xuICAgICdhdHRyaWJ1dGlvbi1ndWlkZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2JhY2tncm91bmQtYmFubmVyLycgK1xuICAgICdiYWNrZ3JvdW5kLWJhbm5lci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2xvYWRpbmctZG90cy9sb2FkaW5nLWRvdHMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9wcm9tby1iYXIvcHJvbW8tYmFyLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvc2hhcmluZy1saW5rcy9zaGFyaW5nLWxpbmtzLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvc2lkZS1uYXZpZ2F0aW9uLWJhci8nICtcbiAgICAnc2lkZS1uYXZpZ2F0aW9uLWJhci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL3RvcC1uYXZpZ2F0aW9uLWJhci8nICtcbiAgICAndG9wLW5hdmlnYXRpb24tYmFyLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvZW50aXR5LWNyZWF0aW9uLXNlcnZpY2VzLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL2FwcGx5LXZhbGlkYXRpb24vJyArXG4gICAgJ2FwcGx5LXZhbGlkYXRpb24ubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvYXVkaW8tZmlsZS11cGxvYWRlci8nICtcbiAgICAnYXVkaW8tZmlsZS11cGxvYWRlci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9odG1sLXNlbGVjdC9odG1sLXNlbGVjdC5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9pbWFnZS11cGxvYWRlci9pbWFnZS11cGxvYWRlci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9vYmplY3QtZWRpdG9yL29iamVjdC1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvcmVxdWlyZS1pcy1mbG9hdC8nICtcbiAgICAncmVxdWlyZS1pcy1mbG9hdC5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9zZWxlY3QyLWRyb3Bkb3duLycgK1xuICAgICdzZWxlY3QyLWRyb3Bkb3duLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL2Zvcm1zLWRpcmVjdGl2ZXMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci9zY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci9zY2hlbWEtYmFzZWQtY2hvaWNlcy1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yL3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZGljdC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZmxvYXQtZWRpdG9yL3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1odG1sLWVkaXRvci9zY2hlbWEtYmFzZWQtaHRtbC1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yL3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtbGlzdC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWxpc3QtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3Ivc2NoZW1hLWJhc2VkLXVuaWNvZGUtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZXhwcmVzc2lvbi1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1leHByZXNzaW9uLWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvZm9ybXMtc2NoZW1hLWVkaXRvcnMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXVuaWNvZGUtZmlsdGVycy9mb3Jtcy11bmljb2RlLWZpbHRlcnMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvZm9ybXMtdmFsaWRhdG9ycy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlL2NpcmN1bGFyLWltYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9wcm9maWxlLWxpbmstZGlyZWN0aXZlcy9wcm9maWxlLWxpbmstaW1hZ2UvJyArXG4gICAgJ3Byb2ZpbGUtbGluay1pbWFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvcHJvZmlsZS1saW5rLWRpcmVjdGl2ZXMvcHJvZmlsZS1saW5rLXRleHQvJyArXG4gICAgJ3Byb2ZpbGUtbGluay10ZXh0Lm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9wcm9maWxlLWxpbmstZGlyZWN0aXZlcy9wcm9maWxlLWxpbmstZGlyZWN0aXZlcy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvcmF0aW5ncy9yYXRpbmctZGlzcGxheS9yYXRpbmctZGlzcGxheS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvcmF0aW5ncy9yYXRpbmdzLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdGF0ZS9hbnN3ZXItZ3JvdXAtZWRpdG9yL2Fuc3dlci1ncm91cC1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlL2hpbnQtZWRpdG9yL2hpbnQtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdGF0ZS9vdXRjb21lLWVkaXRvci9vdXRjb21lLWRlc3RpbmF0aW9uLWVkaXRvci8nICtcbiAgICAnb3V0Y29tZS1kZXN0aW5hdGlvbi1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlL291dGNvbWUtZWRpdG9yL291dGNvbWUtZmVlZGJhY2stZWRpdG9yLycgK1xuICAgICdvdXRjb21lLWZlZWRiYWNrLWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvc3RhdGUvb3V0Y29tZS1lZGl0b3Ivb3V0Y29tZS1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlL3Jlc3BvbnNlLWhlYWRlci9yZXNwb25zZS1oZWFkZXIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlL3J1bGUtZWRpdG9yL3J1bGUtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdGF0ZS9ydWxlLXR5cGUtc2VsZWN0b3IvcnVsZS10eXBlLXNlbGVjdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdGF0ZS9zb2x1dGlvbi1lZGl0b3Ivc29sdXRpb24tZXhwbGFuYXRpb24tZWRpdG9yLycgK1xuICAgICdzb2x1dGlvbi1leHBsYW5hdGlvbi1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlL3NvbHV0aW9uLWVkaXRvci9zb2x1dGlvbi1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlL3N0YXRlLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LWxpc3QtaGVhZGVyL3N1bW1hcnktbGlzdC1oZWFkZXIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlLycgK1xuICAgICdjb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvc3VtbWFyeS10aWxlLWRpcmVjdGl2ZXMvZXhwbG9yYXRpb24tc3VtbWFyeS10aWxlLycgK1xuICAgICdleHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL3N0b3J5LXN1bW1hcnktdGlsZS8nICtcbiAgICAnc3Rvcnktc3VtbWFyeS10aWxlLm1vZHVsZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvdmVyc2lvbi1kaWZmLXZpc3VhbGl6YXRpb24vdmVyc2lvbi1kaWZmLXZpc3VhbGl6YXRpb24ubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvZmlsdGVycy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2Fib3V0LXBhZ2UvYWJvdXQtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvYWN0aXZpdGllcy10YWIvYWRtaW4tZGV2LW1vZGUtYWN0aXZpdGllcy10YWIvJyArXG4gICAgJ2FkbWluLWRldi1tb2RlLWFjdGl2aXRpZXMtdGFiLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hY3Rpdml0aWVzLXRhYi9hZG1pbi1wcm9kLW1vZGUtYWN0aXZpdGllcy10YWIvJyArXG4gICAgJ2FkbWluLXByb2QtbW9kZS1hY3Rpdml0aWVzLXRhYi5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tbmF2YmFyL2FkbWluLW5hdmJhci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvY29uZmlnLXRhYi9hZG1pbi1jb25maWctdGFiLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9qb2JzLXRhYi9hZG1pbi1qb2JzLXRhYi5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvbWlzYy10YWIvYWRtaW4tbWlzYy10YWIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL3JvbGVzLXRhYi9yb2xlcy1ncmFwaC9yb2xlLWdyYXBoLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvYWRtaW4tcm9sZXMtdGFiLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWZvb3Rlci9jb2xsZWN0aW9uLWZvb3Rlci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1sb2NhbC1uYXYvJyArXG4gICAgJ2NvbGxlY3Rpb24tbG9jYWwtbmF2Lm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLW5vZGUtbGlzdC8nICtcbiAgICAnY29sbGVjdGlvbi1ub2RlLWxpc3QubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jcmVhdG9yLWRhc2hib2FyZC1wYWdlL2NyZWF0b3ItZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9kb25hdGUtcGFnZS9kb25hdGUtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2VtYWlsLWRhc2hib2FyZC1wYWdlL2VtYWlsLWRhc2hib2FyZC1yZXN1bHQvJyArXG4gICAgJ2VtYWlsLWRhc2hib2FyZC1yZXN1bHQubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZS9lbWFpbC1kYXNoYm9hcmQtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2Vycm9yLXBhZ2UvZXJyb3ItcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2VkaXRvci1uYXZiYXItYnJlYWRjcnVtYi8nICtcbiAgICAnZWRpdG9yLW5hdmJhci1icmVhZGNydW1iLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZWRpdG9yLW5hdmlnYXRpb24vJyArXG4gICAgJ2VkaXRvci1uYXZpZ2F0aW9uLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi9leHBsb3JhdGlvbi1ncmFwaC8nICtcbiAgICAnZXhwbG9yYXRpb24tZ3JhcGgubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiLycgK1xuICAgICdzdGF0ZS1ncmFwaC12aXN1YWxpemF0aW9uL3N0YXRlLWdyYXBoLXZpc3VhbGl6YXRpb24ubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiL3N0YXRlLW5hbWUtZWRpdG9yLycgK1xuICAgICdzdGF0ZS1uYW1lLWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvJyArXG4gICAgJ3N0YXRlLXBhcmFtLWNoYW5nZXMtZWRpdG9yL3N0YXRlLXBhcmFtLWNoYW5nZXMtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi8nICtcbiAgICAndGVzdC1pbnRlcmFjdGlvbi1wYW5lbC90ZXN0LWludGVyYWN0aW9uLXBhbmVsLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi90cmFpbmluZy1wYW5lbC8nICtcbiAgICAndHJhaW5pbmctcGFuZWwubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiLycgK1xuICAgICd1bnJlc29sdmVkLWFuc3dlcnMtb3ZlcnZpZXcvdW5yZXNvbHZlZC1hbnN3ZXJzLW92ZXJ2aWV3Lm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi8nICtcbiAgICAnZXhwbG9yYXRpb24tZWRpdG9yLXRhYi5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLW9iamVjdGl2ZS1lZGl0b3IvJyArXG4gICAgJ2V4cGxvcmF0aW9uLW9iamVjdGl2ZS1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1zYXZlLWFuZC1wdWJsaXNoLWJ1dHRvbnMvJyArXG4gICAgJ2V4cGxvcmF0aW9uLXNhdmUtYW5kLXB1Ymxpc2gtYnV0dG9ucy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLXRpdGxlLWVkaXRvci8nICtcbiAgICAnZXhwbG9yYXRpb24tdGl0bGUtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZmVlZGJhY2stdGFiL3RocmVhZC10YWJsZS8nICtcbiAgICAndGhyZWFkLXRhYmxlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZmVlZGJhY2stdGFiL2ZlZWRiYWNrLXRhYi5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2hpc3RvcnktdGFiL2hpc3RvcnktdGFiLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvaW1wcm92ZW1lbnRzLXRhYi8nICtcbiAgICAncGxheXRocm91Z2gtaW1wcm92ZW1lbnQtY2FyZC9wbGF5dGhyb3VnaC1pbXByb3ZlbWVudC1jYXJkLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvaW1wcm92ZW1lbnRzLXRhYi9pbXByb3ZlbWVudHMtdGFiLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvJyArXG4gICAgJ21hcmstYWxsLWF1ZGlvLWFuZC10cmFuc2xhdGlvbnMtYXMtbmVlZGluZy11cGRhdGUvJyArXG4gICAgJ21hcmstYWxsLWF1ZGlvLWFuZC10cmFuc2xhdGlvbnMtYXMtbmVlZGluZy11cGRhdGUubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9wYXJhbS1jaGFuZ2VzLWVkaXRvci8nICtcbiAgICAncGFyYW0tY2hhbmdlcy1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9wcmV2aWV3LXRhYi9wcmV2aWV3LXRhYi5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3NldHRpbmdzLXRhYi9zZXR0aW5ncy10YWIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9iYXItY2hhcnQvYmFyLWNoYXJ0Lm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvY3ljbGljLXRyYW5zaXRpb25zLWlzc3VlLycgK1xuICAgICdjeWNsaWMtdHJhbnNpdGlvbnMtaXNzdWUubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9lYXJseS1xdWl0LWlzc3VlLycgK1xuICAgICdlYXJseS1xdWl0LWlzc3VlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvbXVsdGlwbGUtaW5jb3JyZWN0LWlzc3VlLycgK1xuICAgICdtdWx0aXBsZS1pbmNvcnJlY3QtaXNzdWUubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9waWUtY2hhcnQvcGllLWNoYXJ0Lm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvcGxheXRocm91Z2gtaXNzdWVzLycgK1xuICAgICdwbGF5dGhyb3VnaC1pc3N1ZXMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9zdGF0aXN0aWNzLXRhYi5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3RyYW5zbGF0aW9uLXRhYi9hdWRpby10cmFuc2xhdGlvbi1iYXIvJyArXG4gICAgJ2F1ZGlvLXRyYW5zbGF0aW9uLWJhci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3RyYW5zbGF0aW9uLXRhYi9zdGF0ZS10cmFuc2xhdGlvbi8nICtcbiAgICAnc3RhdGUtdHJhbnNsYXRpb24ubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS90cmFuc2xhdGlvbi10YWIvc3RhdGUtdHJhbnNsYXRpb24tZWRpdG9yLycgK1xuICAgICdzdGF0ZS10cmFuc2xhdGlvbi1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS90cmFuc2xhdGlvbi10YWIvJyArXG4gICAgJ3N0YXRlLXRyYW5zbGF0aW9uLXN0YXR1cy1ncmFwaC9zdGF0ZS10cmFuc2xhdGlvbi1zdGF0dXMtZ3JhcGgubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS90cmFuc2xhdGlvbi10YWIvdHJhbnNsYXRvci1vdmVydmlldy8nICtcbiAgICAndHJhbnNsYXRvci1vdmVydmlldy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3RyYW5zbGF0aW9uLXRhYi90cmFuc2xhdGlvbi10YWIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS92YWx1ZS1nZW5lcmF0b3ItZWRpdG9yLycgK1xuICAgICd2YWx1ZS1nZW5lcmF0b3ItZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9saWJyYXJ5LXBhZ2UvYWN0aXZpdHktdGlsZXMtaW5maW5pdHktZ3JpZC8nICtcbiAgICAnYWN0aXZpdHktdGlsZXMtaW5maW5pdHktZ3JpZC5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2xpYnJhcnktcGFnZS9zZWFyY2gtYmFyL3NlYXJjaC1iYXIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLXJlc3VsdHMvc2VhcmNoLXJlc3VsdHMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1mb290ZXIvbGlicmFyeS1mb290ZXIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvbWFpbnRlbmFuY2UtcGFnZS9tYWludGVuYW5jZS1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvbW9kZXJhdG9yLXBhZ2UvbW9kZXJhdG9yLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9ub3RpZmljYXRpb25zLWRhc2hib2FyZC1wYWdlL25vdGlmaWNhdGlvbnMtZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9wcmFjdGljZS1zZXNzaW9uLXBhZ2UvcHJhY3RpY2Utc2Vzc2lvbi1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvcHJlZmVyZW5jZXMtcGFnZS9wcmVmZXJlbmNlcy1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvcHJvZmlsZS1wYWdlL3Byb2ZpbGUtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3F1ZXN0aW9uLWVkaXRvci1wYWdlL3F1ZXN0aW9uLWVkaXRvci1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvcXVlc3Rpb24tcGxheWVyLXBhZ2UvcXVlc3Rpb24tcGxheWVyLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9xdWVzdGlvbnMtbGlzdC1wYWdlL3F1ZXN0aW9ucy1saXN0LXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zaG93LXN1Z2dlc3Rpb24tZWRpdG9yLXBhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1tb2RhbC1mb3ItY3JlYXRvci12aWV3LycgK1xuICAgICdzaG93LXN1Z2dlc3Rpb24tbW9kYWwtZm9yLWNyZWF0b3Itdmlldy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1lZGl0b3ItcGFnZXMvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1lZGl0b3Itdmlldy8nICtcbiAgICAnc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1lZGl0b3Itdmlldy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1lZGl0b3ItcGFnZXMvJyArXG4gICAgJ3Nob3ctc3VnZ2VzdGlvbi1tb2RhbC1mb3ItbGVhcm5lci1sb2NhbC12aWV3LycgK1xuICAgICdzaG93LXN1Z2dlc3Rpb24tbW9kYWwtZm9yLWxlYXJuZXItbG9jYWwtdmlldy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1lZGl0b3ItcGFnZXMvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLXZpZXcvJyArXG4gICAgJ3Nob3ctc3VnZ2VzdGlvbi1tb2RhbC1mb3ItbGVhcm5lci12aWV3Lm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc2hvdy1zdWdnZXN0aW9uLWVkaXRvci1wYWdlcy9zdWdnZXN0aW9uLW1vZGFsLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc2lnbnVwLXBhZ2Uvc2lnbnVwLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9za2lsbC1lZGl0b3ItcGFnZS9za2lsbC1lZGl0b3ItbWFpbi10YWIvc2tpbGwtY29uY2VwdC1jYXJkLWVkaXRvci8nICtcbiAgICAnd29ya2VkLWV4YW1wbGUtZWRpdG9yL3dvcmtlZC1leGFtcGxlLWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1tYWluLXRhYi9za2lsbC1jb25jZXB0LWNhcmQtZWRpdG9yLycgK1xuICAgICdza2lsbC1jb25jZXB0LWNhcmQtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLW1haW4tdGFiL3NraWxsLWRlc2NyaXB0aW9uLWVkaXRvci8nICtcbiAgICAnc2tpbGwtZGVzY3JpcHRpb24tZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLW1haW4tdGFiL3NraWxsLW1pc2NvbmNlcHRpb25zLWVkaXRvci8nICtcbiAgICAnbWlzY29uY2VwdGlvbi1lZGl0b3IvbWlzY29uY2VwdGlvbi1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9za2lsbC1lZGl0b3ItcGFnZS9za2lsbC1lZGl0b3ItbWFpbi10YWIvc2tpbGwtbWlzY29uY2VwdGlvbnMtZWRpdG9yLycgK1xuICAgICdza2lsbC1taXNjb25jZXB0aW9ucy1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9za2lsbC1lZGl0b3ItcGFnZS9za2lsbC1lZGl0b3ItbWFpbi10YWIvJyArXG4gICAgJ3NraWxsLWVkaXRvci1tYWluLXRhYi5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1uYXZiYXIvc2tpbGwtZWRpdG9yLW5hdmJhci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi8nICtcbiAgICAnc2tpbGwtZWRpdG9yLW5hdmJhci1icmVhZGNydW1iLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLXF1ZXN0aW9ucy10YWIvJyArXG4gICAgJ3NraWxsLWVkaXRvci1xdWVzdGlvbnMtdGFiLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zcGxhc2gtcGFnZS9zcGxhc2gtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1jb250ZW50LWVkaXRvci9zdGF0ZS1jb250ZW50LWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1oaW50cy1lZGl0b3Ivc3RhdGUtaGludHMtZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RhdGUtZWRpdG9yL3N0YXRlLWludGVyYWN0aW9uLWVkaXRvci8nICtcbiAgICAnc3RhdGUtaW50ZXJhY3Rpb24tZWRpdG9yLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RhdGUtZWRpdG9yL3N0YXRlLXJlc3BvbnNlcy9zdGF0ZS1yZXNwb25zZXMubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdGF0ZS1lZGl0b3Ivc3RhdGUtc29sdXRpb24tZWRpdG9yL3N0YXRlLXNvbHV0aW9uLWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9tYWluLXN0b3J5LWVkaXRvci9zdG9yeS1ub2RlLWVkaXRvci8nICtcbiAgICAnc3Rvcnktbm9kZS1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9tYWluLXN0b3J5LWVkaXRvci9tYWluLXN0b3J5LWVkaXRvci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1uYXZiYXIvc3RvcnktZWRpdG9yLW5hdmJhci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi8nICtcbiAgICAnc3RvcnktZWRpdG9yLW5hdmJhci1icmVhZGNydW1iLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90aGFua3MtcGFnZS90aGFua3MtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RlYWNoLXBhZ2UvdGVhY2gtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljLWVkaXRvci1wYWdlL21haW4tdG9waWMtZWRpdG9yL21haW4tdG9waWMtZWRpdG9yLXN0b3JpZXMtbGlzdC8nICtcbiAgICAnbWFpbi10b3BpYy1lZGl0b3Itc3Rvcmllcy1saXN0Lm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWMtZWRpdG9yLXBhZ2UvbWFpbi10b3BpYy1lZGl0b3IvbWFpbi10b3BpYy1lZGl0b3IubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy1lZGl0b3ItcGFnZS9xdWVzdGlvbnMtdGFiL3F1ZXN0aW9ucy10YWIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy1lZGl0b3ItcGFnZS9zdWJ0b3BpY3MtbGlzdC10YWIvc3VidG9waWNzLWxpc3QtdGFiLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWMtZWRpdG9yLXBhZ2UvdG9waWMtZWRpdG9yLW5hdmJhci90b3BpYy1lZGl0b3ItbmF2YmFyLm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWMtZWRpdG9yLXBhZ2UvdG9waWMtZWRpdG9yLW5hdmJhci1icmVhZGNydW1iLycgK1xuICAgICd0b3BpYy1lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy1lZGl0b3ItcGFnZS90b3BpYy1lZGl0b3ItcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljLWxhbmRpbmctcGFnZS90b3BpYy1sYW5kaW5nLXBhZ2Utc3Rld2FyZHMvJyArXG4gICAgJ3RvcGljLWxhbmRpbmctcGFnZS1zdGV3YXJkcy5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljLWxhbmRpbmctcGFnZS90b3BpYy1sYW5kaW5nLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy12aWV3ZXItcGFnZS9zdG9yaWVzLWxpc3Qvc3Rvcmllcy1saXN0Lm1vZHVsZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWMtdmlld2VyLXBhZ2UvdG9waWMtdmlld2VyLW5hdmJhci1icmVhZGNydW1iLycgK1xuICAgICd0b3BpYy12aWV3ZXItbmF2YmFyLWJyZWFkY3J1bWIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy12aWV3ZXItcGFnZS90b3BpYy12aWV3ZXItcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3NlbGVjdC10b3BpY3MvJyArXG4gICAgJ3NlbGVjdC10b3BpY3MubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9za2lsbHMtbGlzdC9za2lsbHMtbGlzdC5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS1uYXZiYXIvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLW5hdmJhci5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS1uYXZiYXItYnJlYWRjcnVtYi8nICtcbiAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtbmF2YmFyLWJyZWFkY3J1bWIubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90b3BpY3MtbGlzdC90b3BpY3MtbGlzdC5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ0kxOG5Gb290ZXIudHMnKTtcbnJlcXVpcmUoJ2RpcmVjdGl2ZXMvRm9jdXNPbkRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvQmFzZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29udGV4dFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05hdmlnYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9VdGlsc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RlYm91bmNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9UcmFuc2xhdGlvbkZpbGVIYXNoTG9hZGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUnRlSGVscGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU3RhdGVSdWxlc1N0YXRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUHJvbW9CYXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL0RldmljZUluZm9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvRm9jdXNNYW5hZ2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2l0ZUFuYWx5dGljc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2FsZXJ0LW1lc3NhZ2UvJyArXG4gICAgJ2FsZXJ0LW1lc3NhZ2UuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL2NyZWF0ZS1idXR0b24vJyArXG4gICAgJ2NyZWF0ZS1hY3Rpdml0eS1idXR0b24uZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvb2JqZWN0LWVkaXRvci9vYmplY3QtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvcHJvbW8tYmFyL3Byb21vLWJhci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL3NpZGUtbmF2aWdhdGlvbi1iYXIvJyArXG4gICAgJ3NpZGUtbmF2aWdhdGlvbi1iYXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL3NvY2lhbC1idXR0b25zL3NvY2lhbC1idXR0b25zLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvdG9wLW5hdmlnYXRpb24tYmFyLycgK1xuICAgICd0b3AtbmF2aWdhdGlvbi1iYXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc2lkZWJhci9TaWRlYmFyU3RhdHVzU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3VzZXIvVXNlckluZm9PYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkaXJlY3RpdmVzL0ZvY3VzT25EaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdmFsaWRhdG9ycy9pcy1hdC1sZWFzdC5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdmFsaWRhdG9ycy9pcy1hdC1tb3N0LmZpbHRlci50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWZsb2F0LmZpbHRlci50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWludGVnZXIuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvaXMtbm9uZW1wdHkuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvYXBwbHktdmFsaWRhdGlvbi8nICtcbiAgICAnYXBwbHktdmFsaWRhdGlvbi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9vYmplY3QtZWRpdG9yLycgK1xuICAgICdvYmplY3QtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3JlcXVpcmUtaXMtZmxvYXQvJyArXG4gICAgJ3JlcXVpcmUtaXMtZmxvYXQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci9zY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci9zY2hlbWEtYmFzZWQtY2hvaWNlcy1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yL3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZGljdC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZXhwcmVzc2lvbi1lZGl0b3Ivc2NoZW1hLWJhc2VkLWV4cHJlc3Npb24tZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZmxvYXQtZWRpdG9yL3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1odG1sLWVkaXRvci9zY2hlbWEtYmFzZWQtaHRtbC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yL3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtbGlzdC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWxpc3QtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3Ivc2NoZW1hLWJhc2VkLXVuaWNvZGUtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xuLy8gXl5eIHRoaXMgYmxvY2sgb2YgcmVxdWlyZXMgc2hvdWxkIGJlIHJlbW92ZWQgXl5eXG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FkbWluLW5hdmJhci9hZG1pbi1uYXZiYXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2FjdGl2aXRpZXMtdGFiL2FkbWluLWRldi1tb2RlLWFjdGl2aXRpZXMtdGFiLycgK1xuICAgICdhZG1pbi1kZXYtbW9kZS1hY3Rpdml0aWVzLXRhYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvYWN0aXZpdGllcy10YWIvYWRtaW4tcHJvZC1tb2RlLWFjdGl2aXRpZXMtdGFiLycgK1xuICAgICdhZG1pbi1wcm9kLW1vZGUtYWN0aXZpdGllcy10YWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL2NvbmZpZy10YWIvYWRtaW4tY29uZmlnLXRhYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2Uvam9icy10YWIvYWRtaW4tam9icy10YWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9hZG1pbi1wYWdlL21pc2MtdGFiL2FkbWluLW1pc2MtdGFiLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvYWRtaW4tcm9sZXMtdGFiLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL29iamVjdHMvTnVtYmVyV2l0aFVuaXRzT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLXNlcnZpY2VzL2FkbWluLXJvdXRlci9hZG1pbi1yb3V0ZXIuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXRpbHNTZXJ2aWNlLnRzJyk7XG5vcHBpYS5jb250cm9sbGVyKCdBZG1pbicsIFtcbiAgICAnJGh0dHAnLCAnJGxvY2F0aW9uJywgJyRzY29wZScsICdBZG1pblJvdXRlclNlcnZpY2UnLCAnREVWX01PREUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJGxvY2F0aW9uLCAkc2NvcGUsIEFkbWluUm91dGVyU2VydmljZSwgREVWX01PREUpIHtcbiAgICAgICAgJHNjb3BlLnVzZXJFbWFpbCA9IEdMT0JBTFMuVVNFUl9FTUFJTDtcbiAgICAgICAgJHNjb3BlLmluRGV2TW9kZSA9IERFVl9NT0RFO1xuICAgICAgICAkc2NvcGUuc3RhdHVzTWVzc2FnZSA9ICcnO1xuICAgICAgICAkc2NvcGUuaXNBY3Rpdml0aWVzVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc0FjdGl2aXRpZXNUYWJPcGVuO1xuICAgICAgICAkc2NvcGUuaXNKb2JzVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc0pvYnNUYWJPcGVuO1xuICAgICAgICAkc2NvcGUuaXNDb25maWdUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzQ29uZmlnVGFiT3BlbjtcbiAgICAgICAgJHNjb3BlLmlzUm9sZXNUYWJPcGVuID0gQWRtaW5Sb3V0ZXJTZXJ2aWNlLmlzUm9sZXNUYWJPcGVuO1xuICAgICAgICAkc2NvcGUuaXNNaXNjVGFiT3BlbiA9IEFkbWluUm91dGVyU2VydmljZS5pc01pc2NUYWJPcGVuO1xuICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSA9IGZ1bmN0aW9uIChzdGF0dXNNZXNzYWdlKSB7XG4gICAgICAgICAgICAkc2NvcGUuc3RhdHVzTWVzc2FnZSA9IHN0YXR1c01lc3NhZ2U7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS4kb24oJyRsb2NhdGlvbkNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBBZG1pblJvdXRlclNlcnZpY2Uuc2hvd1RhYigkbG9jYXRpb24ucGF0aCgpLnJlcGxhY2UoJy8nLCAnIycpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGNvbmZpZ3VyYXRpb24gdGFiIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLXNlcnZpY2VzL2FkbWluLXRhc2stbWFuYWdlci8nICtcbiAgICAnYWRtaW4tdGFzay1tYW5hZ2VyLnNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdhZG1pbkNvbmZpZ1RhYk1vZHVsZScpLmRpcmVjdGl2ZSgnYWRtaW5Db25maWdUYWInLCBbXG4gICAgJyRodHRwJywgJ0FkbWluVGFza01hbmFnZXJTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnQURNSU5fSEFORExFUl9VUkwnLCBmdW5jdGlvbiAoJGh0dHAsIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQURNSU5fSEFORExFUl9VUkwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHNldFN0YXR1c01lc3NhZ2U6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2FkbWluLXBhZ2UvY29uZmlnLXRhYi8nICtcbiAgICAgICAgICAgICAgICAnYWRtaW4tY29uZmlnLXRhYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWdQcm9wZXJ0aWVzID0ge307XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc05vbmVtcHR5T2JqZWN0ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhc0F0TGVhc3RPbmVFbGVtZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNBdExlYXN0T25lRWxlbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGFzQXRMZWFzdE9uZUVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWxvYWRDb25maWdQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAuZ2V0KEFETUlOX0hBTkRMRVJfVVJMKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maWdQcm9wZXJ0aWVzID0gcmVzcG9uc2UuZGF0YS5jb25maWdfcHJvcGVydGllcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmV2ZXJ0VG9EZWZhdWx0Q29uZmlnUHJvcGVydHlWYWx1ZSA9IGZ1bmN0aW9uIChjb25maWdQcm9wZXJ0eUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbmZpcm0oJ1RoaXMgYWN0aW9uIGlzIGlycmV2ZXJzaWJsZS4gQXJlIHlvdSBzdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3JldmVydF9jb25maWdfcHJvcGVydHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ19wcm9wZXJ0eV9pZDogY29uZmlnUHJvcGVydHlJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ0NvbmZpZyBwcm9wZXJ0eSByZXZlcnRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbG9hZENvbmZpZ1Byb3BlcnRpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmVDb25maWdQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmlzVGFza1J1bm5pbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29uZmlybSgnVGhpcyBhY3Rpb24gaXMgaXJyZXZlcnNpYmxlLiBBcmUgeW91IHN1cmU/JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnU2F2aW5nLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5zdGFydFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdDb25maWdQcm9wZXJ0eVZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gJHNjb3BlLmNvbmZpZ1Byb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdDb25maWdQcm9wZXJ0eVZhbHVlc1twcm9wZXJ0eV0gPSAoJHNjb3BlLmNvbmZpZ1Byb3BlcnRpZXNbcHJvcGVydHldLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdzYXZlX2NvbmZpZ19wcm9wZXJ0aWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfY29uZmlnX3Byb3BlcnR5X3ZhbHVlczogbmV3Q29uZmlnUHJvcGVydHlWYWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdEYXRhIHNhdmVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVsb2FkQ29uZmlnUHJvcGVydGllcygpO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGpvYnMgdGFiIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2FkbWluSm9ic1RhYk1vZHVsZScpLmRpcmVjdGl2ZSgnYWRtaW5Kb2JzVGFiJywgW1xuICAgICckaHR0cCcsICckdGltZW91dCcsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdBRE1JTl9IQU5ETEVSX1VSTCcsXG4gICAgJ0FETUlOX0pPQl9PVVRQVVRfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICR0aW1lb3V0LCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQURNSU5fSEFORExFUl9VUkwsIEFETUlOX0pPQl9PVVRQVVRfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBzZXRTdGF0dXNNZXNzYWdlOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9hZG1pbi1wYWdlL2pvYnMtdGFiLycgK1xuICAgICAgICAgICAgICAgICdhZG1pbi1qb2JzLXRhYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5IVU1BTl9SRUFEQUJMRV9DVVJSRU5UX1RJTUUgPSAoR0xPQkFMUy5IVU1BTl9SRUFEQUJMRV9DVVJSRU5UX1RJTUUpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuQ09OVElOVU9VU19DT01QVVRBVElPTlNfREFUQSA9IChHTE9CQUxTLkNPTlRJTlVPVVNfQ09NUFVUQVRJT05TX0RBVEEpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuT05FX09GRl9KT0JfU1BFQ1MgPSBHTE9CQUxTLk9ORV9PRkZfSk9CX1NQRUNTO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuVU5GSU5JU0hFRF9KT0JfREFUQSA9IEdMT0JBTFMuVU5GSU5JU0hFRF9KT0JfREFUQTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLlJFQ0VOVF9KT0JfREFUQSA9IEdMT0JBTFMuUkVDRU5UX0pPQl9EQVRBO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd2luZ0pvYk91dHB1dCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd0pvYk91dHB1dCA9IGZ1bmN0aW9uIChqb2JJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFkbWluSm9iT3V0cHV0VXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoQURNSU5fSk9CX09VVFBVVF9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqb2JJZDogam9iSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAuZ2V0KGFkbWluSm9iT3V0cHV0VXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93aW5nSm9iT3V0cHV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuam9iT3V0cHV0ID0gcmVzcG9uc2UuZGF0YS5vdXRwdXQgfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmpvYk91dHB1dC5zb3J0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjam9iLW91dHB1dCcpLnNjcm9sbEludG9WaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0TmV3Sm9iID0gZnVuY3Rpb24gKGpvYlR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdTdGFydGluZyBuZXcgam9iLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KEFETUlOX0hBTkRMRVJfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc3RhcnRfbmV3X2pvYicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgam9iX3R5cGU6IGpvYlR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdKb2Igc3RhcnRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnU2VydmVyIGVycm9yOiAnICsgZXJyb3JSZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsSm9iID0gZnVuY3Rpb24gKGpvYklkLCBqb2JUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnQ2FuY2VsbGluZyBqb2IuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdjYW5jZWxfam9iJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqb2JfaWQ6IGpvYklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpvYl90eXBlOiBqb2JUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnQWJvcnQgc2lnbmFsIHNlbnQgdG8gam9iLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0Q29tcHV0YXRpb24gPSBmdW5jdGlvbiAoY29tcHV0YXRpb25UeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnU3RhcnRpbmcgY29tcHV0YXRpb24uLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdzdGFydF9jb21wdXRhdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0YXRpb25fdHlwZTogY29tcHV0YXRpb25UeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnQ29tcHV0YXRpb24gc3RhcnRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnU2VydmVyIGVycm9yOiAnICsgZXJyb3JSZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcENvbXB1dGF0aW9uID0gZnVuY3Rpb24gKGNvbXB1dGF0aW9uVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1N0b3BwaW5nIGNvbXB1dGF0aW9uLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KEFETUlOX0hBTkRMRVJfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc3RvcF9jb21wdXRhdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0YXRpb25fdHlwZTogY29tcHV0YXRpb25UeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnQWJvcnQgc2lnbmFsIHNlbnQgdG8gY29tcHV0YXRpb24uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnU2VydmVyIGVycm9yOiAnICsgZXJyb3JSZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIG1pc2NlbGxhbmVvdXMgdGFiIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9hZG1pbi1wYWdlLXNlcnZpY2VzL2FkbWluLXRhc2stbWFuYWdlci8nICtcbiAgICAnYWRtaW4tdGFzay1tYW5hZ2VyLnNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdhZG1pbk1pc2NUYWJNb2R1bGUnKS5kaXJlY3RpdmUoJ2FkbWluTWlzY1RhYicsIFtcbiAgICAnJGh0dHAnLCAnJHdpbmRvdycsICdBZG1pblRhc2tNYW5hZ2VyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0FETUlOX0hBTkRMRVJfVVJMJywgJ0FETUlOX1RPUElDU19DU1ZfRE9XTkxPQURfSEFORExFUl9VUkwnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHdpbmRvdywgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBBRE1JTl9IQU5ETEVSX1VSTCwgQURNSU5fVE9QSUNTX0NTVl9ET1dOTE9BRF9IQU5ETEVSX1VSTCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgc2V0U3RhdHVzTWVzc2FnZTogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvYWRtaW4tcGFnZS9taXNjLXRhYi8nICtcbiAgICAgICAgICAgICAgICAnYWRtaW4tbWlzYy10YWIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgREFUQV9FWFRSQUNUSU9OX1FVRVJZX0hBTkRMRVJfVVJMID0gKCcvZXhwbG9yYXRpb25kYXRhZXh0cmFjdGlvbmhhbmRsZXInKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNsZWFyU2VhcmNoSW5kZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UuaXNUYXNrUnVubmluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjb25maXJtKCdUaGlzIGFjdGlvbiBpcyBpcnJldmVyc2libGUuIEFyZSB5b3Ugc3VyZT8nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdDbGVhcmluZyBzZWFyY2ggaW5kZXguLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLnN0YXJ0VGFzaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChBRE1JTl9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2NsZWFyX3NlYXJjaF9pbmRleCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdJbmRleCBzdWNjZXNzZnVsbHkgY2xlYXJlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBsb2FkVG9waWNTaW1pbGFyaXRpZXNGaWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9waWNTaW1pbGFyaXRpZXNGaWxlJykuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndXBsb2FkX3RvcGljX3NpbWlsYXJpdGllcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1RvcGljIHNpbWlsYXJpdGllcyB1cGxvYWRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kb3dubG9hZFRvcGljU2ltaWxhcml0aWVzRmlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9IEFETUlOX1RPUElDU19DU1ZfRE9XTkxPQURfSEFORExFUl9VUkw7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXREYXRhRXh0cmFjdGlvblF1ZXJ5U3RhdHVzTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd0RhdGFFeHRyYWN0aW9uUXVlcnlTdGF0dXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRhdGFFeHRyYWN0aW9uUXVlcnlTdGF0dXNNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN1Ym1pdFF1ZXJ5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIFNUQVRVU19QRU5ESU5HID0gKCdEYXRhIGV4dHJhY3Rpb24gcXVlcnkgaGFzIGJlZW4gc3VibWl0dGVkLiBQbGVhc2Ugd2FpdC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBTVEFUVVNfRklOSVNIRUQgPSAnTG9hZGluZyB0aGUgZXh0cmFjdGVkIGRhdGEgLi4uJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBTVEFUVVNfRkFJTEVEID0gJ0Vycm9yLCAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0RGF0YUV4dHJhY3Rpb25RdWVyeVN0YXR1c01lc3NhZ2UoU1RBVFVTX1BFTkRJTkcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvd25sb2FkVXJsID0gREFUQV9FWFRSQUNUSU9OX1FVRVJZX0hBTkRMRVJfVVJMICsgJz8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG93bmxvYWRVcmwgKz0gJ2V4cF9pZD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCRzY29wZS5leHBJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFVybCArPSAnJmV4cF92ZXJzaW9uPScgKyBlbmNvZGVVUklDb21wb25lbnQoJHNjb3BlLmV4cFZlcnNpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG93bmxvYWRVcmwgKz0gJyZzdGF0ZV9uYW1lPScgKyBlbmNvZGVVUklDb21wb25lbnQoJHNjb3BlLnN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFVybCArPSAnJm51bV9hbnN3ZXJzPScgKyBlbmNvZGVVUklDb21wb25lbnQoJHNjb3BlLm51bUFuc3dlcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5vcGVuKGRvd25sb2FkVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0Rm9ybSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5leHBJZCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmV4cFZlcnNpb24gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXRlTmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm51bUFuc3dlcnMgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNob3dEYXRhRXh0cmFjdGlvblF1ZXJ5U3RhdHVzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgUm9sZXMgdGFiIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xucmVxdWlyZSgncGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvcm9sZXMtZ3JhcGgvcm9sZS1ncmFwaC5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tcGFnZS1zZXJ2aWNlcy9hZG1pbi10YXNrLW1hbmFnZXIvJyArXG4gICAgJ2FkbWluLXRhc2stbWFuYWdlci5zZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnYWRtaW5Sb2xlc1RhYk1vZHVsZScpLmRpcmVjdGl2ZSgnYWRtaW5Sb2xlc1RhYicsIFtcbiAgICAnJGh0dHAnLCAnQWRtaW5UYXNrTWFuYWdlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdBRE1JTl9ST0xFX0hBTkRMRVJfVVJMJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQURNSU5fUk9MRV9IQU5ETEVSX1VSTCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgc2V0U3RhdHVzTWVzc2FnZTogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvYWRtaW4tcm9sZXMtdGFiLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLlVQREFUQUJMRV9ST0xFUyA9IEdMT0JBTFMuVVBEQVRBQkxFX1JPTEVTO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuVklFV0FCTEVfUk9MRVMgPSBHTE9CQUxTLlZJRVdBQkxFX1JPTEVTO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNTdW1tYXJpZXMgPSBHTE9CQUxTLlRPUElDX1NVTU1BUklFUztcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdyYXBoRGF0YSA9IEdMT0JBTFMuUk9MRV9HUkFQSF9EQVRBO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzdWx0Um9sZXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJycpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudmlld0Zvcm1WYWx1ZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUZvcm1WYWx1ZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZpZXdGb3JtVmFsdWVzLm1ldGhvZCA9ICdyb2xlJztcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdyYXBoRGF0YUxvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGluZyBpbml0U3RhdGVJZCBhbmQgZmluYWxTdGF0ZUlkcyBmb3IgZ3JhcGhEYXRhXG4gICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIHJvbGUgZ3JhcGggaXMgYWN5Y2xpYywgbm9kZSB3aXRoIG5vIGluY29taW5nIGVkZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8gaXMgaW5pdFN0YXRlIGFuZCBub2RlcyB3aXRoIG5vIG91dGdvaW5nIGVkZ2UgYXJlIGZpbmFsU3RhdGVzLlxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzSW5jb21pbmdFZGdlID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYXNPdXRnb2luZ0VkZ2UgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2NvcGUuZ3JhcGhEYXRhLmxpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNJbmNvbWluZ0VkZ2UucHVzaCgkc2NvcGUuZ3JhcGhEYXRhLmxpbmtzW2ldLnRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNPdXRnb2luZ0VkZ2UucHVzaCgkc2NvcGUuZ3JhcGhEYXRhLmxpbmtzW2ldLnNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbmFsU3RhdGVJZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcm9sZSBpbiAkc2NvcGUuZ3JhcGhEYXRhLm5vZGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmdyYXBoRGF0YS5ub2Rlcy5oYXNPd25Qcm9wZXJ0eShyb2xlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNJbmNvbWluZ0VkZ2UuaW5kZXhPZihyb2xlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdyYXBoRGF0YS5pbml0U3RhdGVJZCA9IHJvbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNPdXRnb2luZ0VkZ2UuaW5kZXhPZihyb2xlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxTdGF0ZUlkcy5wdXNoKHJvbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ3JhcGhEYXRhLmZpbmFsU3RhdGVJZHMgPSBmaW5hbFN0YXRlSWRzO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ3JhcGhEYXRhTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN1Ym1pdFJvbGVWaWV3Rm9ybSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5pc1Rhc2tSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnUHJvY2Vzc2luZyBxdWVyeS4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQWRtaW5UYXNrTWFuYWdlclNlcnZpY2Uuc3RhcnRUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5nZXQoQURNSU5fUk9MRV9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHZhbHVlcy5tZXRob2QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU6IHZhbHVlcy5yb2xlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogdmFsdWVzLnVzZXJuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzdWx0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoJHNjb3BlLnJlc3VsdCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZXN1bHRSb2xlc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ05vIHJlc3VsdHMuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzdWx0Um9sZXNWaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1N1Y2Nlc3MuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS52aWV3Rm9ybVZhbHVlcy51c2VybmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS52aWV3Rm9ybVZhbHVlcy5yb2xlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRTdGF0dXNNZXNzYWdlKCdTZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvclJlc3BvbnNlLmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5maW5pc2hUYXNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zdWJtaXRVcGRhdGVSb2xlRm9ybSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5pc1Rhc2tSdW5uaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnVXBkYXRpbmcgVXNlciBSb2xlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBZG1pblRhc2tNYW5hZ2VyU2VydmljZS5zdGFydFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoQURNSU5fUk9MRV9IQU5ETEVSX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU6IHZhbHVlcy5uZXdSb2xlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB2YWx1ZXMudXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9waWNfaWQ6IHZhbHVlcy50b3BpY0lkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0U3RhdHVzTWVzc2FnZSgnUm9sZSBvZiAnICsgdmFsdWVzLnVzZXJuYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyBzdWNjZXNzZnVsbHkgdXBkYXRlZCB0byAnICsgdmFsdWVzLm5ld1JvbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVGb3JtVmFsdWVzLnVzZXJuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUZvcm1WYWx1ZXMubmV3Um9sZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVGb3JtVmFsdWVzLnRvcGljSWQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldFN0YXR1c01lc3NhZ2UoJ1NlcnZlciBlcnJvcjogJyArIGVycm9yUmVzcG9uc2UuZGF0YS5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFkbWluVGFza01hbmFnZXJTZXJ2aWNlLmZpbmlzaFRhc2soKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGRpc3BsYXlpbmcgUm9sZSBncmFwaC5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9TdGF0ZUdyYXBoTGF5b3V0U2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3JvbGVHcmFwaE1vZHVsZScpLmRpcmVjdGl2ZSgncm9sZUdyYXBoJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgLy8gQW4gb2JqZWN0IHdpdGggdGhlc2Uga2V5czpcbiAgICAgICAgICAgICAgICAvLyAgLSAnbm9kZXMnOiBBbiBvYmplY3Qgd2hvc2Uga2V5cyBhcmUgbm9kZSBpZHMgYW5kIHdob3NlIHZhbHVlcyBhcmVcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICBub2RlIGxhYmVsc1xuICAgICAgICAgICAgICAgIC8vICAtICdsaW5rcyc6IEEgbGlzdCBvZiBvYmplY3RzIHdpdGgga2V5czpcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICdzb3VyY2UnOiBpZCBvZiBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgJ3RhcmdldCc6IGlkIG9mIHRhcmdldCBub2RlXG4gICAgICAgICAgICAgICAgLy8gIC0gJ2luaXRTdGF0ZUlkJzogVGhlIGluaXRpYWwgc3RhdGUgaWRcbiAgICAgICAgICAgICAgICAvLyAgLSAnZmluYWxTdGF0ZUlkcyc6IFRoZSBsaXN0IG9mIGlkcyBjb3JyZXNwb25kaW5nIHRvIHRlcm1pbmFsIHN0YXRlc1xuICAgICAgICAgICAgICAgIGdyYXBoRGF0YTogJz0nLFxuICAgICAgICAgICAgICAgIC8vIEEgYm9vbGVhbiB2YWx1ZSB0byBzaWduaWZ5IHdoZXRoZXIgZ3JhcGhEYXRhIGlzIGNvbXBsZXRlbHkgbG9hZGVkLlxuICAgICAgICAgICAgICAgIGdyYXBoRGF0YUxvYWRlZDogJ0AnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvcm9sZXMtZ3JhcGgvcm9sZS1ncmFwaC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJGVsZW1lbnQnLCAnJHRpbWVvdXQnLCAnJGZpbHRlcicsICdTdGF0ZUdyYXBoTGF5b3V0U2VydmljZScsXG4gICAgICAgICAgICAgICAgJ01BWF9OT0RFU19QRVJfUk9XJywgJ01BWF9OT0RFX0xBQkVMX0xFTkdUSCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICR0aW1lb3V0LCAkZmlsdGVyLCBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZSwgTUFYX05PREVTX1BFUl9ST1csIE1BWF9OT0RFX0xBQkVMX0xFTkdUSCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ2V0RWxlbWVudERpbWVuc2lvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGg6ICRlbGVtZW50LmhlaWdodCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHc6ICRlbGVtZW50LndpZHRoKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRHcmFwaEhlaWdodEluUGl4ZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KCRzY29wZS5HUkFQSF9IRUlHSFQsIDMwMCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kcmF3R3JhcGggPSBmdW5jdGlvbiAobm9kZXMsIG9yaWdpbmFsTGlua3MsIGluaXRTdGF0ZUlkLCBmaW5hbFN0YXRlSWRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZmluYWxTdGF0ZUlkcyA9IGZpbmFsU3RhdGVJZHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSBhbmd1bGFyLmNvcHkob3JpZ2luYWxMaW5rcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZURhdGEgPSBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5jb21wdXRlTGF5b3V0KG5vZGVzLCBsaW5rcywgaW5pdFN0YXRlSWQsIGFuZ3VsYXIuY29weShmaW5hbFN0YXRlSWRzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuR1JBUEhfV0lEVEggPSBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5nZXRHcmFwaFdpZHRoKE1BWF9OT0RFU19QRVJfUk9XLCBNQVhfTk9ERV9MQUJFTF9MRU5HVEgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLkdSQVBIX0hFSUdIVCA9IFN0YXRlR3JhcGhMYXlvdXRTZXJ2aWNlLmdldEdyYXBoSGVpZ2h0KG5vZGVEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhID0gU3RhdGVHcmFwaExheW91dFNlcnZpY2UubW9kaWZ5UG9zaXRpb25WYWx1ZXMobm9kZURhdGEsICRzY29wZS5HUkFQSF9XSURUSCwgJHNjb3BlLkdSQVBIX0hFSUdIVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYXVnbWVudGVkTGlua3MgPSBTdGF0ZUdyYXBoTGF5b3V0U2VydmljZS5nZXRBdWdtZW50ZWRMaW5rcyhub2RlRGF0YSwgbGlua3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldE5vZGVUaXRsZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUubGFiZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldFRydW5jYXRlZExhYmVsID0gZnVuY3Rpb24gKG5vZGVMYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCd0cnVuY2F0ZScpKG5vZGVMYWJlbCwgTUFYX05PREVfTEFCRUxfTEVOR1RIKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGluZyBsaXN0IG9mIG5vZGVzIHRvIGRpc3BsYXkuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZUxpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5vZGVJZCBpbiBub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ub2RlTGlzdC5wdXNoKG5vZGVEYXRhW25vZGVJZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmdyYXBoRGF0YUxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRyYXdHcmFwaCgkc2NvcGUuZ3JhcGhEYXRhLm5vZGVzLCAkc2NvcGUuZ3JhcGhEYXRhLmxpbmtzLCAkc2NvcGUuZ3JhcGhEYXRhLmluaXRTdGF0ZUlkLCAkc2NvcGUuZ3JhcGhEYXRhLmZpbmFsU3RhdGVJZHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==