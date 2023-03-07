import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { ether } from './utils'
// Setup DEX Contracts
import ApeFactoryBuild from './artifacts-apeswap/dex/contracts/ApeFactory.json'
import ApeRouterBuild from './artifacts-apeswap/dex/contracts/ApeRouter.json'
import ApePairBuild from './artifacts-apeswap/dex/contracts/ApePair.json'

// Setup Token Contracts
import ERC20MockBuild from './artifacts-apeswap/token/contracts/ERC20Mock.json'
import WNativeBuild from './artifacts-apeswap/token/contracts/WNative.json'

// Import Contract Types
import {
  ApeFactory__factory,
  ApeRouter__factory,
  ApePair,
  ApePair__factory,
  ERC20Mock,
  ERC20Mock__factory,
  WNative,
  WNative__factory,
} from '../typechain-types'

/**
 * Deploy a mock dex.
 *
 * - LP fees are sent to `feeTo`
 * - Initial LP tokens are minted to `alice`
 */
// NOTE: Currently does not create a BANANA/WBNB pair
export async function deployMockDex(
  ethers: HardhatEthersHelpers,
  [owner, feeTo, alice]: [
    SignerWithAddress,
    SignerWithAddress,
    SignerWithAddress
  ],
  numPairs = 2,
  mockWBNBoverwrite: WNative | null = null
) {
  const ApeFactory = (await ethers.getContractFactory(
    ApeFactoryBuild.abi,
    ApeFactoryBuild.bytecode
  )) as ApeFactory__factory
  const ApeRouter = (await ethers.getContractFactory(
    ApeRouterBuild.abi,
    ApeRouterBuild.bytecode
  )) as ApeRouter__factory
  const ApePair = (await ethers.getContractFactory(
    ApePairBuild.abi,
    ApePairBuild.bytecode
  )) as ApePair__factory
  // Setup Token Contracts
  const ERC20Mock = (await ethers.getContractFactory(
    ERC20MockBuild.abi,
    ERC20MockBuild.bytecode
  )) as ERC20Mock__factory
  const WNative = (await ethers.getContractFactory(
    WNativeBuild.abi,
    WNativeBuild.bytecode
  )) as WNative__factory

  const TOKEN_BASE_BALANCE = ether('1000')
  const WBNB_BASE_BALANCE = ether('1')
  // Setup DEX factory
  const dexFactory = await ApeFactory.connect(owner).deploy(feeTo.address)

  // Setup pairs
  let mockWBNB: WNative
  if (mockWBNBoverwrite != null) {
    mockWBNB = mockWBNBoverwrite
  } else {
    mockWBNB = await WNative.connect(owner).deploy()
  }
  const dexRouter = await ApeRouter.connect(owner).deploy(
    dexFactory.address,
    mockWBNB.address
  )
  const mockTokens: ERC20Mock[] = []
  const dexPairs: ApePair[] = []
  for (let index = 0; index < numPairs; index++) {
    // Mint pair token
    const mockToken = await ERC20Mock.connect(owner).deploy(
      `Mock Token ${index}`,
      `MOCK${index}`
    )

    await mockToken.connect(owner).mint(TOKEN_BASE_BALANCE)
    await mockToken
      .connect(owner)
      .approve(dexRouter.address, TOKEN_BASE_BALANCE)

    await dexRouter.connect(owner).addLiquidityETH(
      mockToken.address, // token
      TOKEN_BASE_BALANCE, // amountTokenDesired
      0, // amountTokenMin
      0, // amountETHMin
      alice.address, // to
      '9999999999', // deadline
      {
        value: WBNB_BASE_BALANCE, // Adding ETH liquidity which gets exchanged for WETH
      }
    )

    const pairCreated = await ApePair.attach(
      await dexFactory.getPair(mockToken.address, mockWBNB.address)
    )

    // NOTE: Alternative way to create pairs directly through ApeFactory
    // Create an initial pair
    // await dexFactory.createPair(mockWBNB.address, mockToken.address);
    // const pairCreated = await ApePair.at(await dexFactory.allPairs(index));

    // // Obtain LP Tokens
    // await mockWBNB.transfer(pairCreated.address, WBNB_BASE_BALANCE);
    // await mockToken.transfer(pairCreated.address, TOKEN_BASE_BALANCE);
    // await pairCreated.mint(alice);

    dexPairs.push(pairCreated)
    mockTokens.push(mockToken)
  }

  return {
    dexFactory,
    dexRouter,
    mockWBNB,
    mockTokens,
    dexPairs,
  }
}
