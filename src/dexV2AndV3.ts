import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { ether } from './utils'
import ApeSwapMultiSwapRouterBuild from './artifacts-apeswap/dex/contracts/ApeSwapMultiSwapRouter.json'

// Import Contract Types
import { ApeSwapMultiSwapRouter__factory, WNative } from '../typechain-types'
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
  const ApeSwapMultiSwapRouter = (await ethers.getContractFactoryFromArtifact(
    ApeSwapMultiSwapRouterBuild
  )) as ApeSwapMultiSwapRouter__factory

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

  const router = await ApeSwapMultiSwapRouter.deploy(
    [DEXV3.dexFactory.address, DEXV2.dexRouter.address],
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
