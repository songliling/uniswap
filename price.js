import { ChainId, Token, WETH, Fetcher, Trade, Route, TokenAmount, TradeType, Percent } from '@uniswap/sdk'
import JSBI from 'jsbi/dist/jsbi.mjs';

// function 

function basisPointsToPercent(num) {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

const Field = {
  INPUT: 'INPUT',
  OUTPUT: 'OUTPUT'
}

// const DAI = new Token(ChainId.KOVAN, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18)
const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18)

//
const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))

// config from custom user
const AllowedSlippage = 50

// note that you may want/need to handle this async code differently,
// for example if top-level await is not an option
const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId])

const route = new Route([pair], WETH[DAI.chainId])

const trade = new Trade(route, new TokenAmount(WETH[DAI.chainId], '1000000000000000000'), TradeType.EXACT_INPUT)

console.log("Price", trade.executionPrice.toSignificant(6))
console.log("iInvert Price", trade.executionPrice.invert().toSignificant(6))


const BASE_FEE = new Percent(JSBI.BigInt(30), JSBI.BigInt(10000))
const ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000))
const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE)

const realizedLPFee = !trade
    ? undefined
    : ONE_HUNDRED_PERCENT.subtract(
        trade.route.pairs.reduce(
          (currentFee) => currentFee.multiply(INPUT_FRACTION_AFTER_FEE),
          ONE_HUNDRED_PERCENT
        )
      )

const priceImpactWithoutFeeFraction = trade && realizedLPFee ? trade.priceImpact.subtract(realizedLPFee) : undefined

const priceImpactWithoutFeePercent = priceImpactWithoutFeeFraction
    ? new Percent(priceImpactWithoutFeeFraction.numerator, priceImpactWithoutFeeFraction.denominator)
    : undefined

console.log("Price Impact", priceImpactWithoutFeePercent ?
	(priceImpactWithoutFeePercent.lessThan(ONE_BIPS) ? '<0.01%' : priceImpactWithoutFeePercent.toFix(2)) : '-')

console.log("Liquidity Provider Fee", realizedLPFee ? realizedLPFee.toSignificant(6) + ' ' + trade.inputAmount.currency.symbol : '-')


const pct = basisPointsToPercent(AllowedSlippage)
const slippageAdjustedAmounts = {
    [Field.INPUT]: trade.maximumAmountIn(pct),
    [Field.OUTPUT]: trade.minimumAmountOut(pct)
  }

console.log("Minimum received", slippageAdjustedAmounts[Field.OUTPUT].toSignificant(4))


