import TextClassifier

assert TextClassifier.String('ABC') == 'abc'
assert TextClassifier.String('ABC DEF') == 'abcdef'
assert TextClassifier.String(3) == '3'

assert TextClassifier.equals('hello', 'hello')
assert not TextClassifier.equals('hello', 'goodbye')

assert TextClassifier.starts_with('hello', 'he')
assert not TextClassifier.starts_with('he', 'hello')

assert TextClassifier.contains('hello', 'he')
assert TextClassifier.contains('hello', 'll')
assert not TextClassifier.contains('hello', 'ol')
