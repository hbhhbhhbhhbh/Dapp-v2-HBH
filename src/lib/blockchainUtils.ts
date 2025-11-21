/**
 * 区块链工具函数
 * 
 * 提供常用的辅助函数来处理区块链数据
 */

import { ProductEvent } from './blockchainService';

// ============================================================================
// 地址处理
// ============================================================================

/**
 * 截短以太坊地址（例如：0x1234...5678）
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (!address.startsWith('0x')) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 验证以太坊地址格式
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 比较两个地址是否相同（不区分大小写）
 */
export function isSameAddress(addr1: string, addr2: string): boolean {
  return addr1.toLowerCase() === addr2.toLowerCase();
}

// ============================================================================
// 时间处理
// ============================================================================

/**
 * 将时间戳转换为可读日期
 */
export function formatTimestamp(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 将时间戳转换为相对时间（例如："3天前"）
 */
export function formatRelativeTime(timestamp: number | bigint): string {
  const now = Date.now();
  const time = Number(timestamp) * 1000;
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}年前`;
  if (months > 0) return `${months}个月前`;
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

/**
 * 计算保修剩余时间
 */
export function calculateWarrantyRemaining(expirationDate: Date): {
  expired: boolean;
  days: number;
  text: string;
} {
  const now = new Date();
  const diff = expirationDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      expired: true,
      days: 0,
      text: '已过期',
    };
  }

  if (days === 0) {
    return {
      expired: false,
      days: 0,
      text: '今天到期',
    };
  }

  if (days < 30) {
    return {
      expired: false,
      days,
      text: `剩余 ${days} 天`,
    };
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return {
      expired: false,
      days,
      text: `剩余 ${months} 个月`,
    };
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return {
    expired: false,
    days,
    text: `剩余 ${years} 年 ${remainingMonths} 个月`,
  };
}

// ============================================================================
// 交易哈希处理
// ============================================================================

/**
 * 截短交易哈希
 */
export function shortenTxHash(hash: string, chars = 6): string {
  if (!hash) return '';
  if (!hash.startsWith('0x')) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * 获取区块浏览器链接
 */
export function getExplorerLink(
  hash: string,
  type: 'tx' | 'address' | 'block',
  network: 'localhost' | 'sepolia' | 'mainnet' = 'sepolia'
): string {
  const explorers = {
    localhost: '',
    sepolia: 'https://sepolia.etherscan.io',
    mainnet: 'https://etherscan.io',
  };

  const baseUrl = explorers[network];
  if (!baseUrl) return '';

  return `${baseUrl}/${type}/${hash}`;
}

// ============================================================================
// 事件处理
// ============================================================================

/**
 * 将事件类型转换为中文描述
 */
export function getEventTypeText(type: ProductEvent['type']): string {
  const typeMap: Record<ProductEvent['type'], string> = {
    ProductRegistered: '产品注册',
    Transfer: '所有权转移',
    WarrantyClaimSubmitted: '保修申请',
    WarrantyClaimProcessed: '保修处理',
    ServiceRecorded: '服务记录',
  };
  return typeMap[type] || type;
}

/**
 * 获取事件图标
 */
export function getEventIcon(type: ProductEvent['type']): string {
  const iconMap: Record<ProductEvent['type'], string> = {
    ProductRegistered: '🏭',
    Transfer: '🔄',
    WarrantyClaimSubmitted: '📝',
    WarrantyClaimProcessed: '✅',
    ServiceRecorded: '🔧',
  };
  return iconMap[type] || '📄';
}

/**
 * 获取事件颜色
 */
export function getEventColor(type: ProductEvent['type']): string {
  const colorMap: Record<ProductEvent['type'], string> = {
    ProductRegistered: 'bg-blue-100 text-blue-800 border-blue-200',
    Transfer: 'bg-purple-100 text-purple-800 border-purple-200',
    WarrantyClaimSubmitted: 'bg-orange-100 text-orange-800 border-orange-200',
    WarrantyClaimProcessed: 'bg-green-100 text-green-800 border-green-200',
    ServiceRecorded: 'bg-teal-100 text-teal-800 border-teal-200',
  };
  return colorMap[type] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * 生成事件描述文本
 */
export function generateEventDescription(event: ProductEvent): string {
  switch (event.type) {
    case 'ProductRegistered':
      return `产品 ${event.data.model} (${event.data.serialNumber}) 由 ${shortenAddress(event.data.manufacturer)} 注册`;
    
    case 'Transfer':
      return `产品从 ${shortenAddress(event.data.from)} 转移至 ${shortenAddress(event.data.to)}`;
    
    case 'WarrantyClaimSubmitted':
      return `${shortenAddress(event.data.customer)} 提交保修申请: ${event.data.issueDescription}`;
    
    case 'WarrantyClaimProcessed':
      return `保修申请 ${event.data.approved ? '已批准' : '已拒绝'}`;
    
    case 'ServiceRecorded':
      return `服务记录: ${event.data.serviceNotes}`;
    
    default:
      return '未知事件';
  }
}

// ============================================================================
// 数据格式化
// ============================================================================

/**
 * 格式化 Gas 费用
 */
export function formatGas(gasUsed: string | bigint): string {
  const gas = Number(gasUsed);
  if (gas < 1000) return `${gas} gas`;
  if (gas < 1000000) return `${(gas / 1000).toFixed(1)}K gas`;
  return `${(gas / 1000000).toFixed(2)}M gas`;
}

/**
 * 格式化 ETH 金额
 */
export function formatEth(amount: string | number, decimals = 4): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toFixed(decimals)} ETH`;
}

/**
 * 将 BigInt 转换为普通数字（适用于 Token ID 等）
 */
export function bigIntToNumber(value: bigint): number {
  return Number(value);
}

// ============================================================================
// 错误处理
// ============================================================================

/**
 * 解析区块链错误消息
 */
export function parseBlockchainError(error: any): string {
  if (!error) return '未知错误';

  // 用户拒绝交易
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return '用户取消了交易';
  }

  // 余额不足
  if (error.message?.includes('insufficient funds')) {
    return '余额不足，无法支付 Gas 费用';
  }

  // 合约执行失败
  if (error.message?.includes('execution reverted')) {
    // 尝试提取 revert 原因
    const match = error.message.match(/reverted with reason string '(.+?)'/);
    if (match) {
      return `交易失败: ${match[1]}`;
    }
    return '合约执行失败';
  }

  // 网络错误
  if (error.message?.includes('network')) {
    return '网络连接错误，请检查您的网络';
  }

  // Gas 估算失败
  if (error.message?.includes('gas')) {
    return 'Gas 费用估算失败，请检查交易参数';
  }

  // 返回原始错误消息
  return error.message || error.toString();
}

/**
 * 检查是否为 MetaMask 错误
 */
export function isMetaMaskError(error: any): boolean {
  return error?.code === 4001 || error?.code === 'ACTION_REJECTED';
}

// ============================================================================
// 网络检查
// ============================================================================

/**
 * 获取网络名称
 */
export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    31337: 'Hardhat Local',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
  };
  return networks[chainId] || `Unknown Network (${chainId})`;
}

/**
 * 检查是否为测试网络
 */
export function isTestnet(chainId: number): boolean {
  return [5, 11155111, 31337, 80001].includes(chainId);
}

// ============================================================================
// 数据验证
// ============================================================================

/**
 * 验证 Token ID 格式
 */
export function isValidTokenId(tokenId: string | number): boolean {
  const id = typeof tokenId === 'string' ? parseInt(tokenId) : tokenId;
  return !isNaN(id) && id > 0;
}

/**
 * 验证保修期（年）
 */
export function isValidWarrantyPeriod(years: number): boolean {
  return years > 0 && years <= 10;
}

// ============================================================================
// 本地存储
// ============================================================================

/**
 * 保存最近连接的钱包地址
 */
export function saveLastConnectedAddress(address: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastConnectedAddress', address);
  }
}

/**
 * 获取最近连接的钱包地址
 */
export function getLastConnectedAddress(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('lastConnectedAddress');
  }
  return null;
}

/**
 * 清除已保存的钱包地址
 */
export function clearLastConnectedAddress(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lastConnectedAddress');
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * EXAMPLE: 使用工具函数
 * 
 * import { 
 *   shortenAddress, 
 *   formatTimestamp, 
 *   calculateWarrantyRemaining,
 *   parseBlockchainError 
 * } from './lib/blockchainUtils';
 * 
 * // 截短地址
 * const short = shortenAddress('0x1234567890123456789012345678901234567890');
 * console.log(short); // "0x1234...7890"
 * 
 * // 格式化时间
 * const date = formatTimestamp(1699999999);
 * console.log(date); // "2023/11/15 03:46:39"
 * 
 * // 计算保修剩余时间
 * const expiration = new Date('2025-12-31');
 * const warranty = calculateWarrantyRemaining(expiration);
 * console.log(warranty.text); // "剩余 1 年 2 个月"
 * 
 * // 处理错误
 * try {
 *   await blockchainService.submitWarrantyClaim(1001, 'issue');
 * } catch (error) {
 *   const errorMsg = parseBlockchainError(error);
 *   alert(errorMsg);
 * }
 */
