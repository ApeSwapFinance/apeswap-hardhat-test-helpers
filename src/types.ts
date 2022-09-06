import ethers from 'ethers'

interface Libraries {
    [libraryName: string]: string;
}

interface FactoryOptions {
    signer?: ethers.Signer;
    libraries?: Libraries;
}

// https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-ethers#helpers
export interface HardhatEthersHelpers {
    getContractFactory(name: string, signer?: ethers.Signer): Promise<ethers.ContractFactory>;

    getContractFactory(name: string, factoryOptions: FactoryOptions): Promise<ethers.ContractFactory>;

    getContractFactory(abi: any[], bytecode: ethers.utils.BytesLike, signer?: ethers.Signer): Promise<ethers.ContractFactory>;

    getContractAt(name: string, address: string, signer?: ethers.Signer): Promise<ethers.Contract>;

    getContractAt(abi: any[], address: string, signer?: ethers.Signer): Promise<ethers.Contract>;

    getSigners(): Promise<ethers.Signer[]>;

    getSigner(address: string): Promise<ethers.Signer>;

    getImpersonatedSigner(address: string): Promise<ethers.Signer>;

    // getContractFactoryFromArtifact(artifact: Artifact, signer?: ethers.Signer): Promise<ethers.ContractFactory>;

    // getContractFactoryFromArtifact(artifact: Artifact, factoryOptions: FactoryOptions): Promise<ethers.ContractFactory>;

    // getContractAtFromArtifact(artifact: Artifact, address: string, signer?: ethers.Signer): Promise<ethers.Contract>;
}