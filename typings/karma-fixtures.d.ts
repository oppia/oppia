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
      html_content: string;
      expected_output: string;
      case: string;
    }[];
  };
}

interface RuleDescription {
  description: string;
}

interface RuleTemplates {
  AlgebraicExpressionInput: {
    MatchesExactlyWith: RuleDescription;
    MatchesUpToTrivialManipulations: RuleDescription;
    IsEquivalentTo: RuleDescription;
  };
  CodeRepl: {
    CodeEquals: RuleDescription;
    CodeContains: RuleDescription;
    CodeDoesNotContain: RuleDescription;
    OutputEquals: RuleDescription;
    OutputContains: RuleDescription;
    ResultsInError: RuleDescription;
    ErrorContains: RuleDescription;
  };
  Continue: {};
  DragAndDropSortInput: {
    IsEqualToOrdering: RuleDescription;
    IsEqualToOrderingWithOneItemAtIncorrectPosition: RuleDescription;
    HasElementXAtPositionY: RuleDescription;
    HasElementXBeforeElementY: RuleDescription;
  };
  EndExploration: {};
  FractionInput: {
    IsExactlyEqualTo: RuleDescription;
    IsEquivalentTo: RuleDescription;
    IsEquivalentToAndInSimplestForm: RuleDescription;
    IsLessThan: RuleDescription;
    IsGreaterThan: RuleDescription;
    HasNumeratorEqualTo: RuleDescription;
    HasDenominatorEqualTo: RuleDescription;
    HasIntegerPartEqualTo: RuleDescription;
    HasNoFractionalPart: RuleDescription;
    HasFractionalPartExactlyEqualTo: RuleDescription;
  };
  GraphInput: {
    IsIsomorphicTo: RuleDescription;
  };
  ImageClickInput: {
    IsInRegion: RuleDescription;
  };
  InteractiveMap: {
    Within: RuleDescription;
    NotWithin: RuleDescription;
  };
  ItemSelectionInput: {
    Equals: RuleDescription;
    ContainsAtLeastOneOf: RuleDescription;
    DoesNotContainAtLeastOneOf: RuleDescription;
    IsProperSubsetOf: RuleDescription;
  };
  MathEquationInput: {
    MatchesExactlyWith: RuleDescription;
    MatchesUpToTrivialManipulations: RuleDescription;
    IsEquivalentTo: RuleDescription;
  };
  MultipleChoiceInput: {
    Equals: RuleDescription;
  };
  MusicNotesInput: {
    Equals: RuleDescription;
    IsLongerThan: RuleDescription;
    HasLengthInclusivelyBetween: RuleDescription;
    IsEqualToExceptFor: RuleDescription;
    IsTranspositionOf: RuleDescription;
    IsTranspositionOfExceptFor: RuleDescription;
  };
  NumberWithUnits: {
    IsEqualTo: RuleDescription;
    IsEquivalentTo: RuleDescription;
  };
  NumericExpressionInput: {
    MatchesExactlyWith: RuleDescription;
    MatchesUpToTrivialManipulations: RuleDescription;
    IsEquivalentTo: RuleDescription;
  };
  NumericInput: {
    Equals: RuleDescription;
    IsLessThan: RuleDescription;
    IsGreaterThan: RuleDescription;
    IsLessThanOrEqualTo: RuleDescription;
    IsGreaterThanOrEqualTo: RuleDescription;
    IsInclusivelyBetween: RuleDescription;
    IsWithinTolerance: RuleDescription;
  };
  PencilCodeEditor: {
    CodeEquals: RuleDescription;
    CodeContains: RuleDescription;
    CodeDoesNotContain: RuleDescription;
    OutputEquals: RuleDescription;
    OutputRoughlyEquals: RuleDescription;
    ResultsInError: RuleDescription;
    ErrorContains: RuleDescription;
  };
  SetInput: {
    Equals: RuleDescription;
    IsSubsetOf: RuleDescription;
    IsSupersetOf: RuleDescription;
    HasElementsNotIn: RuleDescription;
    OmitsElementsIn: RuleDescription;
    IsDisjointFrom: RuleDescription;
  };
  TextInput: {
    Equals: RuleDescription;
    StartsWith: RuleDescription;
    Contains: RuleDescription;
    FuzzyEquals: RuleDescription;
  };
}

interface KarmaFixtures {
  'extensions/interactions/rule_templates': RuleTemplates;
  'core/tests/data/hashes': Hashes;
  'core/tests/data/inplace_replace_test': InplaceReplaceTest;
  'core/tests/data/test_cases_for_rte': TestCasesRTE;
}
