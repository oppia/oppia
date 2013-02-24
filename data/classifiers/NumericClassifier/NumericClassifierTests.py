import NumericClassifier

assert NumericClassifier.Number(3) == 3.0
assert NumericClassifier.Number(3.0) == 3.0
assert NumericClassifier.Number('3') == 3
assert NumericClassifier.Number('3.0') == 3.0
assert NumericClassifier.Number({'a': 3}) is None
assert NumericClassifier.Number([3]) is None
assert NumericClassifier.Number((3,)) is None

assert NumericClassifier.Real(3) == 3.0
assert NumericClassifier.Real(3.0) == 3.0
assert NumericClassifier.Real('3') == 3
assert NumericClassifier.Real('3.0') == 3.0
assert not NumericClassifier.Real({'a': 3})
assert not NumericClassifier.Real([3])
assert not NumericClassifier.Real((3,))

assert NumericClassifier.equals(3, 3)
assert NumericClassifier.equals(3.0, 3)
assert not NumericClassifier.equals(4, 3)

assert NumericClassifier.is_less_than(3, 4)
assert NumericClassifier.is_less_than(3.0, 4)
assert NumericClassifier.is_less_than(3.0, 4.0)
assert not NumericClassifier.is_less_than(3, 3)
assert not NumericClassifier.is_less_than(3.0, 3.0)
assert not NumericClassifier.is_less_than(4.0, 3.0)
assert not NumericClassifier.is_less_than(4, 3)

assert NumericClassifier.is_greater_than(4, 3)
assert NumericClassifier.is_greater_than(4, 3.0)
assert NumericClassifier.is_greater_than(4.0, 3.0)
assert not NumericClassifier.is_greater_than(3, 3)
assert not NumericClassifier.is_greater_than(3.0, 3.0)
assert not NumericClassifier.is_greater_than(3.0, 4.0)
assert not NumericClassifier.is_greater_than(3, 4)

assert NumericClassifier.is_less_than_or_equal_to(3, 4)
assert NumericClassifier.is_less_than_or_equal_to(3, 3)
assert not NumericClassifier.is_less_than_or_equal_to(4, 3)

assert NumericClassifier.is_greater_than_or_equal_to(4, 3)
assert NumericClassifier.is_greater_than_or_equal_to(3, 3)
assert not NumericClassifier.is_greater_than_or_equal_to(3, 4)

assert NumericClassifier.is_inclusively_between(2, 1, 3)
assert NumericClassifier.is_inclusively_between(1, 1, 3)
assert NumericClassifier.is_inclusively_between(3, 1, 3)
assert NumericClassifier.is_inclusively_between(1.0, 1, 3)
assert not NumericClassifier.is_inclusively_between(3.0, 1, 2.99)

assert NumericClassifier.is_within_tolerance(3, 3, 0.5)
assert NumericClassifier.is_within_tolerance(3.5, 3, 0.5)
assert not NumericClassifier.is_within_tolerance(3.51, 3, 0.5)
