/*global describe,it,expect,MessageFormat */
describe( "MessageFormat", function () {

  describe( "Public API", function () {

    it("should exist", function () {
      expect( MessageFormat ).to.be.a('function');
    });

    it("should have static plurals object", function () {
      expect( MessageFormat.plurals ).to.be.an( 'object' );
    });

    it("should be a constructor", function () {
      var mf = new MessageFormat( 'en' );
      expect( mf ).to.be.a( MessageFormat );
    });

    it("should have instance functions", function () {
      var mf = new MessageFormat( 'en' );
      expect( mf._precompile ).to.be.a( 'function' );
      expect( mf.compile ).to.be.a( 'function' );
    });

    it("should fallback when a base pluralFunc exists", function() {
      var mf = new MessageFormat('en-x-test1-test2');
      expect(mf.lc).to.contain( 'en' );
      expect(mf.runtime.pluralFuncs['en-x-test1-test2']).to.be.a('function');
    });
    it("should fallback when a base pluralFunc exists (underscores)", function() {
      var mf = new MessageFormat( 'en_x_test1_test2' );
      expect(mf.lc).to.contain( 'en' );
      expect(mf.runtime.pluralFuncs['en_x_test1_test2']).to.be.a('function');
    });

    it("should bail on non-existing locales", function () {
      expect(function(){ var a = new MessageFormat( 'lawlz' ); }).to.throwError();
    });

    it("should default to 'en' when no locale is passed into the constructor", function () {
      expect((new MessageFormat()).lc).to.contain( 'en' );
    });

  });

  describe( "Parsing", function () {

    describe( "Replacement", function () {

      it("should accept string only input", function () {
        expect( MessageFormat._parse( 'This is a string' ).statements[0].val ).to.be( 'This is a string' );
        expect( MessageFormat._parse( '☺☺☺☺' ).statements[0].val ).to.be( '☺☺☺☺' );
        expect( MessageFormat._parse( 'This is \n a string' ).statements[0].val ).to.be( 'This is \n a string' );
        expect( MessageFormat._parse( '中国话不用彁字。' ).statements[0].val ).to.be( '中国话不用彁字。' );
        expect( MessageFormat._parse( ' \t leading whitspace' ).statements[0].val ).to.be( ' \t leading whitspace' );
        expect( MessageFormat._parse( 'trailing whitespace   \n  ' ).statements[0].val ).to.be( 'trailing whitespace   \n  ' );
      });

      it("should allow you to escape { and } characters", function () {
        expect( MessageFormat._parse("\\{test").statements[0].val ).to.eql( '{test' );
        expect( MessageFormat._parse("test\\}").statements[0].val ).to.eql( 'test}' );
        expect( MessageFormat._parse("\\{test\\}").statements[0].val ).to.eql( '{test}' );
      });

      it("should gracefully handle quotes (since it ends up in a JS String)", function () {
        expect( MessageFormat._parse('This is a dbl quote: "').statements[0].val ).to.eql( 'This is a dbl quote: "' );
        expect( MessageFormat._parse("This is a single quote: '").statements[0].val ).to.eql( "This is a single quote: '" );
      });

      it("should accept only a variable", function () {
        expect( MessageFormat._parse('{test}') ).to.be.an( 'object' );
        expect( MessageFormat._parse('{0}') ).to.be.an( 'object' );
      });

      it("should not care about white space in a variable", function () {
        var targetStr = JSON.stringify( MessageFormat._parse('{test}') );
        expect( JSON.stringify( MessageFormat._parse('{test }') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{ test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{test  }') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{  test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{test}') ) ).to.eql( targetStr );
      });

      it("should maintain exact strings - not affected by variables", function () {
        expect( MessageFormat._parse('x{test}').statements[0].val ).to.be( 'x' );
        expect( MessageFormat._parse('\n{test}').statements[0].val ).to.be( '\n' );
        expect( MessageFormat._parse(' {test}').statements[0].val ).to.be( ' ' );
        expect( MessageFormat._parse('x { test}').statements[0].val ).to.be( 'x ' );
        expect( MessageFormat._parse('x{test} x ').statements[2].val ).to.be( ' x ' );
        expect( MessageFormat._parse('x\n{test}\n').statements[0].val ).to.be( 'x\n' );
        expect( MessageFormat._parse('x\n{test}\n').statements[2].val ).to.be( '\n' );
      });

      it("should handle extended character literals", function () {
        expect( MessageFormat._parse('☺{test}').statements[0].val ).to.be( '☺' );
        expect( MessageFormat._parse('中{test}中国话不用彁字。').statements[2].val ).to.be( '中国话不用彁字。' );
      });

      it("shouldn't matter if it has html or something in it", function () {
        expect( MessageFormat._parse('<div class="test">content: {TEST}</div>').statements[0].val ).to.be( '<div class="test">content: ' );
        expect( MessageFormat._parse('<div class="test">content: {TEST}</div>').statements[1].argumentIndex ).to.be( 'TEST' );
        expect( MessageFormat._parse('<div class="test">content: {TEST}</div>').statements[2].val ).to.be( '</div>' );
      });

      it("should allow you to use extension keywords for plural formats everywhere except where they go", function () {
        expect( MessageFormat._parse('select select, ').statements[0].val ).to.eql( 'select select, ' );
        expect( MessageFormat._parse('select offset, offset:1 ').statements[0].val ).to.eql( 'select offset, offset:1 ' );
        expect( MessageFormat._parse('one other, =1 ').statements[0].val ).to.eql( 'one other, =1 ' );
        expect( MessageFormat._parse('one {select} ').statements[1].argumentIndex ).to.eql( 'select' );
        expect( MessageFormat._parse('one {plural} ').statements[1].argumentIndex ).to.eql( 'plural' );
      });
    });

    describe( "Selects", function () {

      it("should accept a select statement based on a variable", function () {
        expect(function(){ MessageFormat._parse('{VAR, select, key{a} other{b}}'); }).to.not.throwError();
      });

      it("should be very whitespace agnostic", function (){
        var firstRes = JSON.stringify(MessageFormat._parse('{VAR, select, key{a} other{b}}'));
        expect( JSON.stringify(MessageFormat._parse('{VAR,select,key{a}other{b}}')) ).to.eql( firstRes );
        expect( JSON.stringify(MessageFormat._parse('{    VAR   ,    select   ,    key      {a}   other    {b}    }')) ).to.eql( firstRes );
        expect( JSON.stringify(MessageFormat._parse('{ \n   VAR  \n , \n   select  \n\n , \n \n  key \n    \n {a}  \n other \n   {b} \n  \n }')) ).to.eql( firstRes );
        expect( JSON.stringify(MessageFormat._parse('{ \t  VAR  \n , \n\t\r  select  \n\t , \t \n  key \n    \t {a}  \n other \t   {b} \t  \t }')) ).to.eql( firstRes );
      });

      it("should allow you to use MessageFormat extension keywords other places, including in select keys", function () {
        // use `select` as a select key
        expect(MessageFormat._parse('x {TEST, select, select{a} other{b} }')
          .statements[1].elementFormat.val.pluralForms[0].key
        ).to.eql( 'select' );
        // use `offset` as a key (since it goes here in a `plural` case)
        expect(MessageFormat._parse('x {TEST, select, offset{a} other{b} }')
          .statements[1].elementFormat.val.pluralForms[0].key
        ).to.eql( 'offset' );
        // use the exact variable name as a key name
        expect(MessageFormat._parse('x {TEST, select, TEST{a} other{b} }')
          .statements[1].elementFormat.val.pluralForms[0].key
        ).to.eql( 'TEST' );
      });

      it("should be case-sensitive (select keyword is lowercase, everything else doesn't matter)", function () {
        expect(function(){ var a = MessageFormat._parse('{TEST, Select, a{a} other{b}}'); }).to.throwError();
        expect(function(){ var a = MessageFormat._parse('{TEST, SELECT, a{a} other{b}}'); }).to.throwError();
        expect(function(){ var a = MessageFormat._parse('{TEST, selecT, a{a} other{b}}'); }).to.throwError();
      });

      it("should not accept keys with `=` prefixes", function () {
        expect(function(){ var a = MessageFormat._parse('{TEST, select, =0{a} other{b}}'); }).to.throwError();
      });

    });

    describe( "Plurals", function () {

      it("should accept a variable, no offset, and plural keys", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM, plural, one{1} other{2}}'); }).to.not.throwError();
      });

      it("should accept exact values with `=` prefixes", function () {
        expect(
          MessageFormat._parse('{NUM, plural, =0{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 0 );
        expect(
          MessageFormat._parse('{NUM, plural, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 1 );
        expect(
          MessageFormat._parse('{NUM, plural, =2{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 2 );
        expect(
          MessageFormat._parse('{NUM, plural, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( "other" );
      });

      it("should accept the 6 official keywords", function () {
        // 'zero', 'one', 'two', 'few', 'many' and 'other'
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural,   zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural,zero    {0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural,  \nzero\n   {0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( 'one' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[2].key
        ).to.eql( 'two' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[3].key
        ).to.eql( 'few' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[4].key
        ).to.eql( 'many' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[5].key
        ).to.eql( 'other' );
      });

      it("should be gracious with whitespace", function () {
        var firstRes = JSON.stringify( MessageFormat._parse('{NUM, plural, one{1} other{2}}') );
        expect(JSON.stringify( MessageFormat._parse('{ NUM, plural, one{1} other{2} }') )).to.eql( firstRes );
        expect(JSON.stringify( MessageFormat._parse('{NUM,plural,one{1}other{2}}') )).to.eql( firstRes );
        expect(JSON.stringify( MessageFormat._parse('{\nNUM,   \nplural,\n   one\n\n{1}\n other {2}\n\n\n}') )).to.eql( firstRes );
        expect(JSON.stringify( MessageFormat._parse('{\tNUM\t,\t\t\r plural\t\n, \tone\n{1}    other\t\n{2}\n\n\n}') )).to.eql( firstRes );
      });

      it("should take an offset", function () {
        expect( MessageFormat._parse('{NUM, plural, offset:4 other{a}}') ).to.be.ok();
        expect( MessageFormat._parse('{NUM, plural, offset : 4 other{a}}') ).to.be.ok();
        expect( MessageFormat._parse('{NUM, plural, offset\n\t\r : \t\n\r4 other{a}}') ).to.be.ok();
        // technically this is parsable since js identifiers don't start with numbers
        expect( MessageFormat._parse('{NUM,plural,offset:4other{a}}') ).to.be.ok();

        expect(
          MessageFormat._parse('{NUM, plural, offset:4 other{a}}').statements[0].elementFormat.val.offset
        ).to.eql( 4 );
        expect(
          MessageFormat._parse('{NUM,plural,offset:4other{a}}').statements[0].elementFormat.val.offset
        ).to.eql( 4 );

      });

    });

    describe( "Ordinals", function () {

      it("should accept a variable and ordinal keys", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM, selectordinal, one{1} other{2}}'); }).to.not.throwError();
      });

      it("should accept exact values with `=` prefixes", function () {
        expect(
          MessageFormat._parse('{NUM, selectordinal, =0{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 0 );
        expect(
          MessageFormat._parse('{NUM, selectordinal, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 1 );
        expect(
          MessageFormat._parse('{NUM, selectordinal, =2{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 2 );
        expect(
          MessageFormat._parse('{NUM, selectordinal, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( "other" );
      });

    });

    describe( "Nested/Recursive blocks", function () {

      it("should allow a select statement inside of a select statement", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{a}}}}'); }).to.not.throwError();
        expect(
          MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{a}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql( 'a' );

        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(
          MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql( 'b' );

        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(
          MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql( 'c' );
      });

      it("should allow nested plural statements - with and without offsets", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        // ok we get it, it's recursive.

        expect(
          MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql('c');
      });

      it("should allow nested plural and select statements - with and without offsets", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, select, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        // ok we get it, it's recursive.

        expect(
          MessageFormat._parse('{NUM1, selectordinal, other{{NUM2, plural, offset:1 other{{NUM3, selectordinal, other{{NUM4, plural, offset:1 other{c}}}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql('c');
      });

    });

    describe( "Errors", function () {

      it("should catch mismatched/invalid bracket situations", function () {
        expect(function(){ MessageFormat._parse('}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{{X}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{}{'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{X}{'); }).to.throwError();
        expect(function(){ MessageFormat._parse('}{}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('}{X}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{}}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{X}}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{{X}}'); }).to.throwError();
        expect(function(){ MessageFormat._parse(); }).to.throwError();
        // Technically an empty string is valid.
        expect(function(){ MessageFormat._parse(''); }).to.not.throwError();
      });

      it("should not allow an offset for SELECTs", function () {
        expect(function(){ MessageFormat._parse('{NUM, select, offset:1 test { 1 } test2 { 2 }}'); }).to.throwError();
      });

      it("should allow an offset for SELECTORDINALs", function () {
        expect(function(){ MessageFormat._parse('{NUM, selectordinal, offset:1 test { 1 } test2 { 2 }}'); }).to.not.throwError();
      });

      it("shouldn't allow characters in variables that aren't valid JavaScript identifiers", function () {
        expect(function(){ MessageFormat._parse('{☺}'); }).to.throwError();
      });

      it("should allow positional variables", function () {
        expect(function(){ MessageFormat._parse('{0}'); }).to.not.throwError();
      });

      it("should throw errors on negative offsets", function () {
        expect(function(){ MessageFormat._parse('{NUM, plural, offset:-4 other{a}}'); }).to.throwError();
      });

    });
  });

  describe( "Message Formatting", function () {

    describe( "Basic API", function () {
      it("has a compile function", function () {
        var mf = new MessageFormat( 'en' );
        expect(mf.compile).to.be.a('function');
      });

      it("compiles to a function", function () {
        var mf = new MessageFormat( 'en' );
        expect(mf.compile("test")).to.be.a('function');
      });

      it("can output a non-formatted string", function () {
        var mf = new MessageFormat( 'en' );

        expect((mf.compile("This is a string."))()).to.eql("This is a string.");
      });

      it("gets non-ascii character all the way through.", function () {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile('中{test}中国话不用彁字。'))({test:"☺"})).to.eql( "中☺中国话不用彁字。" );
      });

      it("escapes double quotes", function() {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile('She said "Hello"'))()).to.eql('She said "Hello"');
      });

      it("escapes backslashes (regression test for #99)", function() {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile('\\u005c'))()).to.eql('\\');
      });

      it("accepts escaped special characters", function() {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile('\\{'))()).to.eql('{');
        expect((mf.compile('\\}'))()).to.eql('}');
        expect((mf.compile('\\#'))()).to.eql('#');
        expect((mf.compile('\\\\'))()).to.eql('\\');
        expect((mf.compile('\\u263A\\u263B'))()).to.eql('☺☻');
      });

      it("should get escaped brackets all the way out the other end", function () {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile('\\{\\{\\{'))()).to.eql( "{{{" );
        expect((mf.compile('\\}\\}\\}'))()).to.eql( "}}}" );
        expect((mf.compile('\\{\\{\\{{test}\\}\\}\\}'))({test:4})).to.eql( "{{{4}}}" );
        expect((mf.compile('\\{\\{\\{{test, select, other{#}}\\}\\}\\}'))({test:4})).to.eql( "{{{4}}}" );
        expect((mf.compile('\\{\\{\\{{test, plural, other{#}}\\}\\}\\}'))({test:4})).to.eql( "{{{4}}}" );
        expect((mf.compile('\\{\\{\\{{test, plural, offset:1 other{#}}\\}\\}\\}'))({test:4})).to.eql( "{{{3}}}" );
      });

      it("can substitute named variables", function () {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile("The var is {VAR}."))({"VAR":5})).to.eql("The var is 5.");
      });

      it("can substitute positional variables", function () {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile("The var is {0}."))({"0":5})).to.eql("The var is 5.");
        expect((mf.compile("The var is {0}."))([5])).to.eql("The var is 5.");
        expect((mf.compile("The vars are {0} and {1}."))([5,-3])).to.eql("The vars are 5 and -3.");
        expect((mf.compile("The vars are {0} and {01}."))([5,-3])).to.eql("The vars are 5 and undefined.");
      });

      it("can substitute shorthand variables", function () {
        var mf = new MessageFormat( 'en' );
        expect((mf.compile("{VAR, select, other{The var is #.}}"))({"VAR":5})).to.eql("The var is 5.");
        expect((mf.compile("{0, select, other{The var is #.}}"))([5])).to.eql("The var is 5.");
      });

      it("allows escaped shorthand variable: #", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile('{X, select, other{# is a \\#}}');
        expect(mfunc({X:3})).to.eql("3 is a #");
      });

      it("should not substitute octothorpes that are outside of curly braces", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile('This is an octothorpe: #');
        expect(mfunc({X:3})).to.eql("This is an octothorpe: #");
      });

      it("obeys plural functions", function () {
        var mf = new MessageFormat( 'fake', function ( x ) {
          return 'few';
        });
        expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:0})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:1})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:2})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:3})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({})).to.be( "res: wasfew" );
      });

      it("obeys selectordinal functions", function () {
        var mf = new MessageFormat( 'fake', function ( x, ord ) {
          return ord ? 'few' : 'other';
        });
        expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:0})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:1})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:2})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:3})).to.be( "res: wasfew" );
        expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({})).to.be( "res: wasfew" );
      });

      it("throws an error when no `other` option is found - plurals", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ var x = mf.compile("{X, plural, someoption{a}}"); }).to.throwError();
      });

      it("throws an error when no `other` option is found - selects", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ var x = mf.compile("{X, select, someoption{a}}"); }).to.throwError();
      });

      it("throws an error when no `other` option is found - selectordinals", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ var x = mf.compile("{X, selectordinal, someoption{a}}"); }).to.throwError();
      });

      it("only calculates the offset from non-literals", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("{NUM, plural, offset:1 =0{a} one{b} other{c}}");
        expect(mfunc({NUM:0})).to.eql('a');
        expect(mfunc({NUM:1})).to.eql('c');
        expect(mfunc({NUM:2})).to.eql('b');
      });

      it("should obey `i=0 and v=0` rules", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("{NUM, plural, one{a} other{b}}");
        expect(mfunc({NUM:'1'})).to.eql('a');
        expect(mfunc({NUM:'1.0'})).to.eql('b');
      });

      it("should give priority to literals", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("{NUM, plural, =34{a} one{b} other{c}}");
        expect(mfunc({NUM:34})).to.eql('a');
      });

      it("should use the locale plural function", function() {
        var mf = new MessageFormat( 'cy' );
        var mfunc = mf.compile("{num, plural, zero{0} one{1} two{2} few{3} many{6} other{+}}");
        expect(mfunc.toString()).to.match(/\bcy\b/);
        expect(mfunc({num: 5})).to.be("+");
      });

      it("should use the locale selectordinal function", function() {
        var mf = new MessageFormat( 'cy' );
        var mfunc = mf.compile("{num, selectordinal, zero{0,7,8,9} one{1} two{2} few{3,4} many{5,6} other{+}}");
        expect(mfunc.toString()).to.match(/\bcy\b/);
        expect(mfunc({num: 5})).to.be("5,6");
      });

      it("should use the fallback locale plural function if the locale isn't available", function() {
        var mf = new MessageFormat( 'en-x-test1-test2' );
        var mfunc = mf.compile("{num, plural, one {# thing} other {# things}}");
        expect(mfunc.toString()).to.match(/\ben\b/);
        expect(mfunc({num: 3})).to.be("3 things");
      });

      it("should throw an error when you don't pass it any data, but it expects it", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("{NEEDSDATAYO}");
        expect(function(){ var z = mfunc(); }).to.throwError();
      });

      it("should not throw an error when you don't pass it any data, but it expects none", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("Just a string");
        expect(function(){ var z = mfunc(); }).to.not.throwError();
      });

      it("should throw an error when using an undefined formatting function", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("This is {VAR,uppercase}.");
        expect(function(){ var z = mfunc({"VAR":"big"}); }).to.throwError();
      });

      it("should use formatting functions - set in MessageFormat.formatters", function () {
        var mf = new MessageFormat( 'en' ).setIntlSupport();
        var mfunc = mf.compile("The date is {VAR,date}.");
        expect(mfunc({"VAR":"2010-12-31"})).to.contain("2010");
      });

      it("should use formatting functions - set in runtime", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("This is {VAR,uppercase}.");
        mf.runtime.fmt.uppercase = function(v) { return v.toUpperCase(); };
        expect(mfunc({"VAR":"big"})).to.eql("This is BIG.");
      });

      it("should use formatting functions - set in creator", function () {
        var mf = new MessageFormat( 'en', false, {uppercase: function(v) { return v.toUpperCase(); }} );
        var mfunc = mf.compile("This is {VAR,uppercase}.");
        expect(mfunc({"VAR":"big"})).to.eql("This is BIG.");
      });

      it("should add control codes to bidirectional text", function () {
        var msg = '{0} >> {1}';
        var data = ['Hello! English', 'Hello \u0647\u0644\u0627\u060d'];
        var mfEn = new MessageFormat('en').setBiDiSupport(true);
        var mfEg = new MessageFormat('ar-EG').setBiDiSupport(true);
        expect(mfEn.compile(msg)(data)).to.equal('\u200eHello! English\u200e >> \u200eHello \u0647\u0644\u0627\u060d\u200e');
        expect(mfEg.compile(msg)(data)).to.equal('\u200fHello! English\u200f >> \u200fHello \u0647\u0644\u0627\u060d\u200f');
      });

      it("should allow for a simple select", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("I am {FEELING, select, a{happy} b{sad} other{indifferent}}.");
        expect(mfunc({FEELING:"a"})).to.eql("I am happy.");
        expect(mfunc({FEELING:"b"})).to.eql("I am sad.");
        expect(mfunc({FEELING:"q"})).to.eql("I am indifferent.");
        expect(mfunc({})).to.eql("I am indifferent.");
      });

      it("should not evaluate select paths that aren't taken", function() {
        var mf = new MessageFormat( 'en' );
        var spyCalled = false;
        mf.runtime.fmt.spy = function(v) { spyCalled = true; return "spy"; };
        var mfunc = mf.compile("{VAR, select, a{correct} b{incorrect {VAR, spy}} other{incorrect {VAR, spy}}}");
        expect(mfunc({VAR:"a"})).to.eql("correct");
        expect(spyCalled).to.eql(false);
      });

      it("should allow for a simple plural form", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("I have {FRIENDS, plural, one{one friend} other{# friends}}.");
        expect(mfunc({FRIENDS:0})).to.eql("I have 0 friends.");
        expect(mfunc({FRIENDS:1})).to.eql("I have one friend.");
        expect(mfunc({FRIENDS:2})).to.eql("I have 2 friends.");
      });

      it("should not evaluate plural paths that aren't taken", function() {
        var mf = new MessageFormat( 'en' );
        var spyCalled = false;
        mf.runtime.fmt.spy = function(v) { spyCalled = true; return "spy"; };
        var mfunc = mf.compile("{VAR, plural, one{correct} b{incorrect {VAR, spy}} other{incorrect {VAR, spy}}}");
        expect(mfunc({VAR:1})).to.eql("correct");
        expect(spyCalled).to.eql(false);
      });

      it("should allow for a simple selectordinal form", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("The {FLOOR, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} floor.");
        expect(mfunc({FLOOR:0})).to.eql("The 0th floor.");
        expect(mfunc({FLOOR:1})).to.eql("The 1st floor.");
        expect(mfunc({FLOOR:2})).to.eql("The 2nd floor.");
      });

      it("should not evaluate selectordinal paths that aren't taken", function() {
        var mf = new MessageFormat( 'en' );
        var spyCalled = false;
        mf.runtime.fmt.spy = function(v) { spyCalled = true; return "spy"; };
        var mfunc = mf.compile("{VAR, selectordinal, one{correct} b{incorrect {VAR, spy}} other{incorrect {VAR, spy}}}");
        expect(mfunc({VAR:1})).to.eql("correct");
        expect(spyCalled).to.eql(false);
      });

      it("should reject number injections of numbers that don't exist", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile(
          "I have {FRIENDS, plural, one{one friend} other{# friends but {ENEMIES, plural, one{one enemy} other{# enemies}}}}."
        );
        expect(mfunc({FRIENDS:0, ENEMIES: 0})).to.eql("I have 0 friends but 0 enemies.");
        expect(function(){ var x = mfunc({FRIENDS:0,ENEMIES:'none'}); }).to.throwError(/ isn't a number\.$/);
        expect(function(){ var x = mfunc({}); }).to.throwError(/ isn't a number\.$/);
        expect(function(){ var x = mfunc({ENEMIES:0}); }).to.throwError(/ isn't a number\.$/);
      });

      it("should not expose prototype members - selects", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("I am {FEELING, select, a{happy} hasOwnProperty{evil} other{indifferent}}.");
        expect(mfunc({FEELING:"toString"})).to.eql("I am indifferent.");
      });

      it("should not expose prototype members - plurals", function () {
        var mf = new MessageFormat( 'en' );
        var mfunc = mf.compile("I have {FRIENDS, plural, one{one friend} other{friends}}.");
        expect(mfunc({FRIENDS:"toString"})).to.eql("I have friends.");
      });
    });

    describe("Real World Uses", function  () {
      it("can correctly pull in a different pluralization rule set", function () {
        // note, cy.js was included in the html file for the browser
        // and then in the common.js file
        var mf = new MessageFormat( 'cy' );
        var mfunc = mf.compile("{NUM, plural, zero{a} one{b} two{c} few{d} many{e} other{f} =42{omg42}}");
        expect(mfunc({NUM:0})).to.eql('a');
        expect(mfunc({NUM:1})).to.eql('b');
        expect(mfunc({NUM:2})).to.eql('c');
        expect(mfunc({NUM:3})).to.eql('d');
        expect(mfunc({NUM:6})).to.eql('e');
        expect(mfunc({NUM:15})).to.eql('f');
        expect(mfunc({NUM:42})).to.eql('omg42');
      });

      it("can parse complex, real-world messages with nested selects and plurals with offsets", function () {
        var input = "" +
        "{PERSON} added {PLURAL_NUM_PEOPLE, plural, offset:1" +
        "     =0 {no one}"+
        "     =1 {just {GENDER, select, male {him} female {her} other{them}}self}"+
        "    one {{GENDER, select, male {him} female {her} other{them}}self and one other person}"+
        "  other {{GENDER, select, male {him} female {her} other{them}}self and # other people}"+
        "} to {GENDER, select,"+
        "   male {his}"+
        " female {her}"+
        "  other {their}"+
        "} group.";

        var mf = new MessageFormat( 'en' );
        var mf_func = mf.compile( input );

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 0,
            PERSON : "Allie Sexton",
            GENDER: "female"
        }) ).to.eql('Allie Sexton added no one to her group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 1,
            PERSON : "Allie Sexton",
            GENDER: "female"
        }) ).to.eql('Allie Sexton added just herself to her group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 2,
            PERSON : "Allie Sexton",
            GENDER: "female"
        }) ).to.eql('Allie Sexton added herself and one other person to her group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 3,
            PERSON : "Allie Sexton",
            GENDER: "female"
        }) ).to.eql('Allie Sexton added herself and 2 other people to her group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 0,
            PERSON : "Alex Sexton",
            GENDER: "male"
        }) ).to.eql('Alex Sexton added no one to his group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 1,
            PERSON : "Alex Sexton",
            GENDER: "male"
        }) ).to.eql('Alex Sexton added just himself to his group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 2,
            PERSON : "Alex Sexton",
            GENDER: "male"
        }) ).to.eql('Alex Sexton added himself and one other person to his group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 3,
            PERSON : "Alex Sexton",
            GENDER: "male"
        }) ).to.eql('Alex Sexton added himself and 2 other people to his group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 0,
            PERSON : "Al Sexton"
        }) ).to.eql('Al Sexton added no one to their group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 1,
            PERSON : "Al Sexton"
        }) ).to.eql('Al Sexton added just themself to their group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 2,
            PERSON : "Al Sexton"
        }) ).to.eql('Al Sexton added themself and one other person to their group.');

        expect( mf_func({
            PLURAL_NUM_PEOPLE : 3,
            PERSON : "Al Sexton"
        }) ).to.eql('Al Sexton added themself and 2 other people to their group.');
      });

      it("can compile an object of messages into a function", function () {
        var mf = new MessageFormat( 'en' );
        var data = { 'key': 'I have {FRIENDS, plural, one{one friend} other{# friends}}.' };
        var mfunc = mf.compile(data);
        expect(mfunc).to.be.a('function');
        expect(mfunc.toString()).to.match(/\bkey\b/);

        expect(mfunc().key).to.be.a('function');
        expect(mfunc().key({FRIENDS:1})).to.eql("I have one friend.");
        expect(mfunc().key({FRIENDS:2})).to.eql("I have 2 friends.");
      });

      it("can compile an object enclosing reserved JavaScript words used as keys in quotes", function () {
        var mf = new MessageFormat( 'en' );
        var data = { 'default': 'default is a JavaScript reserved word so should be quoted',
                     'unreserved': 'unreserved is not a JavaScript reserved word so should not be quoted' };
        var mfunc = mf.compile(data);
        expect(mfunc).to.be.a('function');
        expect(mfunc.toString()).to.match(/"default"/);
        expect(mfunc.toString()).to.match(/[^"]unreserved[^"]/);

        expect(mfunc()['default']).to.be.a('function');
        expect(mfunc()['default']()).to.eql("default is a JavaScript reserved word so should be quoted");

        expect(mfunc().unreserved).to.be.a('function');
        expect(mfunc().unreserved()).to.eql("unreserved is not a JavaScript reserved word so should not be quoted");
      });

      it("can be instantiated multiple times for multiple languages", function () {
        var mf = {
            en: new MessageFormat('en'),
            ru: new MessageFormat('ru')
        };
        var cf = {
            en: mf.en.compile('{count} {count, plural, other{users}}'),
            ru: mf.ru.compile('{count} {count, plural, other{пользователей}}')
        };
        expect(function(){ cf.en({count: 12}); }).to.not.throwError();
        expect(cf.en({count: 12})).to.eql('12 users');
        expect(function(){ cf.ru({count: 13}); }).to.not.throwError();
        expect(cf.ru({count: 13})).to.eql('13 пользователей');
      });
    });
  });

  if (typeof require !== 'undefined') {
    describe("CommonJS Support", function () {
      it("should be able to use with a standard node require", function () {
        // common-js-generated-test-fixture is generated in the package.json before the tests are executed using the command
        // bin/messageformat.js --module --locale en --include example/en/colors.json -o test/common-js-generated-test-fixture.js
        var i18n = require('./common-js-generated-test-fixture');

        expect(i18n["example/en/colors"].red()).to.eql('red');
        expect(i18n["example/en/colors"].blue()).to.eql('blue');
        expect(i18n["example/en/colors"].green()).to.eql('green');
      });
    });
  }
});
