import { getCodeRideModifiers } from './codeRewards.js';
export const WHEELIE_TRICKS = [
  { id:'normal', label:'Wheelie', points:10 },
  { id:'one-hand', label:'1 hander', points:25 },
  { id:'no-hands', label:'No hander', points:50 },
  { id:'leg-wrap', label:'Leg wrap', points:40 },
  { id:'one-footer', label:'1 footer', points:30 },
  { id:'can-can', label:'Can-can', points:45 },
  { id:'superman', label:'Superman', points:70 },
  { id:'knee-knock', label:'Knee knock', points:45 },
  { id:'salute', label:'Salute', points:35 },
  { id:'tail-grab', label:'Tail grab', points:60 },
  { id:'starfish', label:'Starfish', points:80 },
  { id:'heel-clicker', label:'Heel clicker', points:85 },
  { id:'nac-nac', label:'Nac-nac', points:65 },
  { id:'cross-hand', label:'Cross hand', points:55 },
  { id:'heart-hands', label:'Heart hands', points:60 },
  { id:'bow-arrow', label:'Bow & arrow', points:70 },
  { id:'rocket', label:'Rocket', points:90 },
  { id:'seat-stand', label:'Rear stand', points:55 },
];

export function getExtraPhotoPose(trick, layout) {
  const [, , , , , hx, hy, dy] = layout;
  const poses = {
    'starfish': {leftArm:'M53 -2 L74 -15 L88 -20',rightArm:'M49 -1 L28 -15 L17 -20',leftHand:[88,-20],rightHand:[17,-20],leftLeg:'M53 34 L39 54 L24 63',leg:'M58 33 L76 48 L91 60',leftBoot:'M20 63 L27 63',rightBoot:'M88 60 L95 60'},
    'heel-clicker': {leftLeg:'M53 34 L38 37 L32 25',leg:'M58 33 L46 41 L32 25',leftBoot:'M28 25 L34 25',rightBoot:'M30 27 L36 27'},
    'nac-nac': {leg:`M58 33 L78 47 L87 ${dy-10}`,rightBoot:`M84 ${dy-10} L91 ${dy-10}`,bodyTransform:'rotate(12 56 34)'},
    'cross-hand': {leftArm:`M53 -2 L43 6 L${hx+4} ${hy+2}`,rightArm:`M49 -1 L56 12 L${hx-3} ${hy}`,leftHand:[hx+4,hy+2],rightHand:[hx-3,hy]},
    'heart-hands': {leftArm:'M53 -2 L66 9 L52 6',rightArm:'M49 -1 L37 9 L50 6',leftHand:[52,6],rightHand:[50,6]},
    'bow-arrow': {leftArm:'M53 -2 L64 2 L51 8',rightArm:'M49 -1 L31 -2 L14 -4',leftHand:[51,8],rightHand:[14,-4]},
    'rocket': {bodyTransform:'rotate(-55 56 34)',leftLeg:'M53 34 L77 12 L92 0',leg:'M58 33 L81 20 L97 10',leftBoot:'M90 0 L97 0',rightBoot:'M95 10 L101 10',leftArm:`M24 17 L28 20 L${hx} ${hy}`,rightArm:`M25 22 L31 25 L${hx+2} ${hy+1}`},
    'seat-stand': {bodyTransform:'translate(17 -9)',leftLeg:`M70 25 L75 50 L77 ${dy-9}`,leg:`M75 24 L85 46 L87 ${dy-9}`,leftBoot:`M74 ${dy-7} L81 ${dy-7}`,rightBoot:`M84 ${dy-7} L91 ${dy-7}`,leftArm:`M70 -11 L54 -6 L${hx} ${hy}`,rightArm:`M66 -10 L51 0 L${hx+2} ${hy+1}`},
  };
  return poses[trick] || {};
}

export function getTrick(id) {
  return WHEELIE_TRICKS.find(trick => trick.id === id) || WHEELIE_TRICKS[0];
}

export function getTrickPoints(id) {
  const multiplier = getCodeRideModifiers().trick;
  return getTrick(id).points * multiplier;
}
