import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ether } from '../src/utils'
import { dex } from '../src';

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

// Setup Token Contracts
import ERC20MockBuild from '../src/artifacts-apeswap/token/contracts/ERC20Mock.json';

// Import Contract Types
import { ERC20Mock__factory } from '../typechain-types'

describe("ApeFactory", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMockDexFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, feeTo, alice] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory(
        ERC20MockBuild.abi,
        ERC20MockBuild.bytecode
      ) as ERC20Mock__factory

    const {
        dexFactory,
        dexRouter,
        mockWBNB,
        mockTokens,
        dexPairs,
      } = await dex.deployMockDex(ethers, [owner, feeTo, alice], 5); // accounts passed will be used in the deployment
  
      const mockToken0 = await ERC20Mock.connect(owner).deploy('Mock Token 0', 'MOCK0');
      await mockToken0.connect(owner).mint(ether('100'));
      const mockToken1 = await ERC20Mock.connect(owner).deploy('Mock Token 1', "MOCK1");
      await mockToken1.connect(owner).mint(ether('100'));

    return { 
        dexFactory,
        dexRouter,
        mockWBNB,
        mockTokens,
        dexPairs,
        mockToken0,
        mockToken1,
        accounts: {
            owner,
            feeTo, 
            alice
        }
    };
  }

  it('should have proper pair length', async () => {
    const mockDex = await loadFixture(deployMockDexFixture);
    expect((await mockDex.dexFactory.allPairsLength()).toString()).to.equal('5');
  });

  it('should have properly deployed router', async () => {
    const mockDex = await loadFixture(deployMockDexFixture);
    expect(await mockDex.dexRouter.factory()).to.equal(mockDex.dexFactory.address);
  });

  it('should get quote', async () => {
    const mockDex = await loadFixture(deployMockDexFixture);
    const quote = await mockDex.dexRouter.quote(ether('1'), ether('100'), ether('100'));
    expect(quote.toString()).to.not.equal('0');
  });

  it('should get amount out with values', async () => {
    const mockDex = await loadFixture(deployMockDexFixture);
    const getAmountsOut = await mockDex.dexRouter.getAmountOut(ether('1'), ether('100'), ether('100'));
    expect(getAmountsOut).to.be.greaterThan(0);
  });

  it('should get amounts out with path', async () => {
    const mockDex = await loadFixture(deployMockDexFixture);
    const getAmountsOut = await mockDex.dexRouter.getAmountsOut(ether('.0005'), [mockDex.mockTokens[0].address, mockDex.mockWBNB.address]);
    expect(getAmountsOut[0]).to.be.greaterThan(0)
  });

  it('should add liquidity', async () => {
    const mockDex = await loadFixture(deployMockDexFixture);
    const owner = mockDex.accounts.owner;
    await mockDex.mockToken0.connect(owner).approve(mockDex.dexRouter.address, ether('1'));
    await mockDex.mockToken1.connect(owner).approve(mockDex.dexRouter.address, ether('1'));

    await mockDex.dexRouter.connect(owner).addLiquidity(
      mockDex.mockToken0.address, // tokenA
      mockDex.mockToken1.address, // tokenB
      ether('1'), // amountADesired
      ether('1'), // amountBDesired
      0, // amountAMin
      0, // amountBMin
      owner.address, // to
      '9999999999', // deadline
    );
  });
});
