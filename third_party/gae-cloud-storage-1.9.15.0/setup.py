"""Setup specs for packaging, distributing, and installing gcs lib."""

import distribute_setup
distribute_setup.use_setuptools()


import setuptools


setuptools.setup(
    name="GoogleAppEngineCloudStorageClient",
    version="1.9.15.0",
    packages=setuptools.find_packages(),
    author="Google App Engine",
    author_email="app-engine-pipeline-api@googlegroups.com",
    keywords="google app engine cloud storage",
    url="https://code.google.com/p/appengine-gcs-client/",
    license="Apache License 2.0",
    description=("This library is the preferred way of accessing Google "
                 "Cloud Storage from App Engine. It was designed to "
                 "replace the Files API. As a result it contains much "
                 "of the same functionality (streaming reads and writes but "
                 "not the complete set of GCS APIs). It also provides key "
                 "stability improvements and a better overall developer "
                 "experience."),
    exclude_package_data={"": ["README"]},
    zip_safe=True,
)
