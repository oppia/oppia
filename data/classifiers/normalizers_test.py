# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Normalizer tests."""

__author__ = 'Sean Lip'


import normalizers

assert normalizers.List([3, 'a']) == [3, 'a']
assert normalizers.List(3.0) is None

assert normalizers.Coord2D('-1, 2.2') == [-1, 2.2]
assert normalizers.Coord2D('123') is None
assert normalizers.Coord2D([0, 1]) == [0, 1]
assert normalizers.Coord2D([0, 1, 2]) is None

assert normalizers.NonnegativeInt('3') == 3
assert not normalizers.NonnegativeInt(-1)
assert not normalizers.NonnegativeInt('hello')

assert normalizers.Number(3) == 3.0
assert normalizers.Number(3.0) == 3.0
assert normalizers.Number('3') == 3
assert normalizers.Number('3.0') == 3.0
assert normalizers.Number({'a': 3}) is None
assert normalizers.Number([3]) is None
assert normalizers.Number((3,)) is None

assert normalizers.Real(3) == 3.0
assert normalizers.Real(3.0) == 3.0
assert normalizers.Real('3') == 3
assert normalizers.Real('3.0') == 3.0
assert not normalizers.Real({'a': 3})
assert not normalizers.Real([3])
assert not normalizers.Real((3,))

assert normalizers.String('ABc') == 'ABc'
assert normalizers.String('ABC   DEF') == 'ABC DEF'
assert normalizers.String(3) == '3'
