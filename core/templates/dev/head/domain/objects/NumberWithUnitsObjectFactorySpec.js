describe('NumberWithUnitsObjectFactory', function() {
  beforeEach(module('oppia'));

  describe('number with units object factory', function() {
    var NumberWithUnits = null;
    var Units = null;
    var Fraction = null;

    beforeEach(inject(function($injector) {
      NumberWithUnits = $injector.get('NumberWithUnitsObjectFactory');
      Units = $injector.get('UnitsObjectFactory');
      Fraction = $injector.get('FractionObjectFactory');
    }));

    it('should convert units to dict format', function() {
      expect(new Units('kg / kg^2 K mol / (N m s^2) K s').toDict()).toEqual(
        {kg: -1, K: 2, mol: 1, N: -1, m: -1, s: -1});
      expect(new Units('mol/(kg / (N m / s^2)').toDict()).toEqual(
        {mol: 1, kg: -1, N: 1, m: 1, s: -2});
    });

    it('should convert units from dict to string format', function() {
      expect(Units.fromDictToString(
        {kg: -1, K: 2, mol: 1, N: -1, m: -1, s: -1})).toBe(
          'kg^-1 K^2 mol^1 N^-1 m^-1 s^-1');
      expect(Units.fromDictToString(
        {mol: 1, kg: -1, N: 1, m: 1, s: -2, K: -1})).toBe(
          'mol^1 kg^-1 N^1 m^1 s^-2 K^-1');
    });

    it('should parse valid units strings', function() {
      expect(Units.fromRawInputString('kg / (K mol^-2)').toDict()).toEqual(
        new Units('kg / (K mol^-2)').toDict());
      expect(Units.fromRawInputString('kg / (K mol^-2) N / m^2').toDict(
        )).toEqual(new Units('kg / (K mol^-2) N / m^2').toDict());
    });

    it('should parse valid number with units strings', function() {
      expect(NumberWithUnits.fromRawInputString('2.02 kg / m^3')).toEqual(
        new NumberWithUnits('real', 2.02, '', Units.fromRawInputString(
          'kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2/3 kg / m^3')).toEqual(
        new NumberWithUnits('fraction', '', Fraction.fromRawInputString(
          '2/3'), Units.fromRawInputString('kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2')).toEqual(
        new NumberWithUnits('real', 2, '', ''));
      expect(NumberWithUnits.fromRawInputString('2/3')).toEqual(
        new NumberWithUnits('fraction', '', Fraction.fromRawInputString(
          '2/3'), ''));
      expect(NumberWithUnits.fromRawInputString('$ 2.02')).toEqual(
        new NumberWithUnits('real', 2.02, '', Units.fromRawInputString('$')));
      expect(NumberWithUnits.fromRawInputString('Rs 2/3')).toEqual(
        new NumberWithUnits('fraction', '', Fraction.fromRawInputString(
          '2/3'), Units.fromRawInputString('Rs')));
    });
  });
});
