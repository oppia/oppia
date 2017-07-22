from setuptools import (
    setup,
    find_packages,
)

setup(
    name="beautifulsoup4",
    version = "4.6.0",
    author="Leonard Richardson",
    author_email='leonardr@segfault.org',
    url="http://www.crummy.com/software/BeautifulSoup/bs4/",
    download_url = "http://www.crummy.com/software/BeautifulSoup/bs4/download/",
    description="Screen-scraping library",
    long_description="""Beautiful Soup sits atop an HTML or XML parser, providing Pythonic idioms for iterating, searching, and modifying the parse tree.""",
    license="MIT",
    packages=find_packages(exclude=['tests*']),
    extras_require = {
        'lxml' : [ 'lxml'],
        'html5lib' : ['html5lib'],
    },
    use_2to3 = True,
    classifiers=["Development Status :: 5 - Production/Stable",
                 "Intended Audience :: Developers",
                 "License :: OSI Approved :: MIT License",
                 "Programming Language :: Python",
                 "Programming Language :: Python :: 2.7",
                 'Programming Language :: Python :: 3',
                 "Topic :: Text Processing :: Markup :: HTML",
                 "Topic :: Text Processing :: Markup :: XML",
                 "Topic :: Text Processing :: Markup :: SGML",
                 "Topic :: Software Development :: Libraries :: Python Modules",
             ],
)
