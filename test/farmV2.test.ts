import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers'
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

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

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
    const { masterApe, masterApeV2, bananaToken, accounts } = await loadFixture(deployMockFarmFixture)
    expect((await masterApeV2.poolLength()).toString()).to.equal('1')
    // Setup MAv2 Pools
    const { mockWBNB, mockTokens } = await deployMockTokens(
      ethers,
      [accounts.alice],
      {
        numTokens: 1,
      }
    )
    const depositTokenV2 = mockTokens[0];
    await farmV2.addPoolsToFarm(
      [accounts.owner],
      masterApeV2,
      [depositTokenV2]
    )
    expect((await masterApeV2.poolLength()).toString()).to.equal('2')
    // Check that rewards are flowing into MAv2
    await masterApeV2.harvestFromMasterApe();
    const bananaRewards = (await masterApeV2.availableBananaRewards())
    expect(bananaRewards).to.be.gt(0);
    // Test pool deposits and rewards
    const beforeBalance = await bananaToken.balanceOf(
      accounts.alice.address
    )
    await depositTokenV2
      .connect(accounts.alice)
      .approve(masterApeV2.address, ether('1'))
    await masterApeV2
      .connect(accounts.alice)
      .deposit(1, ether('1'))

    await mine(10);

    await masterApeV2
      .connect(accounts.alice)
      .withdraw(1, ether('1'))
    const afterBalance = await bananaToken.balanceOf(
      accounts.alice.address
    )
    expect(Number(afterBalance)).to.be.gt(Number(beforeBalance))
  })
})
