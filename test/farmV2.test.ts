import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { farmV2 } from '../src'
import { ether } from '../src/utils'

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
import { MasterApeAdminV2__factory } from '../typechain-types'
import { deployMockTokens } from '../src/token'

describe('MasterApeV2', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMockFarmFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, feeTo, alice] = await ethers.getSigners()

    const { bananaToken, masterApe, masterApeV2 } =
      await farmV2.deployMockFarmV2(ethers, [owner, feeTo], {}) // accounts passed will be used in the deployment

    return {
      bananaToken,
      masterApe,
      masterApeV2,
      accounts: {
        owner,
        feeTo,
        alice,
      },
    }
  }

  it('Should earn banana rewards', async () => {
    const mockFarm = await loadFixture(deployMockFarmFixture)
    const { mockWBNB, mockTokens } = await deployMockTokens(
      ethers,
      [mockFarm.accounts.alice],
      {
        numTokens: 1,
      }
    )
    expect((await mockFarm.masterApeV2.poolLength()).toString()).to.equal('0')
    await farmV2.addPoolsToFarm(
      [mockFarm.accounts.owner],
      mockFarm.masterApeV2,
      [mockTokens[0]]
    )
    expect((await mockFarm.masterApeV2.poolLength()).toString()).to.equal('1')

    const beforeBalance = await mockFarm.bananaToken.balanceOf(
      mockFarm.accounts.alice.address
    )

    await mockTokens[0]
      .connect(mockFarm.accounts.alice)
      .approve(mockFarm.masterApeV2.address, ether('1'))

    console.log('it reaches here')
    await mockFarm.masterApeV2
      .connect(mockFarm.accounts.alice)
      .deposit(0, ether('1'))
    console.log('it does NOT reach here')

    const bananaRewards = await mockFarm.masterApeV2.availableBananaRewards()
    expect(bananaRewards).to.be.gt(0)

    await mockFarm.masterApeV2
      .connect(mockFarm.accounts.alice)
      .withdraw(0, ether('1'))

    const afterBalance = await mockFarm.bananaToken.balanceOf(
      mockFarm.accounts.alice.address
    )

    expect(Number(afterBalance)).to.be.gt(Number(beforeBalance))
  })

  function delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
  }
})
