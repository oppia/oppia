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

from core.domain import rule_domain
from extensions.rules import base
import itertools


# TODO(czx): Speed up the isomorphism checker?
def _is_isomorphic(graph1, graph2):
    if len(graph1['vertices']) != len(graph2['vertices']):
        return rule_domain.CERTAIN_FALSE_VALUE

    # Construct adjacency matrices
    def construct_adjacency_matrix(graph):
        ret = [[None for v in graph['vertices']] for v in graph['vertices']]
        for edge in graph['edges']:
            weight = edge['weight'] if graph['isWeighted'] else 1
            ret[edge['src']][edge['dst']] = weight
            if not graph['isDirected']:
                ret[edge['dst']][edge['src']] = weight
        return ret
    adj = construct_adjacency_matrix(graph1)
    adj2 = construct_adjacency_matrix(graph2)

    # Check against every permutation of vertices. 
    # The new index of vertex i in graph2 is perm[i].
    num_vertices = len(graph2['vertices'])
    for perm in itertools.permutations(range(num_vertices)):
        # Test matching labels
        if graph1['isLabeled'] and any([
                graph2['vertices'][i]['label'] !=
                graph1['vertices'][perm[i]]['label']
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
            return rule_domain.CERTAIN_TRUE_VALUE
    return rule_domain.CERTAIN_FALSE_VALUE


class IsIsomorphicTo(base.GraphRule):
    description = 'is isomorphic to {{g|Graph}}, including matching labels'

    def _evaluate(self, subject):
        return _is_isomorphic(subject, self.g)


class FuzzyMatches(base.GraphRule):
    description = 'is similar to {{training_data|ListOfGraph}}'

    def _evaluate(self, subject):
        # This passes if the input graph is isomorphic to any of the graphs in
        # the training data.
        for possibility in self.training_data:
            if _is_isomorphic(subject, possibility):
                return self._fuzzify_truth_value(True)
        return self._fuzzify_truth_value(False)
