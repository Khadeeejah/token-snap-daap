const _interfaces = require('./interfaces');
const provider = require('./provider');
const symbols = require('./symbols');
const SDK = require('./v3-sdk-slim');

const { Pool, UniswapV3Factory, ERC20 } = _interfaces(provider);

// polyfill for the missing Promise.any method
const PromiseAny = (tasks) =>
  'any' in Promise
    ? Promise.any(tasks)
    : new Promise((r, e) => {
        const errors = [];
        Promise.all(
          tasks.map((p) => p.then(r).catch((err) => errors.push(err))),
        ).then(
          () =>
            errors.length &&
            e(
              Object.assign(new Error('Aggregate Error'), {
                [symbols.nestedErrors]: errors,
              }),
            ),
        );
      });

async function getPoolDetails(tokenPair) {
  // eslint-disable-next-line no-param-reassign
  tokenPair = tokenPair.sort(
    (a, b) => -1 * (a.toLowerCase() < b.toLowerCase()),
  );
  try {
    const factoryContract = UniswapV3Factory.at(SDK.V3_FACTORY_ADDRESS);
    const tokensMeta = tokenPair.map((addr) =>
      ((tokenContract) => ({
        symbol: tokenContract.methods.symbol().call(),
        decimals: tokenContract.methods.decimals().call(),
      }))(ERC20.at(addr)),
    );
    return await PromiseAny(
      SDK.FEE_TIERS.map((feeTier) =>
        (async () => {
          const poolAddress = await factoryContract.methods
            .getPool(tokenPair[0], tokenPair[1], feeTier * 10000)
            .call();
          // todo! check addr is not 0x0
          try {
            const poolContract = Pool.at(poolAddress);
            const { sqrtPriceX96, tick } = await poolContract.methods
              .slot0()
              .call();
            return {
              tokens: await Promise.all(
                tokensMeta.map(async (meta, i) => ({
                  address: tokenPair[i],
                  symbol: await meta.symbol,
                  decimals: Number(await meta.decimals),
                })),
              ),
              sqrtPriceX96,
              tick,
            };
          } catch (err) {
            Object.assign(
              (err[symbols.errorMeta] = err[symbols.errorMeta] || {}),
              { feeTier, poolAddress },
            );
            throw err;
          }
        })(),
      ),
    );
  } catch (err) {
    Object.assign((err[symbols.errorMeta] = err[symbols.errorMeta] || {}), {
      tokenPair,
    });
    throw err;
  }
}

async function getTokenPairSpotPrice(tokenPair) {
  const { tokens, sqrtPriceX96, tick } = await getPoolDetails(tokenPair);
  tokens[0].price = SDK.computePoolPrice(
    tokens[0].decimals,
    tokens[1].decimals,
    sqrtPriceX96,
    tick,
  );
  tokens[1].price = 1 / tokens[0].price;
  return Object.fromEntries(
    tokens.map(({ address, symbol, decimals, price }) => [
      address,
      { symbol, decimals, price },
    ]),
  );
}

module.exports = { getTokenPairSpotPrice };

async function main() {
  function assertEq(a, b) {
    const er = `Assertion Failed, left: [\x1b[33m${a}\x1b[0m], right: [\x1b[33m${b}\x1b[0m]`;
    if (a !== b) {
      throw new Error(er);
    }
  }

  const tokenPair = [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    '0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6',
  ];
  console.log('Querying Token Price For', tokenPair);
  const result = await getTokenPairSpotPrice(tokenPair);
  console.log(result);

  assertEq('WETH', result['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'].symbol);

  assertEq(18, result['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'].decimals);

  assertEq('rUSD', result['0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6'].symbol);

  assertEq(18, result['0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6'].decimals);

  // test relationship
  assertEq(
    1,
    result['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'].price *
      result['0xF9A2D7E60a3297E513317AD1d7Ce101CC4C6C8F6'].price,
  );
}

if (require.main === module) {
  main();
}
