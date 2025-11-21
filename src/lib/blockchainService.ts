// 文件路径: src/lib/blockchainService.ts

import { ethers, BigNumber } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, isContractConfigured } from './contractConfig';

export interface WalletInfo { address: string; balance: string; chainId: number; network: string; }
export interface ProductInfo { serialNumber: string; model: string; manufacturer: string; manufactureDate: bigint; warrantyPeriod: bigint; warrantyStart: bigint; warrantyExpiration: bigint; claimLimit: bigint; claimCount: bigint; }
export interface UserRoles { isAdmin: boolean; isManufacturer: boolean; isRetailer: boolean; isServiceCenter: boolean; }
export interface TransactionResult { hash: string; success: boolean; blockNumber?: number; error?: string; }

export class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  public contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  public currentAddress: string = ''; 

  private readonly ROLES = { DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000', MANUFACTURER_ROLE: '', RETAILER_ROLE: '', SERVICE_CENTER_ROLE: '' };

  constructor() {}

  async connectWallet(): Promise<WalletInfo> {
    if (!window.ethereum) throw new Error('请安装 MetaMask');
    if (!isContractConfigured()) throw new Error('合约未配置');
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = this.provider.getSigner();
    
    const address = await this.signer.getAddress();
    this.currentAddress = address;
    
    const balance = await this.provider.getBalance(address);
    const network = await this.provider.getNetwork();
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
    this.initRoles();
    return { address, balance: ethers.utils.formatEther(balance), chainId: network.chainId, network: network.name };
  }

  onAccountChange(callback: (address: string) => void): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          await this.connectWallet();
          callback(accounts[0]);
        } else {
          this.currentAddress = '';
          this.contract = null;
          this.signer = null;
          callback('');
        }
      });
    }
  }

  isConnected(): boolean { return this.contract !== null && this.currentAddress !== ''; }
  private toBigInt(value: any): bigint { return BigInt(value.toString()); }
  private async initRoles() { if (this.contract) { try { this.ROLES.MANUFACTURER_ROLE = await this.contract.MANUFACTURER_ROLE(); this.ROLES.RETAILER_ROLE = await this.contract.RETAILER_ROLE(); this.ROLES.SERVICE_CENTER_ROLE = await this.contract.SERVICE_CENTER_ROLE(); } catch (e) {} } }

  // ... (权限和写入方法保持不变)
  async getUserRoles(address: string): Promise<UserRoles> { try { const [isAdmin, isManufacturer, isRetailer, isServiceCenter] = await Promise.all([this.contract!.hasRole(this.ROLES.DEFAULT_ADMIN_ROLE, address), this.contract!.hasRole(this.ROLES.MANUFACTURER_ROLE, address), this.contract!.hasRole(this.ROLES.RETAILER_ROLE, address), this.contract!.hasRole(this.ROLES.SERVICE_CENTER_ROLE, address)]); return { isAdmin, isManufacturer, isRetailer, isServiceCenter }; } catch { return { isAdmin: false, isManufacturer: false, isRetailer: false, isServiceCenter: false }; } }
  async grantRole(roleName: string, targetAddress: string): Promise<TransactionResult> { try { /* @ts-ignore */ const roleHash = this.ROLES[`${roleName}_ROLE`]; const tx = await this.contract!.grantRole(roleHash, targetAddress); await tx.wait(); return { hash: tx.hash, success: true }; } catch (e: any) { return { hash: '', success: false, error: e.message }; } }
  async getTokenIdBySerial(serialNumber: string): Promise<string | null> { try { const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(serialNumber)); const id = await this.contract!.tokenIdForSerialHash(hash); return id.toString() === '0' ? null : id.toString(); } catch { return null; } }
  async getProductIfOwned(tokenId: string | number, ownerAddress: string): Promise<ProductInfo | null> { try { const currentOwner = await this.contract!.ownerOf(tokenId); if (currentOwner.toLowerCase() !== ownerAddress.toLowerCase()) throw new Error("Not owned"); return await this.getProductInfo(tokenId); } catch (e) { return null; } }
  async registerProduct(initialOwner: string, serialNumber: string, model: string, warrantyDurationInDays: number, claimLimit: number): Promise<TransactionResult> { try { const seconds = BigNumber.from(warrantyDurationInDays).mul(86400); const limit = BigNumber.from(claimLimit); const tx = await this.contract!.registerProduct(initialOwner, serialNumber, model, seconds, limit); await tx.wait(); return { hash: tx.hash, success: true }; } catch (e: any) { return { hash: '', success: false, error: e.message }; } }
  async submitWarrantyClaim(tokenId: string | number, desc: string): Promise<TransactionResult> { try { const tx = await this.contract!.submitWarrantyClaim(tokenId, desc); await tx.wait(); return { hash: tx.hash, success: true }; } catch (e: any) { return { hash: '', success: false, error: e.message }; } }
  async transferProduct(from: string, to: string, tokenId: string | number): Promise<TransactionResult> { try { const tx = await this.contract!["safeTransferFrom(address,address,uint256)"](from, to, tokenId); await tx.wait(); return { hash: tx.hash, success: true }; } catch (e: any) { return { hash: '', success: false, error: e.message }; } }
  async processWarrantyClaim(id: number, approved: boolean): Promise<TransactionResult> { try { const tx = await this.contract!.processWarrantyClaim(id, approved); await tx.wait(); return { hash: tx.hash, success: true }; } catch (e: any) { return { hash: '', success: false, error: e.message }; } }
  async recordService(id: number, notes: string): Promise<TransactionResult> { try { const tx = await this.contract!.recordService(id, notes); await tx.wait(); return { hash: tx.hash, success: true }; } catch (e: any) { return { hash: '', success: false, error: e.message }; } }
  async getProductInfo(tokenId: string | number): Promise<ProductInfo> { const info = await this.contract!.getProductDetails(tokenId); return { serialNumber: info[0], model: info[1], manufacturer: info[2], manufactureDate: this.toBigInt(info[3]), warrantyPeriod: this.toBigInt(info[4]), warrantyStart: this.toBigInt(info[5]), warrantyExpiration: this.toBigInt(info[6]), claimLimit: this.toBigInt(info[7]), claimCount: this.toBigInt(info[8]) }; }
  async getProductsByOwner(ownerAddress: string): Promise<any[]> { if (!this.contract) return []; try { const filter = this.contract.filters.Transfer(null, ownerAddress); const events = await this.contract.queryFilter(filter, 0); const tokenIds = new Set<string>(); events.forEach((e: any) => tokenIds.add(e.args[2].toString())); const products = []; for (const id of tokenIds) { try { const currentOwner = await this.contract.ownerOf(id); if (currentOwner.toLowerCase() === ownerAddress.toLowerCase()) { const details = await this.getProductInfo(id); products.push({ tokenId: id, ...details }); } } catch (e) {} } return products; } catch (e) { return []; } }
  
  // ✅ 1. Customer Portal 专用：只查所有权转移 (Transfer)
  async getProductTransfers(tokenId: string | number): Promise<any[]> {
    if (!this.contract) throw new Error('合约未初始化');
    try {
      const filter = this.contract.filters.Transfer(null, null, tokenId);
      // 强制从 0 开始
      const logs = await this.contract.queryFilter(filter, 0);
      
      const history = await Promise.all(logs.map(async (log) => {
        let timestamp = Math.floor(Date.now() / 1000);
        try { const block = await log.getBlock(); timestamp = block.timestamp; } catch {}
        
        const from = log.args ? log.args[0] : '';
        const to = log.args ? log.args[1] : '';
        const isMint = from === '0x0000000000000000000000000000000000000000';

        return {
          type: isMint ? 'manufacture' : 'transfer',
          timestamp,
          txHash: log.transactionHash,
          description: isMint ? 'Product Registered' : 'Ownership Transferred',
          from,
          to
        };
      }));
      return history.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) { return []; }
  }

  // ✅ 2. Verify 页面专用：查询【完整】历史 (包含 6 种事件)
  async getProductHistory(tokenId: string | number): Promise<any[]> {
    if (!this.contract || !this.provider) throw new Error('合约未初始化');
    try {
      const events: any[] = [];
      
      const processEvents = async (filter: any, type: string, dataMapper: (args: any) => any) => {
        try {
          // ⚠️ 关键：强制从 Block 0 开始
          const logs = await this.contract!.queryFilter(filter, 0);
          for (const log of logs) {
              let timestamp = Math.floor(Date.now() / 1000);
              try { const block = await log.getBlock(); timestamp = block.timestamp; } catch (e) {}
              events.push({ type, timestamp, transactionHash: log.transactionHash, data: dataMapper(log.args) });
          }
        } catch (e) { console.warn(`Failed to fetch ${type}`, e); }
      };

      // A. 注册 (制造商=3, 初始拥有者=4)
      await processEvents(this.contract.filters.ProductRegistered(tokenId), 'ProductRegistered',
          (args) => ({ manufacturer: args[3], initialOwner: args[4] }));
      
      // B. 保修激活
      await processEvents(this.contract.filters.WarrantyActivated(tokenId), 'WarrantyActivated',
          (args) => ({ customer: args[1], expirationTime: args[3] }));
      
      // C. 转移 (过滤铸造)
      try {
        const transferLogs = await this.contract.queryFilter(this.contract.filters.Transfer(null, null, tokenId), 0);
        for (const log of transferLogs) {
          if (log.args && log.args[0] === '0x0000000000000000000000000000000000000000') continue;
          let timestamp = Math.floor(Date.now() / 1000);
          try { const block = await log.getBlock(); timestamp = block.timestamp; } catch (e) {}
          events.push({ type: 'Transfer', timestamp, transactionHash: log.transactionHash, data: { from: log.args[0], to: log.args[1] } });
        }
      } catch(e) {}

      // D. 保修申请
      await processEvents(this.contract.filters.WarrantyClaimSubmitted(null, tokenId), 'WarrantyClaimSubmitted',
        (args) => ({ claimId: args[0], issueDescription: args[3] }));
      
      // E. 保修处理
      await processEvents(this.contract.filters.WarrantyClaimProcessed(null, tokenId), 'WarrantyClaimProcessed',
        (args) => ({ claimId: args[0], approved: args[3] }));

      // F. 服务记录
      await processEvents(this.contract.filters.ServiceRecorded(tokenId), 'ServiceRecorded',
        (args) => ({ serviceNotes: args[3] }));
      
      return events.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) { 
      console.error("Full history fetch failed", error); 
      return []; 
    }
  }

  async getAllWarrantyClaims(): Promise<any[]> {
    try {
      const filter = this.contract!.filters.WarrantyClaimSubmitted();
      const events = await this.contract!.queryFilter(filter, 0);
      return await Promise.all(events.map(async (e: any) => {
         const info = await this.contract!.getWarrantyClaim(e.args[0]);
         const prod = await this.getProductInfo(info[0]);
         // 健壮的属性读取
         const processed = info.processed !== undefined ? info.processed : info[4];
         const approved = info.approved !== undefined ? info.approved : info[5];
         return { 
            claimId: Number(e.args[0]), tokenId: info[0].toString(), model: prod.model, 
            issueDescription: info[2], submittedAt: new Date(Number(info[3])*1000).toISOString(),
            processed: processed, approved: approved, serviceNotes: info[6]
         };
      }));
    } catch { return []; }
  }
}
export const blockchainService = new BlockchainService();