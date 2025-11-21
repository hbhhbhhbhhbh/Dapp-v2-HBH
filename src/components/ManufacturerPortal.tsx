// 文件路径: src/components/ManufacturerPortal.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
// 👇 移除了 Wallet
import { Package, Plus, CheckCircle } from 'lucide-react'; 
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { blockchainService } from '../lib/blockchainService';

export default function ManufacturerPortal() {
  const [formData, setFormData] = useState({
    serialNumber: '',
    model: '',
    initialOwner: '',
    warrantyDays: '365', // 默认 1 年
    claimLimit: '3'      // 默认 3 次
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTxHash('');

    try {
      if (!blockchainService.isConnected()) {
        await blockchainService.connectWallet();
      }

      toast.loading("Submitting to blockchain...", { id: "register-product" });

      const result = await blockchainService.registerProduct(
        formData.initialOwner,
        formData.serialNumber,
        formData.model,
        parseInt(formData.warrantyDays),
        parseInt(formData.claimLimit)
      );

      if (result.success) {
        toast.success('Product Registered Successfully!', {
          id: "register-product",
          description: `TX: ${result.hash.slice(0, 10)}...`,
        });
        setTxHash(result.hash);
        setFormData(prev => ({ ...prev, serialNumber: '', model: '' }));
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      console.error(error);
      toast.error('Registration Failed', {
        id: "register-product",
        description: error.message || "Unknown error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-lg">
          <Package className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-slate-900 text-2xl">Manufacturer Portal</h2>
          <p className="text-slate-600">Register new products on the blockchain</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Register New Product
            </CardTitle>
            <CardDescription>
              Create a new product NFT. Requires Manufacturer Role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {txHash && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 break-all">
                    Success! TX: {txHash}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number *</Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g., SN-001"
                    value={formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Phone X"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialOwner">Initial Owner (Retailer Address) *</Label>
                <Input
                  id="initialOwner"
                  placeholder="0x..."
                  value={formData.initialOwner}
                  onChange={(e) => handleChange('initialOwner', e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warrantyDays">Warranty (Days) *</Label>
                  <Input
                    id="warrantyDays"
                    type="number"
                    value={formData.warrantyDays}
                    onChange={(e) => handleChange('warrantyDays', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimLimit">Claim Limit *</Label>
                  <Input
                    id="claimLimit"
                    type="number"
                    value={formData.claimLimit}
                    onChange={(e) => handleChange('claimLimit', e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Register Product'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
           <CardHeader>
            <CardTitle>Instructions</CardTitle>
           </CardHeader>
           <CardContent className="text-sm text-slate-600 space-y-2">
             <p>1. Ensure you are connected with an account that has the <strong>Manufacturer Role</strong>.</p>
             <p>2. The Initial Owner must be an address with the <strong>Retailer Role</strong>.</p>
             <p>3. Warranty Duration is in days (e.g., 365 for one year).</p>
             <p>4. Claim Limit determines how many times a warranty can be claimed for this product.</p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}