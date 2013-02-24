# coding: utf-8
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

"""List classifier tests."""

__author__ = 'Sean Lip'


import ListClassifier

assert ListClassifier.equals([3, 'a'], [3, 'a'])
assert not ListClassifier.equals([3, 'a'], ['a', 3])
assert not ListClassifier.equals([3], ['a', 3])
assert not ListClassifier.equals(['a'], ['a', 3])

assert ListClassifier.does_not_equal([3], ['a', 3])[0]
assert ListClassifier.does_not_equal([3], ['a', 3])[1] == {
    'index': 0, 'len_diff': True, 'value': 3}
assert ListClassifier.does_not_equal([], [6])[0]
assert ListClassifier.does_not_equal([], [6])[1] == {
    'index': 0, 'len_diff': True, 'value': None}
assert ListClassifier.does_not_equal([3], [6])[0]
assert ListClassifier.does_not_equal([3], [6])[1] == {
    'index': 0, 'len_diff': False, 'value': 3}
assert not ListClassifier.does_not_equal([3], [3])[0]

assert ListClassifier.has_nonempty_common_prefix([3, 4], [3])
assert ListClassifier.has_nonempty_common_prefix([3, 4], [3, 4])
assert not ListClassifier.has_nonempty_common_prefix([2, 4], [3])
assert not ListClassifier.has_nonempty_common_prefix([2, 4], [])
assert not ListClassifier.has_nonempty_common_prefix([], [3])
