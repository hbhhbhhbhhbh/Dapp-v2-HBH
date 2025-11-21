// 文件路径: src/lib/contractConfig.ts

/**
 * 智能合约配置
 * 迁移自原 Dapp_副本 项目
 */

// ⚠️ 显式声明为 string 类型，避免 TypeScript 字面量类型推断错误
export const CONTRACT_ADDRESS: string = '0x9d7a7eF24CDd32Af4287BA8DC7f2fd8ADBd65186';

// 务必使用 Dapp_副本 中完整的 ABI，特别是包含 claimLimit 和 tokenIdForSerialHash 的部分
export const CONTRACT_ABI = [
  "function registerProduct(address initialOwner, string calldata serialNumber, string calldata model, uint64 warrantyDurationInSeconds, uint32 claimLimit) external returns (uint256)",
  "function getProductDetails(uint256 tokenId) external view returns (tuple(string serialNumber, string model, address manufacturer, uint64 manufactureTimestamp, uint64 warrantyDuration, uint64 warrantyStart, uint64 warrantyExpiration, uint32 warrantyClaimLimit, uint32 warrantyClaimCount))",
  "function getWarrantyClaim(uint256 claimId) external view returns (tuple(uint256 tokenId, address customer, string issueDescription, uint64 submittedAt, bool processed, bool approved, string serviceNotes, uint64 processedAt))",
  "function submitWarrantyClaim(uint256 tokenId, string calldata issueDescription) external returns (uint256)",
  "function processWarrantyClaim(uint256 claimId, bool approved) external",
  "function recordService(uint256 claimId, string calldata serviceNotes) external",
  "function isWarrantyActive(uint256 tokenId) external view returns (bool)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenIdForSerialHash(bytes32) external view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function MANUFACTURER_ROLE() external view returns (bytes32)",
  "function RETAILER_ROLE() external view returns (bytes32)",
  "function SERVICE_CENTER_ROLE() external view returns (bytes32)",
  
  // Events
  "event ProductRegistered(uint256 indexed tokenId, string serialNumber, string model, address indexed manufacturer, address indexed initialOwner, uint64 timestamp, uint64 warrantyDuration, uint32 claimLimit)",
  "event WarrantyActivated(uint256 indexed tokenId, address indexed customer, uint64 startTime, uint64 expirationTime)",
  "event WarrantyClaimSubmitted(uint256 indexed claimId, uint256 indexed tokenId, address indexed customer, string issueDescription, uint64 submittedAt)",
  "event WarrantyClaimProcessed(uint256 indexed claimId, uint256 indexed tokenId, address indexed serviceCenter, bool approved, uint64 processedAt)",
  "event ServiceRecorded(uint256 indexed tokenId, uint256 indexed claimId, address indexed serviceCenter, string serviceNotes, uint64 serviceDate)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

/**
 * 网络配置
 */
export const NETWORK_CONFIG = {
  localhost: {
    chainId: '0x7a69', // 31337
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
  },
  sepolia: {
    chainId: '0xaa36a7', // 11155111
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
};

export function isContractConfigured(): boolean {
  // 使用 indexOf 替代 startsWith 以获得更好的兼容性
  return CONTRACT_ADDRESS.indexOf('0x') === 0 && CONTRACT_ADDRESS.length === 42;
}

export function getExplorerUrl(txHash: string, network: 'localhost' | 'sepolia' | 'mainnet' = 'sepolia'): string {
  // @ts-ignore
  const config = NETWORK_CONFIG[network];
  if (config && config.blockExplorerUrls) {
    return `${config.blockExplorerUrls[0]}/tx/${txHash}`;
  }
  return '#';
}