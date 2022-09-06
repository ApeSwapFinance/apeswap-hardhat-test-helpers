import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { farm } from '../src';

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
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
// @ts-ignore
import { ethers } from "hardhat";


describe("MasterApe", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMockFarm() {
    // Contracts are deployed using the first signer/account by default
    const [owner, feeTo, alice] = await ethers.getSigners();

    const {
      bananaToken,
      bananaSplitBar,
      masterApe,
    } = await farm.deployMockFarm(ethers, [owner, feeTo], {}); // accounts passed will be used in the deployment
    

    return { 
      bananaToken,
      bananaSplitBar,
      masterApe,
        accounts: {
            owner,
            feeTo,
            alice
        }
    };
  }

  it('should have proper pool length', async () => {
    const mockFarm = await loadFixture(deployMockFarm);
    expect((await mockFarm.masterApe.poolLength()).toString()).to.equal('1');
  });
});
