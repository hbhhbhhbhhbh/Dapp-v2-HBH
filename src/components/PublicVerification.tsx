// 文件路径: src/components/PublicVerification.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import ProductLifecycleTimeline from './ProductLifecycleTimeline';
import { blockchainService } from '../lib/blockchainService';

export default function PublicVerification() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);
  // 用于存储适配后的产品数据对象
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setSearchResult(null);
    setFoundProduct(null);

    try {
      // 确保连接（对于只读操作，通常需要一个Provider，这里假设 connectWallet 会处理）
      // 在实际生产中，最好在 blockchainService 中初始化一个默认的 JsonRpcProvider
      if (!blockchainService.isConnected()) {
         await blockchainService.connectWallet();
      }

      let tokenId = searchQuery.trim();

      // 1. 如果输入不是纯数字，尝试作为序列号处理
      if (isNaN(Number(tokenId))) {
        console.log("Searching by serial number:", tokenId);
        const id = await blockchainService.getTokenIdBySerial(tokenId);
        if (!id) {
          setSearchResult('not-found');
          setIsLoading(false);
          return;
        }
        tokenId = id;
      }

      // 2. 获取产品详情
      const info = await blockchainService.getProductInfo(tokenId);
      
      // 3. 获取历史事件
      const history = await blockchainService.getProductHistory(tokenId);
      
      // 4. 获取当前所有者
      const currentOwner = await blockchainService.contract.ownerOf(tokenId);

      // 5. 组装成 ProductLifecycleTimeline 组件需要的数据结构
      const productData = {
        tokenId: tokenId,
        serialNumber: info.serialNumber,
        model: info.model,
        manufacturer: info.manufacturer, // 这里可以加一个地址转名称的映射，暂时直接显示地址
        manufacturerAddress: info.manufacturer,
        currentOwner: currentOwner,
        currentOwnerAddress: currentOwner,
        // 将 BigInt 时间戳转换为 ISO 字符串
        registrationDate: new Date(Number(info.manufactureDate) * 1000).toISOString(),
        warrantyStart: info.warrantyStart > 0 ? new Date(Number(info.warrantyStart) * 1000).toISOString() : '',
        warrantyExpiration: info.warrantyExpiration > 0 ? new Date(Number(info.warrantyExpiration) * 1000).toISOString() : '',
        warrantyClaimCount: Number(info.claimCount),
        // 适配历史事件格式
        history: history.map((e: any) => ({
           type: mapEventType(e.type),
           timestamp: new Date(e.timestamp * 1000).toISOString(),
           description: generateEventDescription(e),
           txHash: e.transactionHash,
           from: e.data?.from, // 可选
           to: e.data?.to,     // 可选
           status: e.data?.approved ? 'approved' : (e.type === 'WarrantyClaimProcessed' ? 'rejected' : undefined)
        }))
      };

      setFoundProduct(productData);
      setSearchResult('found');

    } catch (error) {
      console.error("Verification failed:", error);
      setSearchResult('not-found');
    } finally {
      setIsLoading(false);
    }
  };

  // 辅助函数：映射事件类型到 UI 类型
  const mapEventType = (chainType: string) => {
    switch(chainType) {
      case 'ProductRegistered': return 'manufacture';
      case 'Transfer': return 'transfer';
      case 'WarrantyClaimSubmitted': return 'warranty_claim';
      case 'ServiceRecorded': return 'service';
      default: return 'unknown';
    }
  };

  // 辅助函数：生成描述
  const generateEventDescription = (e: any) => {
    if (e.type === 'ProductRegistered') return 'Product registered by manufacturer';
    if (e.type === 'Transfer') return `Transferred from ${e.data.from?.slice(0,6)}... to ${e.data.to?.slice(0,6)}...`;
    if (e.type === 'WarrantyClaimSubmitted') return `Claim: ${e.data.issueDescription}`;
    if (e.type === 'ServiceRecorded') return `Service: ${e.data.serviceNotes}`;
    return e.type;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-12">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl shadow-lg">
            <Shield className="w-16 h-16 text-white" />
          </div>
        </div>
        <h2 className="text-slate-900 text-3xl">Verify Your Product</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Enter a Product ID or Serial Number to verify authenticity and view the complete blockchain history.
        </p>
      </div>

      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Product
          </CardTitle>
          <CardDescription>
            Enter Token ID (e.g. 1) or Serial Number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Product ID or Serial Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-base"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-700"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResult === 'found' && foundProduct && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Alert className="border-green-500 bg-green-50 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Authentic Product Verified!</strong> This product is registered on the blockchain.
            </AlertDescription>
          </Alert>
          
          {/* 复用 UI_UX 中的时间轴组件，数据已适配 */}
          <ProductLifecycleTimeline product={foundProduct} />
        </div>
      )}

      {searchResult === 'not-found' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Product Not Found!</strong> No product matching "{searchQuery}" exists in the registry.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}