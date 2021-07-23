import { animate, query, style, transition, trigger } from '@angular/animations';

export const fader =
  trigger('routeAnimations', [
    transition('* <=> *', [
      query(':enter, :leave', [
        style({
          position: 'absolute',
          left: 0,
          width: '100%',
          opacity: 0,
          transform: 'scale(0) translateY(100%)'
        })
      ], { optional: true }),
      query(':enter', [
        animate(
          '600ms ease',
          style({
            opacity: 1,
            transform: 'scale(1)'
          }))
      ], { optional: true })
    ]),
  ]);
