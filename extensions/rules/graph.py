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

def construct_adjacency_lists(graph):
    ret = [[] for v in graph['vertices']]
    for edge in graph['edges']:
        ret[edge['src']].append(edge['dst'])
        if not graph['isDirected']:
            ret[edge['dst']].append(edge['src'])
    return ret


# TODO(czx): Speed up the isomorphism checker?
class IsIsomorphicTo(base.GraphRule):
    description = 'is isomorphic to {{g|Graph}}, including matching labels'
    is_generic = False

    def _evaluate(self, subject):
        if len(subject['vertices']) != len(self.g['vertices']):
            return False

        # Construct adjacency matrices
        def construct_adjacency_matrix(graph):
            ret = [[None for v in graph['vertices']] for v in graph['vertices']]
            for edge in graph['edges']:
                weight = edge['weight'] if graph['isWeighted'] else 1
                ret[edge['src']][edge['dst']] = weight
                if not graph['isDirected']:
                    ret[edge['dst']][edge['src']] = weight
            return ret
        adj = construct_adjacency_matrix(subject)
        adj2 = construct_adjacency_matrix(self.g)

        # Check against every permutation of vertices. 
        # The new index of vertex i in self.g is perm[i].
        num_vertices = len(self.g['vertices'])
        for perm in itertools.permutations(range(num_vertices)):
            # Test matching labels
            if subject['isLabeled'] and any([
                    self.g['vertices'][i]['label'] !=
                    subject['vertices'][perm[i]]['label']
                    for i in xrange(num_vertices)]):
                continue

            # Test isomorphism
            found_isomorphism = True
            for i in xrange(num_vertices):
                for j in xrange(num_vertices):
                    if adj[perm[i]][perm[j]] != adj2[i][j]:
                        found_isomorphism = False
                        break
                if not found_isomorphism:
                    break
            if found_isomorphism:
                return True
        return False

# TODO(czx): Handle the directed case?
class IsConnected(base.GraphRule):
    description = 'is a connected graph'
    is_generic = False

    def _evaluate(self, subject):
        # Uses dfs to ensure that we can visit all vertices in one pass
        if len(subject['vertices']) == 0:
            return True
        def dfs(x, adj, visited):
            visited[x] = True
            for y in adj[x]:
                if not visited[y]:
                    dfs(y, adj, visited)
        
        visited = [False for v in subject['vertices']]
        adj = construct_adjacency_lists(subject)
        dfs(0, adj, visited)
        return not (False in visited)


class IsAcyclic(base.GraphRule):
    description = 'is an acyclic graph'
    is_generic = False

    def _evaluate(self, subject):
        # Uses dfs to ensure that we never have an edge to an ancestor in the dfs tree
        def dfs(x, p, adj, visited):
            visited[x] = 1
            for y in adj[x]:
                if y == p and subject['isDirected'] == False:
                    continue
                if visited[y] == 1:
                    return False
                elif visited[y] == 2:
                    continue
                else:
                    if not dfs(y, x, adj, visited):
                        return False
            visited[x] = 2
            return True

        visited = [0 for v in subject['vertices']]
        adj = construct_adjacency_lists(subject)
        for i in xrange(len(visited)):
            if not visited[i]:
                if not dfs(i, -1, adj, visited):
                    return False
        return True

# TODO(czx): Handle the directed case?
class IsRegular(base.GraphRule):
    description = 'is a regular graph'
    is_generic = False

    def _evaluate(self, subject):
        # Checks that every vertex has degree equal to the first
        adj = construct_adjacency_lists(subject)
        return any(len(l) != len(adj[0]) for l in adj)

