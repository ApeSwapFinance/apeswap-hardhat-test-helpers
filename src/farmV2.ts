import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { HardhatEthersHelpers } from 'hardhat/types'
import { deployMockFarm, addPoolsToFarm as addPoolsToFarmV1 } from './farm'
import { ADDRESS_0 } from './constants'
import { ether } from './utils'

// Setup Farm Contracts
import MasterApeV2Build from './artifacts-apeswap/farm/contracts/MasterApeV2.json'
import MasterApeAdminV2Build from './artifacts-apeswap/farm/contracts/MasterApeAdminV2.json'
import { BigNumber, Contract } from 'ethers'

// Import Contract Types
import {
  MasterApeV2,
  MasterApeV2__factory,
  MasterApeAdminV2__factory,
  BananaToken,
} from '../typechain-types'
import { deployMockTokens } from './token'

/**
 * Get MasterApeV2 and MasterApeAdminV2 hardhat contract factories
 */
export async function getMasterApeV2_ContractFactories(ethers: HardhatEthersHelpers) {
  const MasterApeV2_Factory = (await ethers.getContractFactory(
    MasterApeV2Build.abi,
    MasterApeV2Build.bytecode
  )) as MasterApeV2__factory
  const MasterApeAdminV2_factory = (await ethers.getContractFactory(
    MasterApeAdminV2Build.abi,
    MasterApeAdminV2Build.bytecode
  )) as MasterApeAdminV2__factory

  return { MasterApeV2_Factory, MasterApeAdminV2_factory }
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
    bananaPerSecond = '3' + '33333333333333333',
    numTokens = 3,
  }
) {
  const { MasterApeV2_Factory, MasterApeAdminV2_factory } = await getMasterApeV2_ContractFactories(ethers);
  /**
   * Deploy MasterApeV1 Farm
   */
  const { bananaToken, masterApe } = await deployMockFarm(
    ethers,
    [owner, feeTo],
    {
      initialMint,
      bananaPerBlock,
    }
  )
  const { mockWBNB, mockTokens } = await deployMockTokens(ethers, [owner], {
    numTokens,
    tokenBaseBalance: ether('1'),
  })
  const poolIdsV1 = await addPoolsToFarmV1([owner], masterApe, mockTokens);
  const masterToken = mockTokens[0];
  const masterPid = poolIdsV1[masterToken.address];
  /**
   * Deploy MasterApeV2 Farm
   */
  const masterApeV2 = await MasterApeV2_Factory.connect(owner).deploy(
    bananaToken.address,
    masterApe.address,
    masterPid, // MasterPid
    0, // Starting bananaPerSecond at 0
  )
  // Finalize setup
  await masterToken.connect(owner).approve(masterApeV2.address, ether('1000000'))
  await masterApeV2.connect(owner).initialize();
  await masterApeV2.connect(owner).setFeeAddress(feeTo.address)
  await masterApeV2.connect(owner).updateEmissionRate(bananaPerSecond, true);

  await masterApe.transferOwnership(masterApeV2.address)
  
  return { bananaToken, masterApe, masterApeV2, masterToken, masterPid, mockWBNB, mockTokens }
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
  }
): Promise<Record<string, number>> {
  const DEFAULT_ALLOCATION = 100
  const DEFAULT_DEPOSIT_FEE = 0
  const DEFAULT_REWARDER = ADDRESS_0
  const poolIds: Record<string, number> = {}
  let nextPid = (await masterApeV2.poolLength()).toNumber();
  for (let index = 0; index < dexPairs.length; index++) {
    const pair = dexPairs[index]
    const allocation = options?.allocations
      ? options?.allocations[index]
      : DEFAULT_ALLOCATION
    const depositFee = options?.depositFeeBp
      ? options?.depositFeeBp[index]
      : DEFAULT_DEPOSIT_FEE
    const rewarder = options?.rewarders
      ? options?.rewarders[index]
      : DEFAULT_REWARDER
    await masterApeV2
      .connect(owner)
      .add(allocation, pair.address, false, depositFee, rewarder);
    poolIds[pair.address] = nextPid;
    nextPid++;
  }
  return poolIds;
}
