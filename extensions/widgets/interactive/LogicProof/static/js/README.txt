The code is contained in the following files:
 - generatedParser.js: this is a parser automatically generated using PEG.js,
 that is responsible for parsing logical expressions.
 - shared.js: this contains code used by both the teacher and student parts of
 the website. The most important functions are parseLine() and
 assignTypesToExpression().
 - teacher.js: this contains various functions that will take strings from the
 teacher and use them to build the widget_customization_args for the widget in
 question. The four top-level functions are buildQuestion(),
 buildLineTemplateTable(), buildMistakeSection() and
 buildControlFunctionTable().
 - student.js: this has three top-level functions, buildInstance(), buildProof()
 and checkProof(). The first takes the data from the YAML file for this state
 (together with LOGIC_PROOF_DEFAULT_QUESTION_DATA) and builds a questionData
 object representing this instance of the widget. The second takes a string 
 written by the student and converts it into a Proof object (or reports an error
 the student has made) and the third checks the proof to see whether the student
 has made any mistakes.
  - conversion.js. Used to convert symbols into unicode logic symbols as users
 type.

 More information about the program flow, together with specifications for all the 
 objects used, can be found at [LINK].

 Useful unicode codes:
  - ∧ (and) \u2227
  - ∨ (or) \u2228
  - ∀ (for all) \u2200
  - ∃ (exists) \u2203
  - ∈ (membership) \u2208

  *** IMPORTANT ***
  After making any changes to the code in /static/js, run the tests in
  /static/js/tests and make sure they all pass. (To run them open each file 
  with 'Tests' in its name in a browser and check that 'passed' appears for
  each test.)
  *** IMPORTANT ***