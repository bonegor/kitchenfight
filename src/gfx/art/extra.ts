/** Small extra sprites painted by the integrator (ambient critters). */
import { defineSprite } from '../sprites';
import { shape, ellipsePath, circlePath, line } from '../painter';

// Flying pigeon (2 frames: wings up / wings down), facing right.
defineSprite({
  id: 'fx.pigeon_fly',
  w: 46,
  h: 50,
  ax: 23,
  ay: 28,
  frames: 2,
  draw(ctx, f) {
    const up = f === 0;
    // far wing
    shape(ctx, (c) => {
      c.moveTo(-2, -2);
      if (up) c.quadraticCurveTo(-10, -20, -18, -15);
      else c.quadraticCurveTo(-12, 8, -20, 10);
      c.quadraticCurveTo(-8, up ? -6 : 2, -2, 2);
      c.closePath();
    }, { fill: '#7e8794', ink: 1.4, shadow: 'none' });
    // tail
    shape(ctx, (c) => {
      c.moveTo(-8, 1);
      c.lineTo(-19, -2);
      c.lineTo(-18, 5);
      c.closePath();
    }, { fill: '#6f7784', ink: 1.4, shadow: 'none' });
    // body
    shape(ctx, (c) => ellipsePath(c, 0, 1, 11, 6.5, -0.15), { fill: '#a7b0bd', ink: 1.6, shadowOffset: [-1.5, -1.5] });
    // iridescent neck
    shape(ctx, (c) => ellipsePath(c, 7, -2.5, 4.5, 4.2, -0.4), { fill: '#6fa69a', ink: 1.2, shadow: '#7a5a9a', shadowOffset: [-1, -1] });
    // head
    shape(ctx, (c) => circlePath(c, 11, -5, 3.6), { fill: '#8d96a4', ink: 1.3, shadowOffset: [-0.8, -0.8] });
    shape(ctx, (c) => circlePath(c, 12.2, -5.6, 1.1), { fill: '#f08a2a', ink: 0.6, shadow: 'none' });
    shape(ctx, (c) => { c.moveTo(14.3, -5); c.lineTo(17.4, -4); c.lineTo(14.3, -3.2); c.closePath(); }, { fill: '#d8c9b8', ink: 0.8, shadow: 'none' });
    // near wing
    shape(ctx, (c) => {
      c.moveTo(-1, -1);
      if (up) c.quadraticCurveTo(-4, -24, -14, -20);
      else c.quadraticCurveTo(-6, 14, -16, 15);
      c.quadraticCurveTo(-6, up ? -6 : 4, 2, 1);
      c.closePath();
    }, { fill: '#b9c1cc', ink: 1.5, shadow: '#8c95a3', shadowOffset: [-1.2, -1.2] });
    line(ctx, up ? [[-6, -14], [-10, -17]] : [[-7, 9], [-11, 11]], 0.9, '#5d6470');
  },
});
