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

"""Tests for classification of Graph."""

__author__ = 'Zhan Xiong Chin'

from extensions.rules import graph
import test_utils
import random

def _emptyGraph():
    return {
        'vertices': [],
        'edges': [],
        'isDirected': False,
        'isWeighted': False,
        'isLabeled': False
    }

def _nullGraph(n):
    ret = _emptyGraph()
    for i in xrange(n):
        ret['vertices'].append({
            'label': '',
            'x': 0.0,
            'y': 0.0
        })
    return ret

def _cycleGraph(n):
    ret = _nullGraph(n)
    if n == 1:
        return ret
    for i in xrange(n):
        ret['edges'].append({
            'src': i,
            'dst': (i + 1) % n,
            'weight': 1
        })
    return ret

def _completeGraph(n):
    ret = _nullGraph(n)
    for i in xrange(n):
        for j in xrange(i,n):
            ret['edges'].append({
                'src': i,
                'dst': j,
                'weight': 1
            })
    return ret

class GraphRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on Graph objects."""
    
    def test_isisomorphic_rule(self):
        self.assertTrue(graph.IsIsomorphic(_emptyGraph()).eval(_emptyGraph()))
        self.assertTrue(graph.IsIsomorphic(_cycleGraph(5)).eval(_cycleGraph(5)))
        self.assertTrue(graph.IsIsomorphic(_cycleGraph(5)).eval({
            'vertices': [{'label': '', 'x': 1.0, 'y': 1.0} for i in xrange(5)],
            'edges': [{'src': i, 'dst': j, 'weight': 1} for i,j in [(0, 2), (2, 4), (4, 1), (1, 3), (3, 0)]],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }))
        self.assertFalse(graph.IsIsomorphic(_cycleGraph(5)).eval(_nullGraph(5)))
        self.assertFalse(graph.IsIsomorphic(_nullGraph(5)).eval(_cycleGraph(5)))
        self.assertFalse(graph.IsIsomorphic(_nullGraph(5)).eval(_nullGraph(6)))
        self.assertFalse(graph.IsIsomorphic(_completeGraph(5)).eval(_cycleGraph(5)))
        self.assertFalse(graph.IsIsomorphic(_cycleGraph(5)).eval(_completeGraph(5)))
