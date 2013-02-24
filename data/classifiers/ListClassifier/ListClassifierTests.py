import ListClassifier

assert ListClassifier.List([3, 'a']) == [3, 'a']
assert ListClassifier.List(3.0) is None

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
