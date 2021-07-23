import { animate, query, style, transition, trigger } from '@angular/animations';
let optional = { optional: true };
export const fader =
  trigger('routeAnimations', [
    transition('* <=> *', [
      query(
        ':enter',
        [
          style({ opacity: 0 })
        ], optional
      ),

      query(
        ':leave',
        [
          style({ opacity: 1 }),
          animate('0.5s', style({ opacity: 0 }))
        ], optional
      ),

      query(
        ':enter',
        [
          style({ opacity: 0 }),
          animate('0.5s', style({ opacity: 1 }))
        ], optional
      )
      // query(':enter, :leave', [
      //   style({
      //     position: 'absolute',
      //     left: 0,
      //     width: '100%',
      //     opacity: 0,
      //     transform: 'scale(0) translateY(100%)'
      //   })
      // ], {optional: true}),
      // query(':enter', [
      //   animate(
      //     '600ms ease',
      //     style({
      //       opacity: 1,
      //       transform: 'scale(1)'
      //     }))
      // ], {optional: true})
      // query(':enter', [
      //   style({ opacity: 0 }),
      //   animate(1000, style({ opacity: 1 }))
      // ]),
      // query(':leave', [
      //   animate(1000, style({ opacity: 1 }))
      // ])
    ]),
  ]);
