// 文件路径: src/components/CustomerPortal.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { User, Wallet, Shield, History, ArrowLeftRight } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { blockchainService } from '../lib/blockchainService';
import ProductLifecycleTimeline from './ProductLifecycleTimeline';

export default function CustomerPortal() {
  // ✅ 关键修改：初始化时直接读取 Service 状态
  const [address, setAddress] = useState(blockchainService.currentAddress);
  const [isConnected, setIsConnected] = useState(blockchainService.isConnected());
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [actionType, setActionType] = useState<'warranty' | 'resale' | 'ownership' | null>(null);
  const [warrantyDesc, setWarrantyDesc] = useState('');
  const [resaleAddress, setResaleAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ✅ 逻辑优化：如果已连接，直接加载产品，不再重新连接钱包
    if (blockchainService.isConnected()) {
      setAddress(blockchainService.currentAddress);
      setIsConnected(true);
      loadMyProducts(blockchainService.currentAddress);
    } else {
      // 尝试恢复连接 (可选，或等待用户点击)
      // connectWallet(); 
    }
  }, []);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const info = await blockchainService.connectWallet();
      setAddress(info.address);
      setIsConnected(true);
      loadMyProducts(info.address);
    } catch (error: any) { toast.error(error.message); } 
    finally { setIsLoading(false); }
  };

  // ... (其余代码保持完全不变) ...
  const loadMyProducts = async (ownerAddr: string) => { try { const list = await blockchainService.getProductsByOwner(ownerAddr); setProducts(list); } catch (error) { console.error(error); } };
  const handleSearchAndAdd = async () => { if (!searchId) return; setIsSearching(true); try { const productInfo = await blockchainService.getProductIfOwned(searchId, address); if (productInfo) { const exists = products.find(p => p.tokenId.toString() === searchId); if (!exists) { setProducts(prev => [...prev, { tokenId: searchId, ...productInfo }]); toast.success("Product found!"); } else { toast.info("Already in list"); } setSearchId(''); } else { toast.error("Not found or not owned"); } } catch (error) { toast.error("Search failed"); } finally { setIsSearching(false); } };
  const handleAction = async () => { if (!selectedProduct) return; setIsSubmitting(true); try { let result; if (actionType === 'warranty') result = await blockchainService.submitWarrantyClaim(selectedProduct.tokenId, warrantyDesc); else if (actionType === 'resale') result = await blockchainService.transferProduct(address, resaleAddress, selectedProduct.tokenId); if (result && result.success) { toast.success('Success!', { description: `Hash: ${result.hash.slice(0, 10)}...` }); closeDialog(); loadMyProducts(address); } else { throw new Error(result?.error || 'Failed'); } } catch (error: any) { toast.error('Failed', { description: error.message }); } finally { setIsSubmitting(false); } };
  
  const openOwnershipHistory = async (product: any) => {
    setSelectedProduct({ ...product, history: [] });
    setActionType('ownership');
    try {
      const transferEvents = await blockchainService.getProductTransfers(product.tokenId);
      const formattedEvents = transferEvents.map((e: any) => ({ type: e.type, timestamp: new Date(e.timestamp * 1000).toISOString(), description: e.description, txHash: e.txHash, from: e.from, to: e.to, status: undefined }));
      setSelectedProduct((prev: any) => ({ ...prev, history: formattedEvents }));
    } catch (e) { console.error("History load error", e); toast.error("Failed to load records"); }
  };
  
  const closeDialog = () => { setSelectedProduct(null); setActionType(null); setWarrantyDesc(''); setResaleAddress(''); };
  const isWarrantyActive = (p: any) => Number(p.warrantyExpiration) * 1000 > Date.now();

  if (!isConnected) return <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl"><Wallet className="w-12 h-12 text-slate-300"/><Button onClick={connectWallet} disabled={isLoading} className="mt-4">Connect Wallet</Button></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="bg-indigo-600 p-3 rounded-lg"><User className="w-6 h-6 text-white" /></div><div><h2 className="text-xl font-bold text-slate-900">My Products</h2><p className="text-sm text-slate-500 font-mono">{address.slice(0, 10)}...</p></div></div>
        <div className="flex gap-2 w-full md:w-auto"><Input placeholder="Token ID..." className="w-full md:w-48 bg-white" value={searchId} onChange={e => setSearchId(e.target.value)}/><Button variant="secondary" onClick={handleSearchAndAdd} disabled={isSearching}>Find</Button><Button variant="outline" onClick={() => loadMyProducts(address)}>Refresh</Button></div>
      </div>
      {products.length === 0 ? <Alert className="bg-white"><AlertDescription>No products found.</AlertDescription></Alert> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.tokenId} className="flex flex-col h-full">
              <CardHeader className="pb-3 flex-none"><div className="flex justify-between items-start"><Badge variant="outline">#{product.tokenId}</Badge><Badge className={isWarrantyActive(product) ? "bg-green-600 text-white" : "bg-slate-400 text-white"}>{isWarrantyActive(product) ? "Active" : "Expired"}</Badge></div><CardTitle className="text-lg mt-2">{product.model}</CardTitle><CardDescription>Serial: {product.serialNumber}</CardDescription></CardHeader>
              <CardContent className="space-y-4 pt-0 flex-1 flex flex-col">
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md border"><div className="flex justify-between"><span>Claims:</span><span>{product.claimCount?.toString()}/{product.claimLimit?.toString()}</span></div><div className="flex justify-between"><span>Expires:</span><span>{product.warrantyExpiration > 0 ? new Date(Number(product.warrantyExpiration) * 1000).toLocaleDateString() : 'N/A'}</span></div></div>
                <div className="flex-1"></div> 
                <div className="flex flex-col gap-2 mt-auto">
                   <Button className="w-full bg-indigo-600 text-white shadow-sm" disabled={!isWarrantyActive(product)} onClick={() => { setSelectedProduct(product); setActionType('warranty'); }}><Shield className="w-4 h-4 mr-2"/> Warranty</Button>
                   <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => openOwnershipHistory(product)}><History className="w-3 h-3 mr-1"/> Ownership</Button>
                      <Button variant="outline" onClick={() => { setSelectedProduct(product); setActionType('resale'); }}><ArrowLeftRight className="w-3 h-3 mr-1"/> Transfer</Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!selectedProduct && actionType !== null} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{actionType === 'ownership' ? 'Ownership History' : 'Action'}</DialogTitle><DialogDescription>{selectedProduct?.model}</DialogDescription></DialogHeader>
          {actionType === 'warranty' && (<div className="space-y-4 py-4"><Label>Issue</Label><Textarea value={warrantyDesc} onChange={e => setWarrantyDesc(e.target.value)}/><Button onClick={handleAction} disabled={isSubmitting} className="w-full bg-indigo-600 text-white">Submit</Button></div>)}
          {actionType === 'resale' && (<div className="space-y-4 py-4"><Label>Address</Label><Input value={resaleAddress} onChange={e => setResaleAddress(e.target.value)}/><Button onClick={handleAction} disabled={isSubmitting} className="w-full bg-indigo-600 text-white">Transfer</Button></div>)}
          {actionType === 'ownership' && (<div className="py-2"><ProductLifecycleTimeline product={selectedProduct} /></div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}