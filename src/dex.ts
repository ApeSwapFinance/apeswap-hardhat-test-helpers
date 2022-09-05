import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { ether } from './utils'
// Setup DEX Contracts
import ApeFactoryBuild from './artifacts-apeswap/dex/contracts/ApeFactory.json'
import ApeRouterBuild from './artifacts-apeswap/dex/contracts/ApeRouter.json'
// import ApePairBuild from '../artifacts-apeswap/dex/contracts/ApePair.json');

// Setup Token Contracts
import ERC20MockBuild from './artifacts-apeswap/token/contracts/ERC20Mock.json'
import WNativeBuild from './artifacts-apeswap/token/contracts/WNative.json'


/**
 * Deploy a mock dex. 
 * 
 * - LP fees are sent to `feeTo`
 * - Initial LP tokens are minted to `alice`
 */
// NOTE: Currently does not create a BANANA/WBNB pair
export async function deployMockDex(
  ethers: HardhatEthersHelpers,
  [owner, feeTo, alice]: [SignerWithAddress, SignerWithAddress, SignerWithAddress],
  numPairs = 2
) {
  const ApeFactory = await ethers.getContractFactory(
    ApeFactoryBuild.abi,
    ApeFactoryBuild.bytecode
  )
  const ApeRouter = await ethers.getContractFactory(
    ApeRouterBuild.abi,
    ApeRouterBuild.bytecode
  )
  // const ApePair = await ethers.getContractFactory(ApePairBuild.abi, ApePairBuild.bytecode);
  // Setup Token Contracts
  const ERC20Mock = await ethers.getContractFactory(
    ERC20MockBuild.abi,
    ERC20MockBuild.bytecode
  )
  const WNative = await ethers.getContractFactory(
    WNativeBuild.abi,
    WNativeBuild.bytecode
  )

  const TOKEN_BASE_BALANCE = ether('1000')
  const WBNB_BASE_BALANCE = ether('1')
  // Setup DEX factory
  const dexFactory = await ApeFactory.connect(owner).deploy(feeTo.address)

  // Setup pairs
  const mockWBNB = await WNative.connect(owner).deploy()
  const dexRouter = await ApeRouter.connect(owner).deploy(dexFactory.address, mockWBNB.address)
  const mockTokens = []
  const dexPairs = []
  for (let index = 0; index < numPairs; index++) {
    // Mint pair token
    const mockToken = await ERC20Mock.connect(owner).deploy(`Mock Token ${index}`, `MOCK${index}`)

    await mockToken.connect(owner).mint(TOKEN_BASE_BALANCE)
    await mockToken.connect(owner).approve(dexRouter.address, TOKEN_BASE_BALANCE)

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

    const pairCreated = await dexFactory.getPair(
      mockToken.address,
      mockWBNB.address
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