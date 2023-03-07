import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { ether } from './utils'
import SwapRouter02Build from './artifacts-apeswap/dex/contracts/SwapRouter02.json'


// Import Contract Types
import {
  SwapRouter02__factory,
  WNative,
} from '../typechain-types'
import { deployMockDex as deployMockDexV2, addLiquidity } from './dex'
import { deployMockDex as deployMockDexV3 } from './dexV3'

/**
 * Deploy a mock dex.
 *
 * - LP fees are sent to `feeTo`
 * - Initial LP tokens are minted to `alice`
 */
// NOTE: Currently does not create a BANANA/WBNB pair
export async function deployDexesAndRouter(
  ethers: HardhatEthersHelpers,
  [owner, feeTo, alice]: [
    SignerWithAddress,
    SignerWithAddress,
    SignerWithAddress
  ],
  numPairs = 2,
  mockWBNBoverwrite: WNative | null = null
) {
  const SwapRouter = (await ethers.getContractFactoryFromArtifact(
    SwapRouter02Build
  )) as SwapRouter02__factory

  const DEXV3 = await deployMockDexV3(
    ethers,
    [owner, feeTo, alice],
    numPairs,
    mockWBNBoverwrite
  )

  const DEXV2 = await deployMockDexV2(
    ethers,
    [owner, feeTo, alice],
    numPairs,
    DEXV3.mockWBNB
  )
  await addLiquidity(
    ethers,
    DEXV2.dexFactory,
    DEXV2.dexRouter,
    DEXV3.mockTokens,
    DEXV3.mockWBNB,
    [owner, alice]
  )

  const router = await SwapRouter.deploy(
    DEXV3.dexFactory.address,
    DEXV2.dexFactory.address,
    DEXV3.positionManager.address,
    DEXV3.mockWBNB.address
  )
  return {
    DEXV3,
    DEXV2,
    router,
    mockWBNB: DEXV3.mockWBNB,
    mockTokens: DEXV3.mockTokens,
  }
}
