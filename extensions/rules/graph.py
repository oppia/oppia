# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Rules for Graph objects."""

__author__ = 'Zhan Xiong Chin'

from extensions.rules import base
import itertools

# Constructs adjacency lists from a Graph object
def construct_adjacency_lists(graph):
    adjacency_lists = [[] for v in graph['vertices']]
    for edge in graph['edges']:
        adjacency_lists[edge['src']].append(edge['dst'])
        if not graph['isDirected']:
            adjacency_lists[edge['dst']].append(edge['src'])
    return adjacency_lists

# Constructs adjacency matrices from a Graph object
def construct_adjacency_matrix(graph):
    adjacency_matrix = [[None for v in graph['vertices']] for v in graph['vertices']]
    for edge in graph['edges']:
        weight = edge['weight'] if graph['isWeighted'] else 1
        adjacency_matrix[edge['src']][edge['dst']] = weight
        if not graph['isDirected']:
            adjacency_matrix[edge['dst']][edge['src']] = weight
    return adjacency_matrix


# TODO(czx): Handle the directed case?
class IsConnected(base.GraphRule):
    description = 'is a connected graph'
    is_generic = False

    def _evaluate(self, subject):
        # Uses depth first search to ensure that we can visit all vertices in one pass
        if len(subject['vertices']) == 0:
            return True
        def search_component(current_vertex, adjacency_lists, is_visited):
            is_visited[current_vertex] = True
            for next_vertex in adjacency_lists[current_vertex]:
                if not is_visited[next_vertex]:
                    search_component(next_vertex, adjacency_lists, is_visited)
        
        is_visited = [False for v in subject['vertices']]
        adjacency_lists = construct_adjacency_lists(subject)
        search_component(0, adjacency_lists, is_visited)
        return not (False in is_visited)


class IsAcyclic(base.GraphRule):
    description = 'is an acyclic graph'
    is_generic = False

    def _evaluate(self, subject):
        NOT_VISITED = 0
        STILL_VISITING = 1
        IS_VISITED = 2
        # Uses depth first search to ensure that we never have an edge to an ancestor in the search tree
        def find_cycle(current_vertex, previous_vertex, adjacency_lists, is_visited):
            is_visited[current_vertex] = STILL_VISITING
            for next_vertex in adjacency_lists[current_vertex]:
                if next_vertex == previous_vertex and subject['isDirected'] == False:
                    continue
                if is_visited[next_vertex] == STILL_VISITING:
                    return False
                elif is_visited[next_vertex] == IS_VISITED:
                    continue
                else:
                    if not find_cycle(next_vertex, current_vertex, adjacency_lists, is_visited):
                        return False
            is_visited[current_vertex] = IS_VISITED
            return True

        is_visited = [NOT_VISITED for v in subject['vertices']]
        adjacency_lists = construct_adjacency_lists(subject)
        for start_vertex in xrange(len(subject['vertices'])):
            if not is_visited[start_vertex]:
                if not find_cycle(start_vertex, -1, adjacency_lists, is_visited):
                    return False
        return True


class IsRegular(base.GraphRule):
    description = 'is a regular graph'
    is_generic = False

    def _evaluate(self, subject):
        if len(subject['vertices']) == 0:
            return True
        # Checks that every vertex has outdegree and indegree equal to the first
        adjacency_lists = construct_adjacency_lists(subject)
        outdegree_counts = [len(l) for l in adjacency_lists]
        indegree_counts = [0 for l in adjacency_lists]
        for l in adjacency_lists:
            for destination_vertex in l:
                indegree_counts[destination_vertex] += 1
        return (
            all(indegree == indegree_counts[0] for indegree in indegree_counts) and 
            all(outdegree == outdegree_counts[0] for outdegree in outdegree_counts)
        )

