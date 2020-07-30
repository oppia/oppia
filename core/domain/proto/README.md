This directory is populated with auto-generated protobuf files by prototool
upon starting Oppia server.
It contains various protobuf classes which are used to store trained
classifier model parameters, for example, TextClassifierFrozenModel stores
paramters of a trained TextClassifier model.
Since, different classifiers use different protobuf classes, whenever required,
such classes are referred simply as `FrozenModel` throughout the codebase.
Term `FrozenModel` could be used to refer to any of the protobuf implementation
used for storing trained classifier mdoel parameters.
