// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Contains predefined strings.
 */

var DEFAULT_VOCABULARY = {
  from: ['from'],
  and: ['and'],
  have: ['we have', 'we know', 'have'],
  hence: ['hence', 'so', 'thus', 'whence', 'therefore'],
  whichever: ['and whichever is true', 'and either way', 'and in either case'],
  arbitrary: ['was arbitrary', 'is arbitrary'],
  take: ['take'],
  satisfying: ['satisfying', 'such that'],
  // eslint-disable-next-line quote-props
  'if': ['if'],
  given: ['given'],
  contradiction: ['contradiction'],
  at: ['at']
};

var DEFAULT_LINE_TEMPLATE_STRINGS = [{
  name: 'and_eliminate_left',
  reader_view: 'From R\u2227S we have R',
  antecedents: 'R\u2227S',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'and_eliminate_right',
  reader_view: 'From R\u2227S we have S',
  antecedents: 'R\u2227S',
  results: 'S',
  variables: '',
  error: []
}, {
  name: 'and_introduce',
  reader_view: 'From R and S we have R\u2227S',
  antecedents: 'R, S',
  results: 'R\u2227S',
  variables: '',
  error: []
}, {
  name: 'and_introduce',
  reader_view: 'From S and R we have R\u2227S',
  antecedents: 'R, S',
  results: 'R\u2227S',
  variables: '',
  error: []
}, {
  name: 'iff_eliminate_right',
  reader_view: 'From R and R<=>S we have S',
  antecedents: 'R, R<=>S',
  results: 'S',
  variables: '',
  error: []
}, {
  name: 'iff_eliminate_right',
  reader_view: 'From R<=>S and R we have S',
  antecedents: 'R, R<=>S',
  results: 'S',
  variables: '',
  error: []
}, {
  name: 'iff_eliminate_left',
  reader_view: 'From S and R<=>S we have R',
  antecedents: 'S, R<=>S',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'iff_eliminate_left',
  reader_view: 'From R<=>S and S we have R',
  antecedents: 'S, R<=>S',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'iff_eliminate_cis',
  reader_view: 'From R<=>S we have R=>S',
  antecedents: 'R<=>S',
  results: 'R=>S',
  variables: '',
  error: []
}, {
  name: 'iff_eliminate_trans',
  reader_view: 'From R<=>S we have S=>R',
  antecedents: 'R<=>S',
  results: 'S=>R',
  variables: '',
  error: []
}, {
  name: 'iff_introduce',
  reader_view: 'From R=>S and S=>R we have R<=>S',
  antecedents: 'R=>S, S=>R',
  results: 'R<=>S',
  variables: '',
  error: []
}, {
  name: 'iff_introduce',
  reader_view: 'From S=>R and R=>S we have S<=>R',
  antecedents: 'R=>S, S=>R',
  results: 'R<=>S',
  variables: '',
  error: []
}, {
  name: 'assumption',
  reader_view: 'If R',
  antecedents: '',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'implies_eliminate',
  reader_view: 'From R and R=>S we have S',
  antecedents: 'R, R=>S',
  results: 'S',
  variables: '',
  error: []
}, {
  name: 'implies_eliminate',
  reader_view: 'From R=>S and R we have S',
  antecedents: 'R, R=>S',
  results: 'S',
  variables: '',
  error: []
}, {
  name: 'implies_introduce',
  reader_view: 'Hence R=>S',
  antecedents: '',
  results: 'R=>S',
  variables: '',
  error: []
}, {
  name: 'not_eliminate',
  reader_view: 'From R and ~R we have contradiction',
  antecedents: 'R, ~R',
  results: '',
  variables: '',
  error: []
}, {
  name: 'not_eliminate',
  reader_view: 'From ~R and R we have contradiction',
  antecedents: 'R, ~R',
  results: '',
  variables: '',
  error: []
}, {
  name: 'contradiction_eliminate',
  reader_view: 'From contradiction we have R',
  antecedents: '',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'not_introduce',
  reader_view: 'Hence ~R',
  antecedents: '',
  results: '~R',
  variables: '',
  error: []
}, {
  name: 'excluded_middle_1',
  reader_view: 'We know R\u2228~R',
  antecedents: '',
  results: 'R\u2228~R',
  variables: '',
  error: []
}, {
  name: 'excluded_middle_2',
  reader_view: 'We know ~R\u2228R',
  antecedents: '',
  results: '~R\u2228R',
  variables: '',
  error: []
}, {
  name: 'excluded_middle_3',
  reader_view: 'From ~~R we have R',
  antecedents: '~~R',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'or_eliminate',
  reader_view: 'We know R\u2228S and whichever is true we have T',
  antecedents: 'R\u2228S',
  results: 'T',
  variables: '',
  error: []
  // TODO(Jacob): Add back or_eliminate_false template
  // and associated logic mistakes from commit 2d9335019521
  // when speed issues are fixed.
}, {
  name: 'or_introduce_left',
  reader_view: 'From R we have R\u2228S',
  antecedents: 'R',
  results: 'R\u2228S',
  variables: '',
  error: []
}, {
  name: 'or_introduce_right',
  reader_view: 'From S we have R\u2228S',
  antecedents: 'S',
  results: 'R\u2228S',
  variables: '',
  error: []
}, {
  name: 'exists_eliminate',
  reader_view: 'Have \u2203x.p so take {{a|variable}} such that p[x->a]',
  antecedents: '\u2203x.p',
  results: 'p[x->a]',
  variables: 'a',
  error: []
}, {
  name: 'exists_introduce',
  reader_view: 'From p[x->a] at {{a|element}} we have \u2203x.p',
  antecedents: 'p[x->a]',
  results: '\u2203x.p',
  variables: 'a',
  error: []
}, {
  name: 'for_all_eliminate',
  reader_view: 'From \u2200x.p at {{a|element}} we have p[x->a]',
  antecedents: '\u2200x.p',
  results: 'p[x->a]',
  variables: 'a',
  error: []
}, {
  name: 'for_all_introduce',
  reader_view: '{{a|variable}} was arbitrary hence \u2200x.p',
  antecedents: '',
  results: '\u2200x.p',
  variables: 'a',
  error: []
}, {
  name: 'given',
  reader_view: 'Given {{a|element}}',
  antecedents: '',
  results: '',
  variables: 'a',
  error: []
}, {
  name: 'take',
  reader_view: 'Take {{a|element}}',
  antecedents: '',
  results: '',
  variables: 'a',
  error: []
}, {
  name: 'reminder',
  reader_view: 'From R we know R',
  antecedents: 'R',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'reminder',
  reader_view: 'We know R',
  antecedents: 'R',
  results: 'R',
  variables: '',
  error: []
}, {
  name: 'and_introduce_e1',
  reader_view: 'From R we have R\u2227S',
  antecedents: 'R',
  results: 'R\u2227S',
  variables: '',
  error: [
    'Should this be \'From {{R}} and {{S}} we have {{R\u2227S}}\'?',
    'To prove {{R\u2227S}} you need to have shown {{S}} as well.'
  ]
}, {
  name: 'and_introduce_e2',
  reader_view: 'From S we have R\u2227S',
  antecedents: 'R',
  results: 'R\u2227S',
  variables: '',
  error: [
    'Should this be \'From {{R}} and {{S}} we have {{R\u2227S}}\'?',
    '{{R\u2227S}} means that {{R}} and {{S}} are both true, so you also ' +
    'need to have shown {{S}}.'
  ]
}, {
  name: 'and_introduce_e3',
  reader_view: 'From R and T we have R\u2227S',
  antecedents: 'R, T',
  results: 'R\u2227S',
  variables: '',
  error: ['You have shown {{R\u2227T}}, not {{R\u2227S}}.']
}, {
  name: 'and_introduce_e4',
  reader_view: 'From T and S we have R\u2227S',
  antecedents: 'T, S',
  results: 'R\u2227S',
  variables: '',
  error: ['You have shown {{T\u2227S}}, not {{R\u2227S}}.']
}, {
  name: 'and_eliminate_e',
  reader_view: 'From R\u2227S we have T',
  antecedents: 'R\u2227S',
  results: 'T',
  variables: '',
  error: ['From {{R\u2227S}} you can conclude either {{R}} or {{S}}.']
}, {
  name: 'not_introduce_e',
  reader_view: 'Hence R',
  antecedents: '',
  results: 'R',
  variables: '',
  error: [
    'If you want to reach a contradiction from {{~R}} and so conclude {{R}} ' +
    'then you\'ll need to start from the law of the excluded middle \'We ' +
    'know {{R\u2228~R}}\.']
}];

var DEFAULT_LAYOUT_MISTAKE_STRINGS = [{
  name: 'first_line_indented',
  occurs: 'n=1 \u2227 indentation(n)>0',
  message: ['The first line of a proof should not be indented.']
}, {
  name: 'illegal_indent',
  occurs: 'indentation(n)>indentation(n-1) \u2227 ~is_scope_creator(n-1)',
  message: [
    'Indents should only occur after lines of the form \'If..\' or ' +
    '\'Given...\'.']
}, {
  name: 'double_indent',
  occurs: 'indentation(n)>indentation(n-1)+1 \u2227 is_scope_creator(n-1)',
  message: ['Only indent once after \'{{text(n-1)}}\'.']
}, {
  name: 'missing_indent_given',
  occurs: 'template(n-1)=\'given\' \u2227 indentation(n)<=indentation(n-1)',
  message: [
    'After \'{{text(n-1)}}\' the following lines in which you reason using ' +
    'the variable {{variable(n-1)}} should be indented. Then stop indenting ' +
    'once you reach a statement of the form \'\u2200x.....\' in which the ' +
    '{{variable(n-1)}} no longer occurs.']
}, {
  name: 'missing_indent_assumption',
  occurs: (
    'template(n-1)=\'assumption\' \u2227 indentation(n)<=indentation(n-1)'),
  message: [
    'After \'{{text(n-1)}}\' the following lines in which you reason under ' +
    'the assumption of {{result(n-1)}} should be indented. Once you have ' +
    'proved some statement p assuming {{result(n-1)}} then you can write an ' +
    'unindented line \'Hence {{result(n-1)}}=>p\'. Alternatively you can ' +
    'simply stop indenting if you no longer wish to use the assumption of ' +
    '{{result(n-1)}}.']
}, {
  name: 'missing_deindent_forall_0',
  occurs: (
    'template(n)=\'for_all_introduce\' \u2227 ' +
    '(indentation(n)=indentation(n-1) \u2227 indentation(n-1)=0)'),
  message: [
    'To prove {{result(n)}} you need to start by writing ' +
    '\'Given {{variable(n)}}\' and then start indenting your lines until ' +
    'you manage to prove {{entry(1,antecedents(n))}}. After this you can ' +
    'write this line (which should not be indented).']
}, {
  name: 'incorrect_deindent_forall',
  occurs: (
    'template(n) = \'for_all_introduce\' \u2227 ' +
    'template(scoper(n-1))!= \'given\''),
  message: [
    'We are still working under the assumption of {{result(scoper(n-1))}} ' +
    'and must stop doing so (for example by moving to a statement of the ' +
    'form {{result(scoper(n-1))}}=>p) before we can leave the scope of ' +
    '{{variable(n)}} and introduce a for-all quantifier.']
}, {
  name: 'missing_deindent_for_all_1',
  occurs: (
    'template(n)=\'for_all_introduce\' \u2227 ' +
    'indentation(n)=indentation(n-1) \u2227 indentation(n-1)=1'),
  message: [
    'This line should no longer being indented (because we are no longer ' +
    'within the scope of {{variable(n)}}).']
}, {
  name: 'missing_deindent_for_all_2',
  occurs: (
    'template(n)=\'for_all_introduce\' \u2227 ' +
    'indentation(n)=indentation(n-1) \u2227 indentation(n-1)>1'),
  message: [
    'This line should be indented one step less than the previous line ' +
    '(because it is no longer in the scope of {{variable(n)}}).']
}, {
  name: 'double_deindent_forall',
  occurs: (
    'template(n)=\'for_all_introduce\' \u2227 ' +
    'indentation(n)<indentation(n-1)-1'),
  message: [
    'We only reduce the level of indentation by one here; we are just ' +
    'leaving the scope of \'{{text(scoper(n-1))}}\'.']
}, {
  name: 'missing_deindent_implies_0',
  occurs: (
    'template(n)=\'implies_introduce\' \u2227 ' +
    '(indentation(n)=indentation(n-1) \u2227 indentation(n)=0)'),
  message: [
    'To prove {{result(n)}} you need to start by writing ' +
    '\'If {{element(\'R\',n)}}\', then give a chain of reasoning (which ' +
    'should be indented) that ends with {{element(\'S\',n)}}. After that ' +
    'you can put this line (which should not be indented).']
}, {
  name: 'missing_deindent_not_0',
  occurs: (
    'template(n)=\'not_introduce\' \u2227 ' +
    '(indentation(n)=indentation(n-1) \u2227 indentation(n)=0)'),
  message: [
    'To prove {{result(n)}} you need to start by writing ' +
    '\'If {{element(\'R\',n)}}\' and then give a chain of reasoning (on ' +
    'indented lines) that ends with a contradiction. After that you are ' +
    'allowed to write this line (unindented).']
}, {
  name: 'incorrect_deindent',
  occurs: (
    '(template(n)=\'implies_introduce\' \u2228 ' +
    'template(n)=\'not_introduce\') \u2227 ' +
    'template(scoper(n-1))!=\'assumption\''),
  message: [
    'You are still working withing the scope of \'{{text(scoper(n-1))}}\' ' +
    'and you need to stop doing so (typically be introducing a forall ' +
    'statement) before you can drop the assumption of {{element(\'R\',n)}}. ' +
    'Alternatively you could try changing the order of your \'Given...\' and ' +
    '\'If...\' lines.']
}, {
  name: 'missing_deindent_1',
  occurs: (
    '(template(n)=\'implies_introduce\' \u2228 ' +
    'template(n)=\'not_introduce\') \u2227 ' +
    'indentation(n)=indentation(n-1) \u2227 indentation(n-1)=1'),
  message: [
    'Stop indenting at this point, because the truth of this line does not ' +
    'rely on the assumption of {{element(\'R\',n)}}.']
}, {
  name: 'missing_deindent_2',
  occurs: (
    '(template(n)=\'implies_introduce\' \u2228 ' +
    'template(n)=\'not_introduce\') \u2227 ' +
    'indentation(n)=indentation(n-1) \u2227 indentation(n-1)>1'),
  message: [
    'When writing \'{{text(n)}}\' we reduce the level of indentation by ' +
    'one, to indicate that we are no longer making the assumption that ' +
    '{{element(\'R\',n)}}.']
}, {
  name: 'double_deindent_assumption',
  occurs: (
    '(template(n)=\'implies_introduce\' \u2228 ' +
    'template(n)=\'not_introduce\') \u2227 ' +
    'indentation(n)<indentation(n-1)-1 \u2227 ' +
    'template(scoper(scoper(n-1)))=\'assumption\''),
  message: [
    'You should only de-indent once here; we are dropping the assumption ' +
    'of {{result(scoper(n-1))}} but not that of ' +
    '{{result(scoper(scoper(n-1)))}}.']
}, {
  name: 'double_deindent_given',
  occurs: (
    '(template(n)=\'implies_introduce\' \u2228 ' +
    'template(n)=\'not_introduce\') \u2227 ' +
    'indentation(n)<indentation(n-1)-1 \u2227 ' +
    'template(scoper(scoper(n-1)))=\'given\''),
  message: [
    'Only deindent once here; we are dropping the assumption of ' +
    '{{result(scoper(n-1))}} but are still within the scope of ' +
    '\'{{text(scoper(scoper(n-1)))}}\'.']
}, {
  name: 'illegal_first_line',
  occurs: (
    'n=1 \u2227 (template(n)=\'for_all_introduce\' \u2228 ' +
    'template(n)=\'implies_introduce\' \u2228 template(n)=\'not_introduce\')'),
  message: ['You can\'t have this as the first line of your proof']
}];

var DEFAULT_VARIABLE_MISTAKE_STRINGS = [{
  name: 'unspecified_variable',
  occurs: (
    '~is_initializer(n) \u2227 \u2203x\u2208variables(n).~is_initialized(x,n)'),
  message: [
    'You haven\'t said where {{variable(n)}} comes from; if you want it to ' +
    'be arbitrary then add a preceding line saying \'Given ' +
    '{{variable(n)}}\'; alternatively you might want to take a particular ' +
    '{{variable(n)}} witnessing some existential formula.']
}, {
  name: 'inaccessible_variable',
  occurs: (
    '~is_initializer(n) \u2227 template(n)!= \'for_all_introduce\' \u2227 ' +
    '\u2203x\u2208variables(n).~is_accessible(x,n)'),
  message: [
    'The variable {{variable(n)}} was only specified within the scope of ' +
    '\'{{text(scoper2(initializer(variable(n),n)))}}\' in line ' +
    '{{scoper2(initializer(variable(n),n))}}, and so can only be used ' +
    'there. If you want it as an arbitrary variable again then write ' +
    '\'Given {{variable(n)}}\'.']
}, {
  name: 'incorrect_variable_forall',
  occurs: (
    'template(n)=\'for_all_introduce\' \u2227 ' +
    'variable(n)!=variable(scoper(n-1))'),
  message: [
    'We originally took {{variable(scoper(n-1))}} as our arbitrary variable ' +
    'so this, rather than {{variable(n)}}, needs to be the one that we ' +
    'quantify out over.']
}, {
  name: 'arbitrary_variable_clash',
  occurs: 'template(n)=\'given\' \u2227 is_accessible(variable(n),n)',
  message: [
    'The variable {{variable(n)}} is already in use; chose a new variable ' +
    'to work with instead.']
}, {
  name: 'variable_clash',
  occurs: (
    'template(n)=\'exists_eliminate\' \u2227 is_accessible(variable(n),n)'),
  message: [
    'You just know that there is some {{variable(n)}} such that ' +
    '{{result(n)}}; you can\'t assume that it is the {{variable(n)}} we ' +
    'were previously discussing. Try using an entirely new variable in ' +
    'place of {{variable(n)}}.']
}];

var DEFAULT_LOGIC_MISTAKE_STRINGS = [{
  name: 'missing_antecedent',
  occurs: '\u2203A\u2208antecedents(n).~is_proven(A,n)',
  message: [
    'This line uses {{min{A\u2208antecedents(n)|~is_proven(A,n)}}}, so you ' +
    'need to have an earlier line proving that ' +
    '{{min{A\u2208antecedents(n)|~is_proven(A,n)}}} is true.']
}, {
  name: 'inaccessible_antecedent',
  occurs: '\u2203A\u2208antecedents(n).~is_available(A,n)',
  message: [
    'You are using here that ' +
    '{{min{A\u2208antecedents(n)|~is_available(A,n)}}}, which was only ' +
    'proved within the context of ' +
    '\'{{text(scoper(prover(min{A\u2208antecedents(n)|~is_available(A,n)},' +
      'n)))}}\' ' +
    'and so is no longer available to you.']
}, {
  name: 'missing_false',
  occurs: 'needs_false(n) \u2227 ~\u2203k<n.yields_false(k)',
  message: [
    'This line assumes you have already proved a contradiction, which is ' +
    'not the case.']
}, {
  name: 'inaccessible_false',
  occurs: (
    'needs_false(n) \u2227 ~\u2203k<n.(yields_false(k) \u2227 ' +
    'is_in_scope(k, n))'),
  message: [
    'It is true that you proved a contradiction in line ' +
    '{{max{k<n|yields_false(k)}}} but this line is no longer available to you.']
}, {
  name: 'for_all_incorrect_conclusion',
  occurs: (
    'template(n)=\'for_all_introduce\' \u2227 ' +
    '~substitute(element(\'p\',n),element(\'x\',n), ' +
      'element(\'a\',n))\u2208results(n-1)'),
  message: [
    'To conclude this you need to have shown ' +
    '{{substitute(element(\'p\',n),element(\'x\',n),element(\'a\',n))}} ' +
    'on the immediately preceding line.']
}, {
  name: 'implies_incorrect_conclusion',
  occurs: (
    'template(n)=\'implies_introduce\' \u2227 ' +
    '~element(\'S\',n)\u2208results(n-1)'),
  message: [
    'To deduce \'{{result(n)}}\' you need to have proved ' +
    '{{element(\'S\',n)}} in the immediately preceding line (under the ' +
    'assumption of {{element(\'R\',n)}}).']
}, {
  name: 'implies_incorrect_assumption',
  occurs: (
    'template(n)=\'implies_introduce\' \u2227 ' +
    'element(\'R\',n)!=result(scoper(n-1))'),
  message: [
    'You started with the assumption of {{result(scoper(n-1))}} not ' +
    '{{element(\'R\',n)}}, so you must conclude \'Hence ' +
    '{{result(scoper(n-1))}}=>{{element(\'S\',n)}}\'.']
}, {
  name: 'not_incorrect_conclusion',
  occurs: 'template(n)=\'not_introduce\' \u2227 ~yields_false(n-1)',
  message: [
    'To prove the statement {{result(n)}} you need to start by assuming ' +
    '{{element(\'R\',n)}} is true and prove a contradiction. Then write ' +
    'this line immediately afterwards.']
}, {
  name: 'not_incorrect_assumption',
  occurs: (
    'template(n)=\'not_introduce\' \u2227 ' +
    'element(\'R\',n)!=result(scoper(n-1))'),
  message: [
    'We started with the assumption of {{result(scoper(n-1))}}, so what we ' +
    'have in fact shown is ~{{result(scoper(n-1))}}.']
}, {
  name: 'or_missing_antecedent_both',
  occurs: (
    'template(n)=\'or_eliminate\' \u2227 ' +
    '(~\u2203j<n.\u2203i<j.yields_implication(element(\'R\',n), ' +
      'element(\'T\',n) ,i,j)) \u2227 ' +
      '(~\u2203j<n.\u2203i<j.yields_implication(element(\'S\',n), ' +
      'element(\'T\',n) ,i,j))'),
  message: [
    'To conclude that {{element(\'T\',n)}} follows from ' +
    '{{entry(1,antecedents(n))}} you need to show that it follows if either ' +
    '{{element(\'R\',n)}} or {{element(\'S\',n)}} is true. Write ' +
    '\'If {{element(\'R\',n)}}\' and then give an (indented) series of lines ' +
    'that deduce {{element(\'T\',n)}} (or a contradiction) from ' +
    '{{element(\'R\',n)}}. Then separately write \'If {{element(\'S\',n)}}\' ' +
    'and prove {{element(\'T\',n)}} (or a contradiction) under this ' +
    'assumption.']
}, {
  name: 'or_missing_antecedent_left',
  occurs: (
    'template(n)=\'or_eliminate\' \u2227  ' +
    '~\u2203j<n.\u2203i<j.yields_implication(' +
      'element(\'R\',n), element(\'T\',n) ,i,j)'),
  message: [
    'You have proved that {{element(\'T\',n)}} follows if ' +
    '{{element(\'S\',n)}} holds; you need to also prove it follows if ' +
    '{{element(\'R\',n)}} holds.']
}, {
  name: 'or_missing_antecedent_right',
  occurs: (
    'template(n)=\'or_eliminate\' \u2227 ' +
    '~\u2203j<n.\u2203i<j.yields_implication(' +
      'element(\'S\',n), element(\'T\',n) ,i,j)'),
  message: [
    'You have proved that {{element(\'T\',n)}} follows if ' +
    '{{element(\'R\',n)}} holds; you need to also prove it follows if ' +
    '{{element(\'S\',n)}} holds.']
}, {
  name: 'or_inaccessible_antecedent_left',
  occurs: (
    'template(n)=\'or_eliminate\' \u2227 ' +
    '~is_available_implication(element(\'R\',n),element(\'T\',n),n)'),
  message: [
    'You proved that if {{element(\'R\',n)}} then {{element(\'T\',n)}}, ' +
    'but this was in the context of ' +
    '\'{{text(scoper(max{i<n|\u2203j<n.yields_implication(' +
      'element(\'R\',n),element(\'T\',n),i,j)}))}}\', which we have since ' +
    'left.']
}, {
  name: 'or_inaccessible_antecedent_right',
  occurs: (
    'template(n)=\'or_eliminate\' \u2227 ' +
    '~is_available_implication(element(\'S\',n),element(\'T\',n),n)'),
  message: [
    'You proved that if {{element(\'S\',n)}} then {{element(\'T\',n)}}, ' +
    'but this was in the context of ' +
    '\'{{text(scoper(max{i<n|\u2203j<n.yields_implication(' +
      'element(\'S\',n),element(\'T\',n),i,j)}))}}\', ' +
    'which we have since left.']
}];

var DEFAULT_TARGET_MISTAKE_STRINGS = [{
  name: 'last_line_indented_assumption',
  occurs: (
    'n=num_lines()\u2227indentation(n)>0 \u2227 template(scoper(n))!=\'given\''
  ),
  message: [
    'The last line of a proof should not be indented; you need to prove ' +
    'that the given formulas holds just from the original assumptions, not ' +
    'the additional assumption of {{result(scoper(n))}}.']
}, {
  name: 'last_line_indented_given',
  occurs: (
    'n=num_lines() \u2227 indentation(n)>0 \u2227 ' +
    'template(scoper(n))=\'given\''),
  message: [
    'The last line of a proof should not be indented; you should have ' +
    'ceased working within the scope of \'{{text(scoper(n))}}\' by this ' +
    'point, typically by introducing a forall statement.']
}, {
  name: 'last_line_not_target',
  occurs: 'n=num_lines() \u2227 ~target()\u2208results(n)',
  message: [
    'We are trying to prove {{target()}} so it should be given by the final ' +
    'line of the proof.']
}];

var DEFAULT_CONTROL_FUNCTION_STRINGS = [{
  LHS: 'variable(n)',
  RHS: 'entry(1, variables(n))',
  description: 'The free variable occurring in line n (if any)'
}, {
  LHS: 'result(n)',
  RHS: 'entry(1, results(n))',
  description: 'The result of line n (if any)'
}, {
  LHS: 'is_scope_creator(n)',
  RHS: 'template(n)=\'given\'\u2228template(n)=\'assumption\'',
  description: 'Whether the line after this one should be indented'
}, {
  LHS: 'scoper(n)',
  RHS: 'max{k<n|indentation(k)<indentation(n)}',
  description: 'The most recent line (not including n) in whose scope line n is'
}, {
  LHS: 'scoper2(n)',
  RHS: 'if(is_scope_creator(n),n,scoper(n))',
  description: 'The most recent line (including n) in whose scope line n is'
}, {
  LHS: 'is_in_scope(k, n)',
  RHS: (
    '(~is_scope_creator(k) \u2227 indentation(n)>=indentation(k) \u2227 ' +
    '~\u2203i<n.(i>k \u2227 indentation(i)<indentation(k))) \u2228 ' +
    '(indentation(n)>indentation(k) \u2227 ~\u2203i<=n.(i>k \u2227 ' +
    'indentation(i)<=indentation(k)))'),
  description: (
    'Whether the results and variables of line k<=n are accessible to line n')
}, {
  LHS: 'is_initializer(n)',
  RHS: (
    'template(n)=\'given\' \u2228 template(n)=\'for_all_eliminate\' \u2228 ' +
    'template(n)=\'exists_eliminate\' \u2228 template(n)=\'take\''),
  description: 'Whether line n initializes its variables'
}, {
  LHS: 'initializes(x,n)',
  RHS: 'is_initializer(n) \u2227 x\u2208variables(n)',
  description: 'Whether line n initializes variable x'
}, {
  LHS: 'is_initialized(x, n)',
  RHS: 'x\u2208question_variables() \u2228 \u2203k<n.initializes(x,k)',
  description: (
    'Whether variable x is initialized by line n (this does not mean it ' +
    'is legal to use, as it may be out of scope).')
}, {
  LHS: 'initializer(x, n)',
  RHS: 'max{k<n|initializes(x,k)}',
  description: 'The most recent line before n that initializes x'
}, {
  LHS: 'is_accessible(x, n)',
  RHS: (
    'x\u2208question_variables() \u2228 \u2203k<n.(initializes(x,k) \u2227 ' +
    'is_in_scope(k,n))'),
  description: 'Whether variable x is initialized and still available by line n'
}, {
  LHS: 'is_arbitrary(x, n)',
  RHS: 'template(initializer(x,n))=\'given\'',
  description: 'Whether variable x is arbitrary at line n'
}, {
  LHS: 'is_proven(R,n)',
  RHS: 'R\u2208assumptions() \u2228 \u2203k<n.R\u2208results(k)',
  description: (
    'Whether there is a line before n that proves R (again, it may still be ' +
    'out of scope and thus unusable).')
}, {
  LHS: 'prover(R,n)',
  RHS: 'max{k<n|R\u2208results(k)}',
  description: 'The most recent line before n that proves R.'
}, {
  LHS: 'is_available(R, n)',
  RHS: (
    'R\u2208assumptions()\u2228\u2203k<n.(is_in_scope(k,n)\u2227' +
    'R\u2208results(k))'),
  description: 'Whether R is available to use by line n'
}, {
  LHS: 'yields_false(n)',
  RHS: 'template(n)=\'not_eliminate\'\u2228template(n)=\'or_eliminate_false\'',
  description: 'Whether line n proves a contradiction'
}, {
  LHS: 'needs_false(n)',
  RHS: 'template(n)=\'contradiction_eliminate\'',
  description: 'Whether line n assumes a contradiction has been proved'
}, {
  LHS: 'yields_implication(R,S,m,n)',
  RHS: (
    'm<n \u2227 indentation(n)>0 \u2227 (S\u2208results(n) \u2228 ' +
    'yields_false(n)) \u2227 template(m)=\'assumption\' \u2227 ' +
    'R\u2208results(m) \u2227 indentation(n)=indentation(m)+1 \u2227 ' +
    '~\u2203i<n. (i>m \u2227 indentation(i)<=indentation(m))'),
  description: (
    'Whether line n is a proof of S under the assumption of R, made on line m')
}, {
  LHS: 'yields_implies_false(R,m,n)',
  RHS: (
    'm<n \u2227 indentation(n)>0 \u2227 (yields_false(n)) \u2227 ' +
    'template(m)=\'assumption\' \u2227 R\u2208results(m) \u2227 ' +
    'indentation(n)=indentation(m)+1 \u2227 ~\u2203i<n. (i>m \u2227 ' +
    'indentation(i)<=indentation(m))'),
  description: (
    'Whether line n is a proof of contradiction under the assumption of R, ' +
    'made on line m')
}, {
  LHS: 'is_available_implication(A,B,n)',
  RHS: (
    '\u2203j<n.\u2203i<j.(yields_implication(A,B,i,j) \u2227 ' +
    '(~\u2203k<n.(k>i \u2227 indentation(k)<indentation(i))) \u2227 ' +
    'indentation(i)<=indentation(n))'),
  description: (
    'Whether there is a proof of B under the assumption of A available at ' +
    'line n')
}, {
  LHS: 'is_available_implies_false(A,n)',
  RHS: (
    '\u2203j<n.\u2203i<j.(yields_implies_false(A,i,j) \u2227 ' +
    '(~\u2203k<n.(k>i \u2227 indentation(k)<indentation(i))) \u2227 ' +
    'indentation(i)<=indentation(n))'),
  description: (
    'Whether there is a proof of contradiction under the assumption of A ' +
    'available at line n')
}];
