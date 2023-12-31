/**
 * Bits and pieces of the uniswap SDK that we need, adapted for our use
 */

/* eslint-disable no-bitwise,eqeqeq */

// non-sdk consts
const TWO = BigInt(2);
const TEN = BigInt(10);
const THIRTY_TWO = BigInt(32);
const NINETY_SIX = BigInt(96);
const ONE_TWENTY_EIGHT = BigInt(128);
const SIX_TENTH = BigInt(1000000);

// https://docs.uniswap.org/protocol/concepts/V3-overview/fees#pool-fees-tiers
const FEE_TIERS = [0.05, 0.3, 1];

// https://docs.uniswap.org/protocol/reference/deployments
const V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

// https://github.com/Uniswap/v3-sdk/blob/08a7c050cba00377843497030f502c05982b1c43/src/internalConstants.ts
const ZERO = BigInt(0);
const ONE = BigInt(1);
const Q96 = TWO ** NINETY_SIX;
const Q192 = Q96 ** TWO;

// https://github.com/Uniswap/sdk-core/blob/c6ee3b71ddeeb4125ff232dc6d958f6bc82c1c4d/src/constants.ts#L37
const MaxUint256 = BigInt(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
);

// https://github.com/Uniswap/v3-sdk/blob/08a7c050cba00377843497030f502c05982b1c43/src/utils/tickMath.ts
const Q32 = TWO ** THIRTY_TWO;

function mulShift(val, mulBy) {
  return (val * BigInt(mulBy)) >> ONE_TWENTY_EIGHT;
}

function getSqrtRatioAtTick(tick) {
  const absTick = tick < 0 ? tick * -1 : tick;

  let ratio =
    (absTick & 0x1) != 0
      ? BigInt('0xfffcb933bd6fad37aa2d162d1a594001')
      : BigInt('0x100000000000000000000000000000000');
  if ((absTick & 0x2) != 0) {
    ratio = mulShift(ratio, '0xfff97272373d413259a46990580e213a');
  }
  if ((absTick & 0x4) != 0) {
    ratio = mulShift(ratio, '0xfff2e50f5f656932ef12357cf3c7fdcc');
  }
  if ((absTick & 0x8) != 0) {
    ratio = mulShift(ratio, '0xffe5caca7e10e4e61c3624eaa0941cd0');
  }
  if ((absTick & 0x10) != 0) {
    ratio = mulShift(ratio, '0xffcb9843d60f6159c9db58835c926644');
  }
  if ((absTick & 0x20) != 0) {
    ratio = mulShift(ratio, '0xff973b41fa98c081472e6896dfb254c0');
  }
  if ((absTick & 0x40) != 0) {
    ratio = mulShift(ratio, '0xff2ea16466c96a3843ec78b326b52861');
  }
  if ((absTick & 0x80) != 0) {
    ratio = mulShift(ratio, '0xfe5dee046a99a2a811c461f1969c3053');
  }
  if ((absTick & 0x100) != 0) {
    ratio = mulShift(ratio, '0xfcbe86c7900a88aedcffc83b479aa3a4');
  }
  if ((absTick & 0x200) != 0) {
    ratio = mulShift(ratio, '0xf987a7253ac413176f2b074cf7815e54');
  }
  if ((absTick & 0x400) != 0) {
    ratio = mulShift(ratio, '0xf3392b0822b70005940c7a398e4b70f3');
  }
  if ((absTick & 0x800) != 0) {
    ratio = mulShift(ratio, '0xe7159475a2c29b7443b29c7fa6e889d9');
  }
  if ((absTick & 0x1000) != 0) {
    ratio = mulShift(ratio, '0xd097f3bdfd2022b8845ad8f792aa5825');
  }
  if ((absTick & 0x2000) != 0) {
    ratio = mulShift(ratio, '0xa9f746462d870fdf8a65dc1f90e061e5');
  }
  if ((absTick & 0x4000) != 0) {
    ratio = mulShift(ratio, '0x70d869a156d2a1b890bb3df62baf32f7');
  }
  if ((absTick & 0x8000) != 0) {
    ratio = mulShift(ratio, '0x31be135f97d08fd981231505542fcfa6');
  }
  if ((absTick & 0x10000) != 0) {
    ratio = mulShift(ratio, '0x9aa508b5b7a84e1c677de54f3e99bc9');
  }
  if ((absTick & 0x20000) != 0) {
    ratio = mulShift(ratio, '0x5d6af8dedb81196699c329225ee604');
  }
  if ((absTick & 0x40000) != 0) {
    ratio = mulShift(ratio, '0x2216e584f5fa1ea926041bedfe98');
  }
  if ((absTick & 0x80000) != 0) {
    ratio = mulShift(ratio, '0x48a170391f7dc42444e8fa2');
  }

  if (tick > 0) {
    ratio = MaxUint256 / ratio;
  }

  // back to Q96
  return ratio % Q32 > ZERO ? ratio / Q32 + ONE : ratio / Q32;
}

function computePoolPrice(decimals0, decimals1, sqrtPriceX96, tick) {
  // eslint-disable-next-line no-param-reassign
  [decimals0, decimals1, sqrtPriceX96] = [
    decimals0,
    decimals1,
    sqrtPriceX96,
  ].map(BigInt);

  // adapted from: https://github.com/Uniswap/v3-sdk/blob/08a7c050cba00377843497030f502c05982b1c43/src/entities/pool.ts#L81-L87
  const tickCurrentSqrtRatioX96 = getSqrtRatioAtTick(tick);
  const nextTickSqrtRatioX96 = getSqrtRatioAtTick(tick + 1);
  if (
    !(
      sqrtPriceX96 >= tickCurrentSqrtRatioX96 &&
      sqrtPriceX96 <= nextTickSqrtRatioX96
    )
  ) {
    throw new Error('Assertion failed: PRICE_BOUNDS');
  }

  // adapted from: https://github.com/Uniswap/sdk-core/blob/a7ac4796af399bb7051c0c64b139cecd470044d9/src/entities/fractions/price.ts
  return (
    Number(
      (sqrtPriceX96 ** TWO * TEN ** decimals0 * SIX_TENTH) /
        (Q192 * TEN ** decimals1),
    ) / Number(SIX_TENTH)
  );
}

module.exports = {
  FEE_TIERS,
  V3_FACTORY_ADDRESS,
  computePoolPrice,
};
