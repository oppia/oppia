import MultipleChoiceClassifier

assert MultipleChoiceClassifier.NonnegativeInt('3') == 3
assert not MultipleChoiceClassifier.NonnegativeInt(-1)
assert not MultipleChoiceClassifier.NonnegativeInt('hello')

assert MultipleChoiceClassifier.equals(3, 3)
assert not MultipleChoiceClassifier.equals(2, 3)
