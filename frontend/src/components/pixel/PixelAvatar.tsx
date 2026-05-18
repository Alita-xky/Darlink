import React from 'react';
import Svg from 'react-native-svg';
import { PALETTES } from './palette';
import type { PixelFeatures } from './features';

import BodyMale from './parts/body/male';
import BodyFemale from './parts/body/female';
import BodyNeutral from './parts/body/neutral';

import HairShort from './parts/hair/short';
import HairLong from './parts/hair/long';
import HairCurly from './parts/hair/curly';
import HairBald from './parts/hair/bald';
import HairBun from './parts/hair/bun';
import HairBuzz from './parts/hair/buzz';
import HairSamurai from './parts/hair/samurai';
import HairWave from './parts/hair/wave';

import FaceChill from './parts/face/chill';
import FaceSerious from './parts/face/serious';
import FaceSmile from './parts/face/smile';
import FaceGlasses from './parts/face/glasses';
import FaceWink from './parts/face/wink';

import TopHoodie from './parts/top/hoodie';
import TopShirt from './parts/top/shirt';
import TopBlazer from './parts/top/blazer';
import TopTee from './parts/top/tee';
import TopJacket from './parts/top/jacket';
import TopTurtleneck from './parts/top/turtleneck';
import TopJersey from './parts/top/jersey';
import TopDress from './parts/top/dress';
import TopUniform from './parts/top/uniform';
import TopVarsity from './parts/top/varsity';

import PropBook from './parts/prop/book';
import PropLaptop from './parts/prop/laptop';
import PropCoffee from './parts/prop/coffee';
import PropMic from './parts/prop/mic';
import PropBasketball from './parts/prop/basketball';
import PropRocket from './parts/prop/rocket';
import PropIphone from './parts/prop/iphone';
import PropFlask from './parts/prop/flask';
import PropTypewriter from './parts/prop/typewriter';
import PropGuitar from './parts/prop/guitar';

import BgLibrary from './parts/bg/library';
import BgCafe from './parts/bg/cafe';
import BgDorm from './parts/bg/dorm';
import BgStreet from './parts/bg/street';
import BgStudio from './parts/bg/studio';

const BODIES = { male: BodyMale, female: BodyFemale, neutral: BodyNeutral } as const;
const HAIRS = { short: HairShort, long: HairLong, curly: HairCurly, bald: HairBald, bun: HairBun, buzz: HairBuzz, samurai: HairSamurai, wave: HairWave } as const;
const FACES = { chill: FaceChill, serious: FaceSerious, smile: FaceSmile, glasses: FaceGlasses, wink: FaceWink } as const;
const TOPS = { hoodie: TopHoodie, shirt: TopShirt, blazer: TopBlazer, tee: TopTee, jacket: TopJacket, turtleneck: TopTurtleneck, jersey: TopJersey, dress: TopDress, uniform: TopUniform, varsity: TopVarsity } as const;
const PROPS = { book: PropBook, laptop: PropLaptop, coffee: PropCoffee, mic: PropMic, basketball: PropBasketball, rocket: PropRocket, iphone: PropIphone, flask: PropFlask, typewriter: PropTypewriter, guitar: PropGuitar } as const;
const BGS = { library: BgLibrary, cafe: BgCafe, dorm: BgDorm, street: BgStreet, studio: BgStudio } as const;

type Props = {
  features: PixelFeatures;
  size?: number;
};

export const PixelAvatar = React.memo(function PixelAvatar({ features, size = 120 }: Props) {
  const palette = PALETTES[features.palette];
  const Body = BODIES[features.body];
  const Hair = HAIRS[features.hair];
  const Face = FACES[features.face];
  const Top = TOPS[features.top];
  const Prop = features.prop ? PROPS[features.prop] : null;
  const Bg = features.bg ? BGS[features.bg] : null;

  return (
    <Svg width={size} height={size * 1.5} viewBox="0 0 64 96">
      {Bg && <Bg palette={palette} />}
      <Body palette={palette} />
      <Top palette={palette} />
      <Hair palette={palette} />
      <Face palette={palette} />
      {Prop && <Prop palette={palette} />}
    </Svg>
  );
});
