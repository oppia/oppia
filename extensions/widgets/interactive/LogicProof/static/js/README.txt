The code is contained in the following files:
 - generatedParser.js: this is a parser automatically generated using PEG.js, that is responsible for parsing logical expressions.
 - shared.js: this contains code used by both the teacher and student parts of the website. The most important functions are parseLine() and assignTypesToExpression().
 - teacher.js: this contains various functions that will take strings from the teacher and use them to build the widget_customization_args for the widget in question. The four top-level functions are buildQuestion(), buildLineTemplateTable(), buildMistakeSection() and buildControlFunctionTable().
 - student.js: this has two top-level functions, buildProof() and checkProof(). The first takes a string written by the student and converts it
 into a Proof object (or reports an error the student has made) and the second checks the proof to see whether the student has made any mistakes.

 More information about the program flow, together with specifications for all the objects used, can be found at [LINK].