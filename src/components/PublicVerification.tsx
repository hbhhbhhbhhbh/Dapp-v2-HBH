// 文件路径: src/components/PublicVerification.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import ProductLifecycleTimeline from './ProductLifecycleTimeline';
import { blockchainService } from '../lib/blockchainService';

interface PublicVerificationProps {
  defaultId?: string;
}

export default function PublicVerification({ defaultId = '' }: PublicVerificationProps) {
  const [searchQuery, setSearchQuery] = useState(defaultId);
  const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (defaultId) {
      setSearchQuery(defaultId);
      handleSearch(defaultId);
    }
  }, [defaultId]);

  const handleSearch = async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query?.trim()) return;
    
    setIsLoading(true);
    setSearchResult(null);
    setFoundProduct(null);

    try {
      if (!blockchainService.isConnected()) {
         await blockchainService.connectWallet();
      }

      const input = query.trim();
      let targetTokenId: string | null = null;

      // ✅ 逻辑升级：优先尝试作为序列号查询
      // 这样即使用户输入的是数字 "123456"，我们也会先看有没有这个序列号的产品
      const idFromSerial = await blockchainService.getTokenIdBySerial(input);
      
      if (idFromSerial) {
        console.log(`Search '${input}' matched Serial Number -> Token ID ${idFromSerial}`);
        targetTokenId = idFromSerial;
      } 
      // 如果不是序列号，且输入本身是数字，则尝试作为 Token ID
      else if (!isNaN(Number(input))) {
        console.log(`Search '${input}' treated as Token ID`);
        targetTokenId = input;
      }

      if (!targetTokenId) {
        console.warn("Input is not a valid Serial Number and not a Number ID");
        setSearchResult('not-found');
        setIsLoading(false);
        return;
      }

      // 获取详情
      const info = await blockchainService.getProductInfo(targetTokenId);
      // 获取全量历史 (包含铸造、维修等)
      const history = await blockchainService.getProductHistory(targetTokenId);
      const currentOwner = await blockchainService.contract!.ownerOf(targetTokenId);

      const productData = {
        tokenId: targetTokenId,
        serialNumber: info.serialNumber,
        model: info.model,
        manufacturer: info.manufacturer, 
        manufacturerAddress: info.manufacturer,
        currentOwner: currentOwner,
        currentOwnerAddress: currentOwner,
        registrationDate: new Date(Number(info.manufactureDate) * 1000).toISOString(),
        warrantyStart: info.warrantyStart > 0 ? new Date(Number(info.warrantyStart) * 1000).toISOString() : '',
        warrantyExpiration: info.warrantyExpiration > 0 ? new Date(Number(info.warrantyExpiration) * 1000).toISOString() : '',
        warrantyClaimCount: Number(info.claimCount),
        history: history.map((e: any) => ({
           type: mapEventType(e.type),
           timestamp: new Date(e.timestamp * 1000).toISOString(),
           description: generateEventDescription(e),
           txHash: e.transactionHash,
           from: e.data?.from,
           to: e.data?.to,
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

  const mapEventType = (chainType: string) => {
    switch(chainType) {
      case 'ProductRegistered': return 'manufacture';
      case 'Transfer': return 'transfer';
      case 'WarrantyClaimSubmitted': return 'warranty_claim';
      case 'ServiceRecorded': return 'service';
      default: return 'unknown';
    }
  };

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
          Enter a <strong>Product ID</strong> (e.g. 1) or <strong>Serial Number</strong> (e.g. SN-1234) to verify authenticity.
        </p>
      </div>

      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Product
          </CardTitle>
          <CardDescription>
            Try entering the Serial Number first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Product ID or Serial Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-base"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={() => handleSearch()} 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
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