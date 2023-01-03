import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { deployMockFarm } from './farm'
import { ADDRESS_0 } from './constants'

// Setup Farm Contracts
import MasterApeV2Build from './artifacts-apeswap/farm/contracts/MasterApeV2.json'
import MasterApeAdminV2Build from './artifacts-apeswap/farm/contracts/MasterApeAdminV2.json'
import { Contract } from 'ethers'

// Import Contract Types 
import {
  MasterApeV2,
  MasterApeV2__factory,
  MasterApeAdminV2__factory,
} from '../typechain-types'


/**
 * Deploy a mock farm.
 */
export async function deployMockFullFarmV2(
  ethers: HardhatEthersHelpers,
  [owner, feeTo]: [SignerWithAddress, SignerWithAddress],
  {
    initialMint = '25000' + '000000000000000000',
    bananaPerBlock = '10' + '000000000000000000',
  }
) {
  // FIXME: implement
  await deployMockFarm(ethers, [owner, feeTo], { initialMint, bananaPerBlock });

}


/**
 * Deploy a mock farm.
 */
export async function deployMockFarmV2(
  ethers: HardhatEthersHelpers,
  [owner, feeTo]: [SignerWithAddress, SignerWithAddress],
  {
    initialMint = '25000' + '000000000000000000',
    bananaPerBlock = '10' + '000000000000000000',
  }
) {
  await deployMockFarm(ethers, [owner, feeTo], { initialMint, bananaPerBlock })

  const MasterApeV2_Factory = await ethers.getContractFactory(
    MasterApeV2Build.abi,
    MasterApeV2Build.bytecode
  ) as MasterApeV2__factory
  const MasterApeAdminV2_factory = await ethers.getContractFactory(
    MasterApeAdminV2Build.abi,
    MasterApeAdminV2Build.bytecode
  ) as MasterApeAdminV2__factory

  // FIXME: Deploy MAv2
  /**
   * // FIXME: Everything below this needs to be implemented
   * 1. Deploy V1 Farm 
   * 2. Deploy V2 Farm with V1 farm details
   * 3. Add farms to V2
   */
 const masterApeV2 = await MasterApeV2_Factory.connect(owner).deploy(
   
   )
   
  // Setup BananaToken
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
  masterApeV2: MasterApeV2,
  dexPairs: Contract[],
  options?: {
    allocations?: number[]
    depositFeeBp?: number[]
    rewarders?: string[]
  },
) {
  const DEFAULT_ALLOCATION = 100
  const DEFAULT_DEPOSIT_FEE = 0
  const DEFAULT_REWARDER = ADDRESS_0;
  for (let index = 0; index < dexPairs.length; index++) {
    const pair = dexPairs[index];
    const allocation = options?.allocations ? options?.allocations[index] : DEFAULT_ALLOCATION;
    const depositFee = options?.depositFeeBp ? options?.depositFeeBp[index] : DEFAULT_DEPOSIT_FEE;
    const rewarder = options?.rewarders ? options?.rewarders[index] : DEFAULT_REWARDER;
    await masterApeV2.connect(owner).add(allocation, pair.address, false, depositFee, rewarder);
  }
}
