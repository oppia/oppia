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
        for j in xrange(i+1,n):
            ret['edges'].append({
                'src': i,
                'dst': j,
                'weight': 1
            })
    return ret

class GraphRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on Graph objects."""
   
    def test_is_connected_rule(self):
        self.assertTrue(graph.IsConnected().eval(_emptyGraph()))
        self.assertTrue(graph.IsConnected().eval(_cycleGraph(5)))
        self.assertTrue(graph.IsConnected().eval(_completeGraph(10)))
        self.assertTrue(graph.IsConnected().eval({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2},
                {'src': 2, 'dst': 1, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }))
        self.assertFalse(graph.IsConnected().eval(_nullGraph(2)))
        self.assertFalse(graph.IsConnected().eval({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }))

    def test_is_acyclic_rule(self):
        self.assertTrue(graph.IsAcyclic().eval(_emptyGraph()))
        self.assertTrue(graph.IsAcyclic().eval(_completeGraph(2)))
        self.assertTrue(graph.IsAcyclic().eval({
            'vertices': [
                {'label': 'a', 'x': 0.0, 'y': 0.0},
                {'label': 'b', 'x': 0.0, 'y': 0.0},
                {'label': 'c', 'x': 0.0, 'y': 0.0},
                {'label': 'd', 'x': 0.0, 'y': 0.0},
            ],
            'edges': [
                {'src': 0, 'dst': 2, 'weight': 2},
                {'src': 2, 'dst': 3, 'weight': 4},
                {'src': 1, 'dst': 3, 'weight': 123}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }))
        self.assertTrue(graph.IsAcyclic().eval({
            'vertices': [
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 0, 'dst': 2, 'weight': 1},
                {'src': 1, 'dst': 2, 'weight': 1}
            ],
            'isDirected': True,
            'isWeighted': False,
            'isLabeled': False
        }))
        self.assertFalse(graph.IsAcyclic().eval(_cycleGraph(5)))
        self.assertFalse(graph.IsAcyclic().eval(_completeGraph(4)))
        self.assertFalse(graph.IsAcyclic().eval({
            'vertices': [
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 2, 'dst': 0, 'weight': 1},
                {'src': 1, 'dst': 2, 'weight': 1}
            ],
            'isDirected': True,
            'isWeighted': False,
            'isLabeled': False
        }))

    def test_is_regular_rule(self):
        self.assertTrue(graph.IsRegular().eval(_emptyGraph()))
        self.assertTrue(graph.IsRegular().eval(_nullGraph(9)))
        self.assertTrue(graph.IsRegular().eval(_completeGraph(8)))
        self.assertTrue(graph.IsRegular().eval(_cycleGraph(3)))
        self.assertTrue(graph.IsRegular().eval(_cycleGraph(4)))
        self.assertFalse(graph.IsRegular().eval({
            'vertices': [
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }))
        self.assertFalse(graph.IsRegular().eval({
            'vertices': [
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 2, 'dst': 1, 'weight': 1},
                {'src': 3, 'dst': 1, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }))


