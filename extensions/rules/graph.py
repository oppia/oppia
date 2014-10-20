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

# TODO(czx): Speed up the isomorphism checker?
class IsIsomorphicTo(base.GraphRule):
    description = 'is isomorphic to {{g|Graph}}, including matching labels'
    is_generic = False

    def _evaluate(self, subject):
        if len(subject['vertices']) != len(self.g['vertices']):
            return False
        if len(subject['edges']) != len(self.g['edges']):
            return False

        # Construct adjacency matrix
        adj = [[None for v in subject['vertices']] for v in subject['vertices']]
        for edge in subject['edges']:
            weight = edge['weight'] if subject['isWeighted'] else 1
            adj[edge['src']][edge['dst']] = weight
            if not subject['isDirected']:
                adj[edge['dst']][edge['src']] = weight

        # Check against every permutation of vertices. 
        # The new index of vertex i in self.g is perm[i].
        num_vertices = len(self.g['vertices'])
        for perm in itertools.permutations(range(num_vertices)):
            # Test matching labels
            if subject['isLabeled'] and any([
                    self.g['vertices'][perm[i]]['label'] !=
                    subject['vertices'][i]['label']
                    for i in xrange(num_vertices)]):
                continue

            # Test isomorphism
            found_isomorphism = True
            for edge in self.g['edges']:
                weight = edge['weight'] if self.g['isWeighted'] else 1
                if adj[perm[edge['src']]][perm[edge['dst']]] != weight:
                    found_isomorphism = False
                    break
            if found_isomorphism:
                return True
        return False
