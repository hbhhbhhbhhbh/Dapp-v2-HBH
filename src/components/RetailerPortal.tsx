// 文件路径: src/components/RetailerPortal.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Store, ArrowRight, Package, RefreshCw } from 'lucide-react';
// 👇 移除了未使用的 Alert, AlertDescription
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { blockchainService } from '../lib/blockchainService';

export default function RetailerPortal() {
  const [address, setAddress] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 销售相关
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (blockchainService.isConnected()) {
       connectAndLoad();
    }
  }, []);

  const connectAndLoad = async () => {
    setIsLoading(true);
    try {
      const info = await blockchainService.connectWallet();
      setAddress(info.address);
      
      // 获取所有者为当前地址的产品
      const allProducts = await blockchainService.getProductsByOwner(info.address);
      
      // 过滤：只显示保修尚未激活的产品 (warrantyStart == 0)
      const availableStock = allProducts.filter(p => Number(p.warrantyStart) === 0);
      
      setInventory(availableStock);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!selectedProduct || !customerAddress) return;
    setIsSubmitting(true);

    try {
      // 销售即转账，智能合约会自动激活保修
      const result = await blockchainService.transferProduct(address, customerAddress, selectedProduct.tokenId);
      
      if (result.success) {
        toast.success('Product Sold!', {
          description: `Warranty activated. Transferred to ${customerAddress.slice(0,6)}...`
        });
        setSelectedProduct(null);
        setCustomerAddress('');
        connectAndLoad(); // 刷新库存
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error('Sale Failed', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-purple-600 p-3 rounded-lg">
          <Store className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-slate-900 text-2xl">Retailer Portal</h2>
          <p className="text-slate-600">Manage inventory and sell to customers</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
         <p className="text-sm text-slate-500">Connected: {address || "Not Connected"}</p>
         <Button variant="outline" onClick={connectAndLoad} disabled={isLoading}>
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : "Refresh Inventory"}
         </Button>
      </div>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Available Inventory
          </CardTitle>
          <CardDescription>
            Products in your wallet ready for sale (Warranty Unactivated)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No available products found.</p>
              <Button className="mt-4" variant="link" onClick={connectAndLoad}>Connect Wallet / Refresh</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((product) => (
                <Card key={product.tokenId} className="border border-slate-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Badge variant="secondary">#{product.tokenId}</Badge>
                      <span className="text-xs text-slate-500">New</span>
                    </div>
                    <CardTitle className="text-base">{product.model}</CardTitle>
                    <CardDescription>{product.serialNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Sell to Customer <ArrowRight className="w-4 h-4 ml-2"/>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Product</DialogTitle>
            <DialogDescription>
              Transfer ownership to customer. This will automatically activate the warranty.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-slate-50 rounded-md space-y-2 mb-2">
             <p className="text-sm"><strong>Model:</strong> {selectedProduct?.model}</p>
             <p className="text-sm"><strong>Serial:</strong> {selectedProduct?.serialNumber}</p>
          </div>

          <div className="space-y-2">
            <Label>Customer Wallet Address</Label>
            <Input 
              placeholder="0x..." 
              value={customerAddress}
              onChange={e => setCustomerAddress(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
            <Button onClick={handleSell} disabled={isSubmitting || !customerAddress}>
              {isSubmitting ? 'Processing...' : 'Confirm Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}