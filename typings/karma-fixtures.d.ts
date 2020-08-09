interface KNN {
  'occurrence': number;
  'K': number;
  'T': number;
  'top': number;
  'fingerprint_data': {
    [key: number]: {
      class: number;
      fingerprint: number[][]
    }
  };
  'token_to_id': {
    [key: string]: number;
  };
}

interface KernelParams {
  kernel: string;
  coef0: number;
  degree: number;
  gamma: number;
}

interface SVM {
  'classes': number[];
  'kernel_params': KernelParams;
  'intercept': number[];
  'n_support': number[];
  'probA': number[];
  'support_vectors': number[][];
  'probB': number[];
  'dual_coef': number[][];
}

interface ClassifierData {
  'KNN': KNN;
  'SVM': SVM;
  'cv_vocabulary': {
    [key: string]: number;
  };
}

type ClassifierAccuracyTest = {
  'answer_group_index': number;
  'answers': {
    code: string
  }[];
}[];

interface Hashes {
  '/hash_test.html': string;
  '/path_test/hash_test.html': string;
  '/hash_test.min.js': string;
  '/assets_test/hash_test.json': string;
  '/pages_test/hash_test.html': string;
  '/images/hash_test.png': string;
  '/videos/hash_test.mp4': string;
  '/interactions/interTest/static/interTest.png': string;
}

interface InplaceReplaceTest {
  RANDMON1: string;
  '312RANDOM': string;
  DEV_MODE: boolean;
  RAN213DOM: string;
}

interface TestCasesRTE {
  RTE_TYPE_TEXTANGULAR: {
    TEST_CASES: {
      'html_content': string;
      'expected_output': string;
      'case': string;
    }[];
  };
}

type TextClassifierResults = {
  'answer_group_index': number;
  'answers': string[];
}[];

interface TextInputClassifierData {
  'best_params': {
    kernel: string;
    C: number;
  };
  'best_score': number;
  'SVM': SVM;
  'cv_vocabulary': {
    [key: string]: number;
  };
}

interface RuleDescription {
  description: string;
}

interface RuleTemplates {
  AlgebraicExpressionInput: {
    MatchesExactlyWith: IRuleDescription;
    IsEquivalentTo: IRuleDescription;
  };
  CodeRepl: {
    CodeEquals: IRuleDescription;
    CodeContains: IRuleDescription;
    CodeDoesNotContain: IRuleDescription;
    OutputEquals: IRuleDescription;
    OutputContains: IRuleDescription;
    ResultsInError: IRuleDescription;
    ErrorContains: IRuleDescription;
  };
  Continue: {};
  DragAndDropSortInput: {
    IsEqualToOrdering: IRuleDescription;
    IsEqualToOrderingWithOneItemAtIncorrectPosition: IRuleDescription;
    HasElementXAtPositionY: IRuleDescription;
    HasElementXBeforeElementY: IRuleDescription;
  };
  EndExploration: {};
  FractionInput: {
    IsExactlyEqualTo: IRuleDescription;
    IsEquivalentTo: IRuleDescription;
    IsEquivalentToAndInSimplestForm: IRuleDescription;
    IsLessThan: IRuleDescription;
    IsGreaterThan: IRuleDescription;
    HasNumeratorEqualTo: IRuleDescription;
    HasDenominatorEqualTo: IRuleDescription;
    HasIntegerPartEqualTo: IRuleDescription;
    HasNoFractionalPart: IRuleDescription;
    HasFractionalPartExactlyEqualTo: IRuleDescription;
  };
  GraphInput: {
    IsIsomorphicTo: IRuleDescription;
  };
  ImageClickInput: {
    IsInRegion: IRuleDescription;
  };
  InteractiveMap: {
    Within: IRuleDescription;
    NotWithin: IRuleDescription;
  };
  ItemSelectionInput: {
    Equals: IRuleDescription;
    ContainsAtLeastOneOf: IRuleDescription;
    DoesNotContainAtLeastOneOf: IRuleDescription;
    IsProperSubsetOf: IRuleDescription;
  };
  LogicProof: {
    Correct: IRuleDescription;
    NotCorrect: IRuleDescription;
    NotCorrectByCategory: IRuleDescription;
  };
  MathEquationInput: {
    MatchesExactlyWith: IRuleDescription;
    IsEquivalentTo: IRuleDescription;
  };
  MathExpressionInput: {
    IsMathematicallyEquivalentTo: IRuleDescription;
  };
  MultipleChoiceInput: {
    Equals: IRuleDescription;
  };
  MusicNotesInput: {
    Equals: IRuleDescription;
    IsLongerThan: IRuleDescription;
    HasLengthInclusivelyBetween: IRuleDescription;
    IsEqualToExceptFor: IRuleDescription;
    IsTranspositionOf: IRuleDescription;
    IsTranspositionOfExceptFor: IRuleDescription;
  };
  NumberWithUnits: {
    IsEqualTo: IRuleDescription;
    IsEquivalentTo: IRuleDescription;
  };
  NumericExpressionInput: {
    MatchesExactlyWith: IRuleDescription;
    IsEquivalentTo: IRuleDescription;
    ContainsSomeOf: IRuleDescription;
    OmitsSomeOf: IRuleDescription;
  };
  NumericInput: {
    Equals: IRuleDescription;
    IsLessThan: IRuleDescription;
    IsGreaterThan: IRuleDescription;
    IsLessThanOrEqualTo: IRuleDescription;
    IsGreaterThanOrEqualTo: IRuleDescription;
    IsInclusivelyBetween: IRuleDescription;
    IsWithinTolerance: IRuleDescription;
  };
  PencilCodeEditor: {
    CodeEquals: IRuleDescription;
    CodeContains: IRuleDescription;
    CodeDoesNotContain: IRuleDescription;
    OutputEquals: IRuleDescription;
    OutputRoughlyEquals: IRuleDescription;
    ResultsInError: IRuleDescription;
    ErrorContains: IRuleDescription;
  };
  RatioExpressionInput: {
    Equals: IRuleDescription;
    HasNumberOfTermsEqualTo: IRuleDescription;
  };
  SetInput: {
    Equals: IRuleDescription;
    IsSubsetOf: IRuleDescription;
    IsSupersetOf: IRuleDescription;
    IsSupersetOf: IRuleDescription;
    HasElementsNotIn: IRuleDescription;
    OmitsElementsIn: IRuleDescription;
    IsDisjointFrom: IRuleDescription;
  };
  TextInput: {
    Equals: IRuleDescription;
    CaseSensitiveEquals: IRuleDescription;
    StartsWith: IRuleDescription;
    Contains: IRuleDescription;
    FuzzyEquals: IRuleDescription;
  }
}

interface KarmaFixtures {
  'extensions/interactions/rule_templates': RuleTemplates;
  'core/tests/data/code_classifier_data': ClassifierData;
  'core/tests/data/code_classifier_accuracy_test': IClassifierAccuracyTest;
  'core/tests/data/code_classifier_test_knn': IClassifierAccuracyTest;
  'core/tests/data/code_classifier_test_svm': IClassifierAccuracyTest;
  'core/tests/data/hashes': IHashes;
  'core/tests/data/inplace_replace_test': IInplaceReplaceTest;
  'core/tests/data/test_cases_for_rte': ITestCasesRTE;
  'core/tests/data/text_classifier_results': ITextClassifierResults;
  'core/tests/data/text_input_classifier_data': TextInputClassifierData;
  'core/tests/data/text_input_training_data': ITextClassifierResults;
}
