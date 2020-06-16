interface IKNN {
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

interface IKernelParams {
  kernel: string;
  coef0: number;
  degree: number;
  gamma: number;
}

interface ISVM {
  'classes': number[];
  'kernel_params': IKernelParams;
  'intercept': number[];
  'n_support': number[];
  'probA': number[];
  'support_vectors': number[][];
  'probB': number[];
  'dual_coef': number[][];
}

interface IClassifierData {
  'KNN': IKNN;
  'SVM': ISVM;
  'cv_vocabulary': {
    [key: string]: number;
  };
}

type IClassifierAccuracyTest = {
  'answer_group_index': number;
  'answers': {
    code: string
  }[];
}[];

interface IHashes {
  '/hash_test.html': string;
  '/path_test/hash_test.html': string;
  '/hash_test.min.js': string;
  '/assets_test/hash_test.json': string;
  '/pages_test/hash_test.html': string;
  '/images/hash_test.png': string;
  '/videos/hash_test.mp4': string;
  '/interactions/interTest/static/interTest.png': string;
}

interface IInplaceReplaceTest {
  RANDMON1: string;
  '312RANDOM': string;
  DEV_MODE: boolean;
  RAN213DOM: string;
}

interface ITestCasesRTE {
  RTE_TYPE_TEXTANGULAR: {
    TEST_CASES: {
      'html_content': string;
      'expected_output': string;
      'case': string;
    }[];
  };
}

type ITextClassifierResults = {
  'answer_group_index': number;
  'answers': string[];
}[];

interface ITextInputClassifierData {
  'best_params': {
    kernel: string;
    C: number;
  };
  'best_score': number;
  'SVM': ISVM;
  'cv_vocabulary': {
    [key: string]: number;
  };
}

interface IRuleDescription {
  description: string;
}

interface IRuleTemplates {
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
  'extensions/interactions/rule_templates': IRuleTemplates;
  'core/tests/data/code_classifier_data': IClassifierData;
  'core/tests/data/code_classifier_accuracy_test': IClassifierAccuracyTest;
  'core/tests/data/code_classifier_test_knn': IClassifierAccuracyTest;
  'core/tests/data/code_classifier_test_svm': IClassifierAccuracyTest;
  'core/tests/data/hashes': IHashes;
  'core/tests/data/inplace_replace_test': IInplaceReplaceTest;
  'core/tests/data/test_cases_for_rte': ITestCasesRTE;
  'core/tests/data/text_classifier_results': ITextClassifierResults;
  'core/tests/data/text_input_classifier_data': ITextInputClassifierData;
  'core/tests/data/text_input_training_data': ITextClassifierResults;
}
