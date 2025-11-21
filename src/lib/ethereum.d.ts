/**
 * TypeScript 类型声明 - MetaMask 和 Ethereum Provider
 */

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on?: (eventName: string, handler: (...args: any[]) => void) => void;
    removeListener?: (eventName: string, handler: (...args: any[]) => void) => void;
    selectedAddress?: string | null;
    chainId?: string;
  };
}

declare module 'ethers' {
  export * from 'ethers';
}
