const { panel, text } = require('@metamask/snaps-sdk');

// const symbols = require('./symbols');
const token = require('./token');
const { getTokenPairSpotPrice } = require('./uniswap');

/**
 *
 * @param origin
 * @param request
 */
async function lookupHandler(origin, request) {
  const consent = snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        text(`Hello, **${origin}**!`),
        text('This custom confirmation is just for display purposes.'),
        text('So you are trying to fetch spot prices for these token address'),
      ]),
    },
  });
  if (!consent) {
    return 'Sad to see you go 😭';
  }
  return getTokenPairSpotPrice(request.tokenPair);
}

/**
 *
 * @param options0
 * @param options0.erc
 * @param options0.address
 */
async function identifyHandler({ erc, address }) {
  if ([20, 721, 1155].includes(erc)) {
    return token.is[`ERC${erc}`](address);
  }
  if (typeof erc === 'undefined') {
    return token.identify(address);
  }
  throw new Error(`Unexpected ERC Specification ${erc}`);
}

module.exports.onRpcRequest = async ({ origin, request }) => {
  try {
    switch (request.method) {
      case 'price_lookup':
        return { result: await lookupHandler(origin, request.params) };
      case 'identify_token':
        return { result: await identifyHandler(request.params) };
      default:
    }
  } catch (_) {
    // const error = Object.assign(
    //   { message: err.message, stack: err.stack },
    //   err[symbols.errorMeta] ? { meta: err[symbols.errorMeta] } : {},
    //   err[symbols.nestedErrors]
    //     ? {
    //         errors: err[symbols.nestedErrors].map((cause) =>
    //           Object.assign(
    //             {
    //               message: cause.message,
    //               stack: cause.stack,
    //             },
    //             cause[symbols.errorMeta]
    //               ? { meta: cause[symbols.errorMeta] }
    //               : {},
    //           ),
    //         ),
    //       }
    //     : {},
    // );
    // return JSON.stringify(err);
    return null;
  }

  throw new Error('Unsupported RPC method');
};
