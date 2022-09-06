import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'

// Setup Farm Contracts
import BananaTokenBuild from './artifacts-apeswap/farm/contracts/BananaToken.json'
import BananaSplitBarBuild from './artifacts-apeswap/farm/contracts/BananaSplitBar.json'
import MasterApeBuild from './artifacts-apeswap/farm/contracts/MasterApe.json'
import { Contract } from 'ethers'

// Import Contract Types 
import {
  BananaToken__factory,
  BananaSplitBar__factory, 
  MasterApe__factory, 
  MasterApe,
} from '../typechain-types'

/**
 * Deploy a mock farm.
 */
export async function deployMockFarm(
  ethers: HardhatEthersHelpers,
  [owner, feeTo]: [SignerWithAddress, SignerWithAddress],
  {
    initialMint = '25000' + '000000000000000000',
    bananaPerBlock = '10' + '000000000000000000',
  }
) {
  const BananaToken = await ethers.getContractFactory(
    BananaTokenBuild.abi,
    BananaTokenBuild.bytecode
  ) as BananaToken__factory
  const BananaSplitBar = await ethers.getContractFactory(
    BananaSplitBarBuild.abi,
    BananaSplitBarBuild.bytecode
  ) as BananaSplitBar__factory
  const MasterApe = await ethers.getContractFactory(
    MasterApeBuild.abi,
    MasterApeBuild.bytecode
  ) as MasterApe__factory
  // Setup BananaToken
  const bananaToken = await BananaToken.connect(owner).deploy()

  await bananaToken.mint(owner.address, initialMint);

  // Setup BananaSplitBar
  const bananaSplitBar = await BananaSplitBar.connect(owner).deploy(bananaToken.address)

  // Setup MasterApe
  const masterApe = await MasterApe.connect(owner).deploy(
    bananaToken.address,
    bananaSplitBar.address,
    feeTo.address, // Dev fee getter
    bananaPerBlock, // BANANA per block
    0, // Starting block number
    1, // multiplier
  )

  await bananaToken
    .connect(owner)
    .transferOwnership(masterApe.address)
  await bananaSplitBar.connect(owner).transferOwnership(masterApe.address)

  return {
    bananaToken,
    bananaSplitBar,
    masterApe,
  }
}

/**
 * Add tokens to farms with an allocation of 100.
 */
export async function addPoolsToFarm(
  [owner]: [SignerWithAddress],
  masterApe: MasterApe,
  dexPairs: Contract[]
) {
  const BASE_ALLOCATION = 100
  for (const dexPair of dexPairs) {
    await masterApe.connect(owner).add(BASE_ALLOCATION, dexPair.address, false)
  }
}
