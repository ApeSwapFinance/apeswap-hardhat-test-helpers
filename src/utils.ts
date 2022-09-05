import { utils } from 'ethers'

export const ether = (value: string) => utils.parseUnits(value, 'ether');