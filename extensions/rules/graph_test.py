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


    def test_isisomorphic_rule(self):
        self.assertFuzzyTrue(
            graph.IsIsomorphicTo(_emptyGraph()).eval(_emptyGraph()))
        self.assertFuzzyTrue(
            graph.IsIsomorphicTo(_cycleGraph(5)).eval(_cycleGraph(5)))
        self.assertFuzzyTrue(graph.IsIsomorphicTo(_cycleGraph(5)).eval({
            'vertices': [{'label': '', 'x': 1.0, 'y': 1.0} for i in xrange(5)],
            'edges': [
                {'src': i, 'dst': j, 'weight': 1} for i, j in
                [(0, 2), (2, 4), (4, 1), (1, 3), (3, 0)]
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }))
        self.assertFuzzyTrue(graph.IsIsomorphicTo({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': True
        }).eval({
            'vertices': [
                {'label': 'c', 'x': 1.0, 'y': 1.0},
                {'label': 'a', 'x': 2.0, 'y': 2.0},
                {'label': 'b', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 2, 'dst': 1, 'weight': 1},
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': True
        }))
        self.assertFuzzyTrue(graph.IsIsomorphicTo({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2},
                {'src': 1, 'dst': 2, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }).eval({
            'vertices': [
                {'label': 'b', 'x': 1.0, 'y': 1.0},
                {'label': 'a', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 2, 'dst': 0, 'weight': 1},
                {'src': 1, 'dst': 0, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }))
        self.assertFuzzyTrue(graph.IsIsomorphicTo({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0}, 
                {'label': '', 'x': 2.0, 'y': 2.0}, 
                {'label': '', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2}, 
                {'src': 1, 'dst': 2, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }).eval({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0}, 
                {'label': '', 'x': 2.0, 'y': 2.0}, 
                {'label': '', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 2, 'dst': 0, 'weight': 1}, 
                {'src': 1, 'dst': 0, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': False
        }))
        self.assertTrue(graph.IsIsomorphicTo({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0},
                {'label': '', 'x': 2.0, 'y': 2.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }).eval({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0},
                {'label': '', 'x': 2.0, 'y': 2.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 0, 'weight': 1}
            ],
            'isDirected': True,
            'isWeighted': False,
            'isLabeled': False
        }))
        self.assertFuzzyFalse(
            graph.IsIsomorphicTo(_cycleGraph(5)).eval(_nullGraph(5)))
        self.assertFuzzyFalse(
            graph.IsIsomorphicTo(_nullGraph(5)).eval(_cycleGraph(5)))
        self.assertFuzzyFalse(
            graph.IsIsomorphicTo(_nullGraph(5)).eval(_nullGraph(6)))
        self.assertFuzzyFalse(
            graph.IsIsomorphicTo(_completeGraph(5)).eval(_cycleGraph(5)))
        self.assertFuzzyFalse(
            graph.IsIsomorphicTo(_cycleGraph(5)).eval(_completeGraph(5)))
        self.assertFuzzyFalse(graph.IsIsomorphicTo({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 2, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }).eval({
            'vertices': [
                {'label': 'b', 'x': 1.0, 'y': 1.0},
                {'label': 'a', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 2, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }))
        self.assertFuzzyFalse(graph.IsIsomorphicTo({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0}, 
                {'label': 'a', 'x': 2.0, 'y': 2.0}, 
                {'label': '', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2}, 
                {'src': 1, 'dst': 2, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }).eval({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0}, 
                {'label': '', 'x': 2.0, 'y': 2.0}, 
                {'label': '', 'x': 3.0, 'y': 3.0}
            ],
            'edges': [
                {'src': 2, 'dst': 0, 'weight': 1}, 
                {'src': 1, 'dst': 0, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': False
        }))
        self.assertFalse(graph.IsIsomorphicTo({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0},
                {'label': '', 'x': 2.0, 'y': 2.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': False
        }).eval({
            'vertices': [
                {'label': '', 'x': 1.0, 'y': 1.0},
                {'label': '', 'x': 2.0, 'y': 2.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': False
        }))
        self.assertFuzzyFalse(graph.IsIsomorphicTo({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }).eval({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'c', 'x': 2.0, 'y': 2.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2}
            ],
            'isDirected': False,
            'isWeighted': True,
            'isLabeled': True
        }))
   
    def test_is_weakly_connected_rule(self):
        self.assertTrue(graph.HasGraphProperty('weakly_connected').eval(_emptyGraph()))
        self.assertTrue(graph.HasGraphProperty('weakly_connected').eval(_cycleGraph(5)))
        self.assertTrue(graph.HasGraphProperty('weakly_connected').eval(_completeGraph(10)))
        self.assertTrue(graph.HasGraphProperty('weakly_connected').eval({
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
        self.assertFalse(graph.HasGraphProperty('weakly_connected').eval(_nullGraph(2)))
        self.assertFalse(graph.HasGraphProperty('weakly_connected').eval({
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
    
    def test_is_strongly_connected_rule(self):
        self.assertTrue(graph.HasGraphProperty('strongly_connected').eval(_emptyGraph()))
        self.assertTrue(graph.HasGraphProperty('strongly_connected').eval(_cycleGraph(5)))
        self.assertTrue(graph.HasGraphProperty('strongly_connected').eval(_completeGraph(10)))
        self.assertTrue(graph.HasGraphProperty('strongly_connected').eval({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2},
                {'src': 1, 'dst': 2, 'weight': 1},
                {'src': 2, 'dst': 0, 'weight': 3},
            ],
            'isDirected': True,
            'isWeighted': True,
            'isLabeled': True
        }))
        self.assertFalse(graph.HasGraphProperty('strongly_connected').eval({
            'vertices': [
                {'label': 'a', 'x': 1.0, 'y': 1.0},
                {'label': 'b', 'x': 2.0, 'y': 2.0},
                {'label': 'c', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 2},
                {'src': 2, 'dst': 1, 'weight': 1}
            ],
            'isDirected': True,
            'isWeighted': True,
            'isLabeled': True
        }))
        self.assertFalse(graph.HasGraphProperty('strongly_connected').eval(_nullGraph(2)))
        self.assertFalse(graph.HasGraphProperty('strongly_connected').eval({
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
        self.assertTrue(graph.HasGraphProperty('acyclic').eval(_emptyGraph()))
        self.assertTrue(graph.HasGraphProperty('acyclic').eval(_completeGraph(2)))
        self.assertTrue(graph.HasGraphProperty('acyclic').eval({
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
        self.assertTrue(graph.HasGraphProperty('acyclic').eval({
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
        self.assertFalse(graph.HasGraphProperty('acyclic').eval(_cycleGraph(5)))
        self.assertFalse(graph.HasGraphProperty('acyclic').eval(_completeGraph(4)))
        self.assertFalse(graph.HasGraphProperty('acyclic').eval({
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
        self.assertTrue(graph.HasGraphProperty('regular').eval(_emptyGraph()))
        self.assertTrue(graph.HasGraphProperty('regular').eval(_nullGraph(9)))
        self.assertTrue(graph.HasGraphProperty('regular').eval(_completeGraph(8)))
        self.assertTrue(graph.HasGraphProperty('regular').eval(_cycleGraph(3)))
        self.assertTrue(graph.HasGraphProperty('regular').eval(_cycleGraph(4)))
        self.assertTrue(graph.HasGraphProperty('regular').eval({
            'vertices': [
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 2, 'weight': 1},
                {'src': 2, 'dst': 0, 'weight': 1}
            ],
            'isDirected': True,
            'isWeighted': False,
            'isLabeled': False
        }))
        self.assertFalse(graph.HasGraphProperty('regular').eval({
            'vertices': [
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0},
                {'label': '', 'x': 0.0, 'y': 0.0}
            ],
            'edges': [
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 1, 'dst': 2, 'weight': 1},
                {'src': 0, 'dst': 2, 'weight': 1}
            ],
            'isDirected': True,
            'isWeighted': False,
            'isLabeled': False
        }))
        self.assertFalse(graph.HasGraphProperty('regular').eval({
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

        self.assertFalse(graph.HasGraphProperty('regular').eval({
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

    def test_fuzzy_matches_rule(self):
        rule = graph.FuzzyMatches([{
                'vertices': [
                    {'label': '', 'x': 1.0, 'y': 1.0},
                    {'label': '', 'x': 2.0, 'y': 2.0},
                    {'label': '', 'x': 3.0, 'y': 3.0}
                ],
                'edges': [
                    {'src': 0, 'dst': 1, 'weight': 1},
                    {'src': 1, 'dst': 2, 'weight': 1},
                    {'src': 2, 'dst': 0, 'weight': 1},
                ],
                'isDirected': False,
                'isWeighted': False,
                'isLabeled': False
            }, {
                'vertices': [
                    {'label': '', 'x': 1.0, 'y': 1.0},
                    {'label': '', 'x': 2.0, 'y': 2.0},
                    {'label': '', 'x': 3.0, 'y': 3.0},
                    {'label': '', 'x': 4.0, 'y': 4.0}
                ],
                'edges': [
                    {'src': 0, 'dst': 1, 'weight': 1},
                    {'src': 1, 'dst': 2, 'weight': 1},
                    {'src': 2, 'dst': 3, 'weight': 1},
                    {'src': 3, 'dst': 0, 'weight': 1},
                ],
                'isDirected': False,
                'isWeighted': False,
                'isLabeled': False
            }
        ])

        # An isomorphic graph should match.
        self.assertFuzzyTrue(rule.eval({
            'vertices': [
                {'label': '', 'x': 4.0, 'y': 4.0},
                {'label': '', 'x': 5.0, 'y': 5.0},
                {'label': '', 'x': 6.0, 'y': 6.0}
            ],
            'edges': [
                {'src': 2, 'dst': 0, 'weight': 1},
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 2, 'dst': 1, 'weight': 1},
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }))

        # If this is isomorphic to another graph in the training data, it
        # should match.
        self.assertFuzzyTrue(rule.eval({
            'vertices': [
                {'label': '', 'x': 4.0, 'y': 4.0},
                {'label': '', 'x': 5.0, 'y': 5.0},
                {'label': '', 'x': 6.0, 'y': 6.0},
                {'label': '', 'x': 7.0, 'y': 7.0}
            ],
            'edges': [
                {'src': 3, 'dst': 0, 'weight': 1},
                {'src': 0, 'dst': 1, 'weight': 1},
                {'src': 2, 'dst': 1, 'weight': 1},
                {'src': 3, 'dst': 2, 'weight': 1}
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }))

        # A completely different graph should not match.
        self.assertFuzzyFalse(rule.eval({
            'vertices': [
                {'label': '', 'x': 4.0, 'y': 4.0},
                {'label': '', 'x': 5.0, 'y': 5.0},
            ],
            'edges': [
                {'src': 1, 'dst': 0, 'weight': 1},
            ],
            'isDirected': False,
            'isWeighted': False,
            'isLabeled': False
        }))

