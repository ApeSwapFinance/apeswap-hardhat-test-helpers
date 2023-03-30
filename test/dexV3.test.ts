import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ether } from '../src/utils'
import { dexV3 } from '../src'

/**
 * hardhat-chai-matchers reference
 * https://hardhat.org/hardhat-chai-matchers/docs/reference
 *
 * The @nomicfoundation/hardhat-chai-matchers plugin is meant to be a drop-in replacement
 * for the @nomiclabs/hardhat-waffle plugin
 *
 * https://hardhat.org/hardhat-chai-matchers/docs/migrate-from-waffle
 *
 * VSCode + Hardhat:
 * https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity
 */
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
// @ts-ignore
import { ethers } from 'hardhat'

// Setup Token Contracts
import ERC20MockBuild from '../src/artifacts-apeswap/token/contracts/ERC20Mock.json'

// Import Contract Types
import { ERC20Mock__factory } from '../typechain-types'

describe('V3 DEX', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMockDexFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, feeTo, alice] = await ethers.getSigners()

    const ERC20Mock = (await ethers.getContractFactory(
      ERC20MockBuild.abi,
      ERC20MockBuild.bytecode
    )) as ERC20Mock__factory

    const {
      dexFactory,
      dexRouter,
      positionDescriptor,
      positionManager,
      mockWBNB,
      mockTokens,
    } = await dexV3.deployMockDex(ethers, [owner, feeTo, alice], 2) // accounts passed will be used in the deployment

    return {
      dexFactory,
      dexRouter,
      positionDescriptor,
      positionManager,
      mockWBNB,
      mockTokens,
      accounts: {
        owner,
        feeTo,
        alice,
      },
    }
  }

  it('should have pair', async () => {
    const mockDex = await loadFixture(deployMockDexFixture)
    expect(
      (
        await mockDex.dexFactory.getPool(
          mockDex.mockTokens[0].address,
          mockDex.mockWBNB.address,
          500
        )
      ).toString()
    ).to.not.equal('0x0000000000000000000000000000000000000000')
  })

  it('should swap', async () => {
    const mockDex = await loadFixture(deployMockDexFixture)
    const token0 = mockDex.mockTokens[0]
    const mockWBNB = mockDex.mockWBNB
    const account = mockDex.accounts.owner.address

    const bnbBalanceBefore = await mockWBNB.balanceOf(account)

    await token0.approve(mockDex.dexRouter.address, ether('0.01'))
    await mockDex.dexRouter.exactInputSingle({
      tokenIn: token0.address,
      tokenOut: mockWBNB.address,
      fee: 500,
      recipient: account,
      deadline: '99999999999999',
      amountIn: ether('0.01'),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    })

    const bnbBalanceAfter = await mockWBNB.balanceOf(account)
    expect(Number(bnbBalanceAfter)).to.be.gt(
      Number(bnbBalanceBefore),
      'Did not receive any bnb on swap'
    )
  })
})
