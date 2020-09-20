This directory is populated with auto-generated protobuf files by prototool
upon starting Oppia server.

It contains various protobuf classes which are used to store trained
classifier model parameters. For example, TextClassifierFrozenModel stores
parameters of a trained TextClassifier model.

Since different classifiers use different protobuf classes, whenever required,
such classes are referred to simply as `FrozenModel` throughout the codebase. In
this codebase, the term `FrozenModel` is used to refer to any of the protobuf
implementations used for storing trained classifier model parameters.
