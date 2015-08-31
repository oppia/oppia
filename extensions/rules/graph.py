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

GRAPH_ADJACENCY_MODE_DIRECTED = 'directed'
GRAPH_ADJACENCY_MODE_INVERTED = 'inverted'
GRAPH_ADJACENCY_MODE_UNDIRECTED = 'undirected'

def construct_adjacency_lists(graph, mode = GRAPH_ADJACENCY_MODE_DIRECTED):
    """Constructs adjacency lists from a Graph object and a string indicating the chosen mode.

    Depending on the mode chosen, it either:
    - Adds all edges to the lists (directed)
    - Inverts all edges and adds them to the lists (inverted)
    - Adds both edges from above two modes to the lists, as though 
    the graph were undirected (undirected)"""
    adjacency_lists = [[] for v in graph['vertices']]
    if not graph['isDirected']:
        # if a graph is undirected, all modes work the same way anyway
        mode = GRAPH_ADJACENCY_MODE_UNDIRECTED
    for edge in graph['edges']:
        if (mode == GRAPH_ADJACENCY_MODE_DIRECTED or 
            mode == GRAPH_ADJACENCY_MODE_UNDIRECTED):
            adjacency_lists[edge['src']].append(edge['dst'])
        if (mode == GRAPH_ADJACENCY_MODE_INVERTED or
            mode == GRAPH_ADJACENCY_MODE_UNDIRECTED):
            adjacency_lists[edge['dst']].append(edge['src'])
    return adjacency_lists

def construct_adjacency_matrix(graph):
    """Constructs adjacency matrices from a Graph object."""
    adjacency_matrix = [[None for v in graph['vertices']] for v in graph['vertices']]
    for edge in graph['edges']:
        weight = edge['weight'] if graph['isWeighted'] else 1
        adjacency_matrix[edge['src']][edge['dst']] = weight
        if not graph['isDirected']:
            adjacency_matrix[edge['dst']][edge['src']] = weight
    return adjacency_matrix

def mark_visited(start_vertex, adjacency_lists, is_visited):
    """Takes the index of the starting vertex, a list of adjacency lists, and a visited list
and marks the index of all vertices reachable from the starting vertex in the visited list."""
    is_visited[start_vertex] = True
    for next_vertex in adjacency_lists[start_vertex]:
        if not is_visited[next_vertex]:
            mark_visited(next_vertex, adjacency_lists, is_visited)

def is_strongly_connected(graph):
    """Takes a Graph object and returns whether it is strongly connected."""
    # Uses depth first search on each vertex to try and visit every other vertex from 0
    # in both the normal and inverted adjacency lists
    if len(graph['vertices']) == 0:
        return True
    adjacency_lists = construct_adjacency_lists(graph)
    inverted_adjacency_lists = construct_adjacency_lists(graph, GRAPH_ADJACENCY_MODE_INVERTED)
    is_visited = [False for v in graph['vertices']]
    mark_visited(0, adjacency_lists, is_visited)
    is_visited_in_inverse = [False for v in graph['vertices']]
    mark_visited(0, inverted_adjacency_lists, is_visited_in_inverse)
    return not ((False in is_visited) or (False in is_visited_in_inverse))

def is_weakly_connected(graph):
    """Takes a Graph object and returns whether it is weakly connected."""
    # Generates adjacency lists assuming graph is undirected, then uses depth first search 
    # on 0 to try and reach every other vertex
    if len(graph['vertices']) == 0:
        return True
    adjacency_lists = construct_adjacency_lists(graph, GRAPH_ADJACENCY_MODE_UNDIRECTED)
    is_visited = [False for v in graph['vertices']]
    mark_visited(0, adjacency_lists, is_visited)
    return not (False in is_visited)


def is_acyclic(graph):
    NOT_VISITED = 0
    STILL_VISITING = 1
    IS_VISITED = 2
    # Uses depth first search to ensure that we never have an edge to an ancestor in the search tree
    def find_cycle(current_vertex, previous_vertex, adjacency_lists, is_visited):
        is_visited[current_vertex] = STILL_VISITING
        for next_vertex in adjacency_lists[current_vertex]:
            if next_vertex == previous_vertex and graph['isDirected'] == False:
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

    is_visited = [NOT_VISITED for v in graph['vertices']]
    adjacency_lists = construct_adjacency_lists(graph)
    for start_vertex in xrange(len(graph['vertices'])):
        if not is_visited[start_vertex]:
            if not find_cycle(start_vertex, -1, adjacency_lists, is_visited):
                return False
    return True


def is_regular(graph):
    if len(graph['vertices']) == 0:
        return True
    # Checks that every vertex has outdegree and indegree equal to the first
    adjacency_lists = construct_adjacency_lists(graph)
    outdegree_counts = [len(l) for l in adjacency_lists]
    indegree_counts = [0 for l in adjacency_lists]
    for l in adjacency_lists:
        for destination_vertex in l:
            indegree_counts[destination_vertex] += 1
    return (
        all(indegree == indegree_counts[0] for indegree in indegree_counts) and 
        all(outdegree == outdegree_counts[0] for outdegree in outdegree_counts)
    )


class HasGraphProperty(base.GraphRule):
    description = 'is {{p|GraphProperty}}'
    is_generic = False

    def _evaluate(self, subject):
        if self.p == 'strongly_connected':
            return is_strongly_connected(subject)
        elif self.p == 'weakly_connected':
            return is_weakly_connected(subject)
        elif self.p == 'acyclic':
            return is_acyclic(subject)
        elif self.p == 'regular':
            return is_regular(subject)
        else:
            return False


class IsIsomorphicTo(base.GraphRule):
    description = 'is isomorphic to {{g|Graph}}, including matching labels'
    is_generic = False
    ISOMORPHISM_VERTEX_LIMIT = 15

    def _evaluate(self, subject):
        if len(subject['vertices']) != len(self.g['vertices']):
            return False
        if (len(subject['vertices']) > self.ISOMORPHISM_VERTEX_LIMIT or 
            len(self.g['vertices']) > self.ISOMORPHISM_VERTEX_LIMIT):
            return False

        adjacency_matrix_1 = construct_adjacency_matrix(subject)
        adjacency_matrix_2 = construct_adjacency_matrix(self.g)

        # Check against every permutation of vertices. 
        # The new index of vertex i in self.g is perm[i].
        num_vertices = len(self.g['vertices'])
        for perm in itertools.permutations(range(num_vertices)):
            # Test matching labels
            if (subject['isLabeled'] or self.g['isLabeled']) and any(
                    self.g['vertices'][i]['label'] !=
                    subject['vertices'][perm[i]]['label']
                    for i in xrange(num_vertices)):
                continue

            # Test isomorphism
            if all(adjacency_matrix_1[perm[i]][perm[j]] == adjacency_matrix_2[i][j] 
                    for i in xrange(num_vertices) 
                    for j in xrange(num_vertices)):
                return True
        return False
