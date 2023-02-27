import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { ether } from './utils'
// Setup DEX Contracts
import UniswapV3Factory from './artifacts-apeswap/dex/contracts/UniswapV3Factory.json'
import UniswapV3Pool from './artifacts-apeswap/dex/contracts/UniswapV3Pool.json'
import NonfungiblePositionManagerBuild from './artifacts-apeswap/dex/contracts/NonfungiblePositionManager.json'
import NFTDescriptorBuild from './artifacts-apeswap/dex/contracts/NFTDescriptor.json'
import SwapRouterBuild from './artifacts-apeswap/dex/contracts/SwapRouter.json'
import NonfungibleTokenPositionDescriptorBuild from './artifacts-apeswap/dex/contracts/NonfungibleTokenPositionDescriptor.json'

// Setup Token Contracts
import ERC20MockBuild from './artifacts-apeswap/token/contracts/ERC20Mock.json'
import WNativeBuild from './artifacts-apeswap/token/contracts/WNative.json'

// Import Contract Types
import {
  ApePair,
  ApePair__factory,
  ERC20Mock,
  ERC20Mock__factory,
  WNative__factory,
  UniswapV3Factory__factory,
  NFTDescriptor__factory,
  SwapRouter__factory,
  NonfungiblePositionManager__factory,
  NonfungibleTokenPositionDescriptor__factory,
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
  numPairs = 2
) {
  const SwapRouter = (await ethers.getContractFactoryFromArtifact(
    SwapRouterBuild
  )) as SwapRouter__factory
  const uniV3Factory = (await ethers.getContractFactoryFromArtifact(
    UniswapV3Factory
  )) as UniswapV3Factory__factory
  const nonfungiblePositionManager =
    (await ethers.getContractFactoryFromArtifact(
      NonfungiblePositionManagerBuild
    )) as NonfungiblePositionManager__factory
  const NFTDescriptor = (await ethers.getContractFactoryFromArtifact(
    NFTDescriptorBuild
  )) as NFTDescriptor__factory

  const nftDescriptor = await NFTDescriptor.deploy()
  const nonfungibleTokenPositionDescriptor =
    (await ethers.getContractFactoryFromArtifact(
      NonfungibleTokenPositionDescriptorBuild,
      { libraries: { NFTDescriptor: nftDescriptor.address } }
    )) as NonfungibleTokenPositionDescriptor__factory

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
  const dexFactory = await uniV3Factory.connect(owner).deploy()

  // Setup pairs
  const mockWBNB = await WNative.connect(owner).deploy()
  const positionDescriptor = await nonfungibleTokenPositionDescriptor
    .connect(owner)
    .deploy(
      mockWBNB.address,
      '0x4c4f43414c205445535400000000000000000000000000000000000000000000'
    )
  const positionManager = await nonfungiblePositionManager
    .connect(owner)
    .deploy(dexFactory.address, mockWBNB.address, positionDescriptor.address)

  const dexRouter = await SwapRouter.deploy(
    dexFactory.address,
    mockWBNB.address
  )

  const mockTokens: ERC20Mock[] = []
  for (let index = 0; index < numPairs; index++) {
    // Mint pair token
    const mockToken = await ERC20Mock.connect(owner).deploy(
      `Mock Token ${index}`,
      `MOCK${index}`
    )

    await mockToken.connect(owner).mint(TOKEN_BASE_BALANCE)
    await mockToken
      .connect(owner)
      .approve(positionManager.address, TOKEN_BASE_BALANCE)

    await mockWBNB.connect(owner).deposit({
      value: WBNB_BASE_BALANCE, // Adding ETH liquidity which gets exchanged for WETH
    })
    await mockWBNB
      .connect(owner)
      .approve(positionManager.address, WBNB_BASE_BALANCE)

    let token0 = mockWBNB.address
    let token1 = mockToken.address
    if (mockWBNB.address > mockToken.address) {
      token0 = mockToken.address
      token1 = mockWBNB.address
    }

    await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      500,
      '79229023000000000000000000000',
      { gasLimit: '30000000' }
    )

    await positionManager.mint(
      {
        token0: token0,
        token1: token1,
        fee: 500,
        tickLower: -887270,
        tickUpper: 887270,
        amount0Desired: TOKEN_BASE_BALANCE,
        amount1Desired: WBNB_BASE_BALANCE,
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: '999999999999999',
      },
      { gasLimit: '30000000' }
    )

    mockTokens.push(mockToken)
  }

  return {
    dexFactory,
    dexRouter,
    positionManager,
    positionDescriptor,
    mockWBNB,
    mockTokens,
  }
}
