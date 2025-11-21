// 文件路径: src/components/RoleManager.tsx adw

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { UserCog, CheckCircle, XCircle, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { blockchainService, UserRoles } from '../lib/blockchainService';

export default function RoleManager() {
  const [address, setAddress] = useState('');
  const [roles, setRoles] = useState<UserRoles>({
    isAdmin: false,
    isManufacturer: false,
    isRetailer: false,
    isServiceCenter: false
  });
  
  const [grantAddress, setGrantAddress] = useState('');
  const [grantRole, setGrantRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkRoles();
  }, []);

  const checkRoles = async () => {
    setIsLoading(true);
    try {
      let currentAddr = address;
      if (!blockchainService.isConnected()) {
         const info = await blockchainService.connectWallet();
         currentAddr = info.address;
         setAddress(currentAddr);
      } else if (!currentAddr) {
         // 如果已连接但没保存地址，重新获取
         const info = await blockchainService.connectWallet();
         currentAddr = info.address;
         setAddress(currentAddr);
      }

      const userRoles = await blockchainService.getUserRoles(currentAddr);
      setRoles(userRoles);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantRole = async () => {
    if (!grantAddress || !grantRole) {
        toast.error("Please fill in all fields");
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await blockchainService.grantRole(
        grantRole as 'MANUFACTURER' | 'RETAILER' | 'SERVICE_CENTER', 
        grantAddress
      );

      if (result.success) {
        toast.success(`Role ${grantRole} granted!`, {
            description: `Tx: ${result.hash.slice(0, 10)}...`
        });
        setGrantAddress('');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error("Grant Role Failed", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center gap-3">
        <div className="bg-slate-800 p-3 rounded-lg shadow-sm">
          <UserCog className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-slate-900 text-2xl font-bold">Role Management</h2>
          <p className="text-slate-600">View permissions and grant roles</p>
        </div>
      </div>

      {/* Current Roles */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
           <CardTitle className="flex justify-between items-center">
             <span>My Roles</span>
             <Button variant="ghost" size="sm" onClick={checkRoles} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
             </Button>
           </CardTitle>
           <CardDescription>Account: <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{address || 'Not Connected'}</span></CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RoleBadge label="Admin" active={roles.isAdmin} />
              <RoleBadge label="Manufacturer" active={roles.isManufacturer} />
              <RoleBadge label="Retailer" active={roles.isRetailer} />
              <RoleBadge label="Service Center" active={roles.isServiceCenter} />
           </div>
        </CardContent>
      </Card>

      {/* Grant Role (Admin Only) */}
      {roles.isAdmin && (
        <Card className="border-indigo-100 shadow-md bg-white">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
             <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Shield className="w-5 h-5 text-indigo-600"/> Admin Panel: Grant Roles
             </CardTitle>
             <CardDescription>Grant permissions to other wallet addresses</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label>Role Type</Label>
                   <Select onValueChange={setGrantRole} value={grantRole}>
                      <SelectTrigger>
                         <SelectValue placeholder="Select role to grant" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="MANUFACTURER">Manufacturer</SelectItem>
                         <SelectItem value="RETAILER">Retailer</SelectItem>
                         <SelectItem value="SERVICE_CENTER">Service Center</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label>Target Address</Label>
                   <Input 
                     placeholder="0x..." 
                     value={grantAddress}
                     onChange={e => setGrantAddress(e.target.value)}
                     className="font-mono"
                   />
                </div>
             </div>
             <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                onClick={handleGrantRole}
                disabled={isSubmitting}
             >
                {isSubmitting ? 'Processing Transaction...' : 'Grant Role'}
             </Button>
          </CardContent>
        </Card>
      )}
      
      {!roles.isAdmin && address && (
         <div className="text-center p-6 text-slate-500 text-sm">
            <p>You do not have Admin privileges to grant roles.</p>
         </div>
      )}
    </div>
  );
}

function RoleBadge({ label, active }: { label: string, active: boolean }) {
   return (
     <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${active ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
        <span className={`font-semibold ${active ? 'text-green-800' : 'text-slate-500'}`}>{label}</span>
        {active ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-slate-300" />}
     </div>
   )
}