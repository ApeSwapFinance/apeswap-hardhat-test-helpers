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
 * Deploy a mock farm.
 */
export async function deployMockFarmV2(
  ethers: HardhatEthersHelpers,
  [owner, feeTo]: [SignerWithAddress, SignerWithAddress],
  {
    initialMint = '25000' + '000000000000000000',
    bananaPerBlock = '10' + '000000000000000000',
    bananaPerSecond = '3' + '33333333333333333',
  }
) {
  const MasterApeV2_Factory = (await ethers.getContractFactory(
    MasterApeV2Build.abi,
    MasterApeV2Build.bytecode
  )) as MasterApeV2__factory
  const MasterApeAdminV2_factory = (await ethers.getContractFactory(
    MasterApeAdminV2Build.abi,
    MasterApeAdminV2Build.bytecode
  )) as MasterApeAdminV2__factory

  const { bananaToken, masterApe } = await deployMockFarm(
    ethers,
    [owner, feeTo],
    {
      initialMint,
      bananaPerBlock,
    }
  )

  const { mockWBNB, mockTokens } = await deployMockTokens(ethers, [owner], {
    numTokens: 1,
    tokenBaseBalance: ether('0'),
  })
  await addPoolsToFarmV1([owner], masterApe, mockTokens)

  const masterApeV2 = await MasterApeV2_Factory.connect(owner).deploy(
    bananaToken.address,
    masterApe.address,
    1,
    bananaPerSecond
  ) 

  await mockTokens[0].connect(owner).approve(masterApeV2.address, ether('2000'))

  await masterApe.set(1, 1, true)
  await masterApe.transferOwnership(masterApeV2.address)
  await masterApeV2.connect(owner).initialize()
  await masterApeV2.connect(owner).setFeeAddress(feeTo.address)

  return { bananaToken, masterApe, masterApeV2 }
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
) {
  const DEFAULT_ALLOCATION = 100
  const DEFAULT_DEPOSIT_FEE = 0
  const DEFAULT_REWARDER = ADDRESS_0
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
      .add(allocation, pair.address, false, depositFee, rewarder)
  }
}
