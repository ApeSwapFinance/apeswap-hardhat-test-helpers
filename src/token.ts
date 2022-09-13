import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { ether } from './utils'

// Setup Token Contracts
import ERC20MockBuild from './artifacts-apeswap/token/contracts/ERC20Mock.json'
import WNativeBuild from './artifacts-apeswap/token/contracts/WNative.json'

// Import Contract Types
import {
  ERC20Mock,
  ERC20Mock__factory,
  WNative__factory,
} from '../typechain-types'

/**
 * Deploy mintable ERC-20 Tokens for testing 
 */
export async function deployMockTokens(
  ethers: HardhatEthersHelpers,
  [owner]: [SignerWithAddress],
  {
    numTokens = 1,
    tokenBaseBalance = ether('1000'),
    wbnbBaseBalance = ether('1')
  }
) {
  // Setup Token Contracts
  const ERC20Mock = (await ethers.getContractFactory(
    ERC20MockBuild.abi,
    ERC20MockBuild.bytecode
  )) as ERC20Mock__factory
  const WNative = (await ethers.getContractFactory(
    WNativeBuild.abi,
    WNativeBuild.bytecode
  )) as WNative__factory

  const mockWBNB = await WNative.connect(owner).deploy()

  const mockTokens: ERC20Mock[] = []
  for (let index = 0; index < numTokens; index++) {
    // Mint pair token
    const mockToken = await ERC20Mock.connect(owner).deploy(
      `Mock Token ${index}`,
      `MOCK${index}`
    )

    await mockToken.connect(owner).mint(tokenBaseBalance)

    mockTokens.push(mockToken)
  }

  return {
    mockWBNB,
    mockTokens,
  }
}
