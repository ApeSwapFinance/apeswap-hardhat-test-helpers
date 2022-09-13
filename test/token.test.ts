import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { token, utils } from '../src';

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


describe("Token Tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMockTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, feeTo, alice] = await ethers.getSigners();

    const {
      mockWBNB,
      mockTokens
    } = await token.deployMockTokens(ethers, [owner], {}); // accounts passed will be used in the deployment
    

    return { 
      mockWBNB,
      mockTokens,
        accounts: {
            owner,
            feeTo,
            alice
        }
    };
  }

  it('should have proper total supply', async () => {
    const { mockTokens } = await loadFixture(deployMockTokenFixture);
    // _mint(msg.sender, 2e3 ether) in constructor
    expect(await mockTokens[0].totalSupply()).to.equal(utils.ether('3000'));
  });
});
