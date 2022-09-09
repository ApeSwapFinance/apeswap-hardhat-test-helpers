# ApeSwap Hardhat Test Helper 
[![lint & test](https://github.com/ApeSwapFinance/apeswap-hardhat-test-helpers/actions/workflows/lint-test.yml/badge.svg)](https://github.com/ApeSwapFinance/apeswap-hardhat-test-helpers/actions/workflows/lint-test.yml)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-yellow)](./docs/)
[![License](https://img.shields.io/badge/License-GPLv3-green.svg)](https://www.gnu.org/licenses/gpl-3.0)

Install this package to get access to deployable ApeSwap Mock Farm and DEX for testing with contracts developed with the Hardhat framework.

## Installation

`yarn add -D @ape.swap/hardhat-test-helpers`

## Usage
Refer to the example code below on how to import and use these helpers.

### Deploy a Mock DEX
```typescript
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { dex, farm } from '@ape.swap/hardhat-test-helpers'

async function deployMockDexFixture() {
  const [owner, feeTo, alice] = await ethers.getSigners()

  const { dexFactory, dexRouter, mockWBNB, mockTokens, dexPairs } =
    await dex.deployMockDex(ethers, [owner, feeTo, alice], 5)

  return {
    accounts: { owner, feeTo, alice },
    dexFactory,
    dexRouter,
    mockWBNB,
    mockTokens,
    dexPairs,
  }
}

it("Should have the dexRouter configured properly", async function () {
  const { accounts, dexRouter, dexFactory } = await loadFixture(deployMockDexFixture);

  expect(await dexRouter.factory()).to.equal(dexFactory.address);
});
```

### Deploy a Mock Farm
```typescript
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { dex, farm } from '@ape.swap/hardhat-test-helpers'

async function deployMockFarmFixture() {
  const [owner, feeTo, alice] = await ethers.getSigners()

  const { bananaToken, bananaSplitBar, masterApe } =
    await farm.deployMockFarm(ethers, [owner, feeTo], {})

  return {
    accounts: { owner, feeTo, alice },
    bananaToken,
    bananaSplitBar,
    masterApe,
  }
}

it('Should set the right owner of masterApe', async function () {
  const { accounts, masterApe } = await loadFixture(deployMockFarmFixture)
  expect(await masterApe.owner()).to.equal(accounts.owner.address)
})
```
