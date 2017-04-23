For contributing in this project, you need to create a pull request containing both your code and tests.

To create a proper patch I suggest:

```
$ npm install -g gulp testem
$ gulp
```

And in another terminal / tab:

```
$ testem -f config/testem.json
```

Then you can see if you have your new tests passing.

Please, don't include the files at `/dist`. They can sometimes conflict and it is better that I generate then by hand after merging your PR.
