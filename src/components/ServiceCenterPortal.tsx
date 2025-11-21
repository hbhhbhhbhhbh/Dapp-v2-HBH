// 文件路径: src/components/ServiceCenterPortal.tsx

import { useState, useEffect } from 'react';
// 👇 移除了 CardDescription
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
// 👇 移除了 AlertCircle
import { Wrench, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
// 👇 移除了 DialogFooter
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { blockchainService } from '../lib/blockchainService';

export default function ServiceCenterPortal() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 模态框状态
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [mode, setMode] = useState<'review' | 'service'>('review');
  const [serviceNotes, setServiceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (blockchainService.isConnected()) {
      loadClaims();
    }
  }, []);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const allClaims = await blockchainService.getAllWarrantyClaims();
      setClaims(allClaims);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedClaim) return;
    setIsSubmitting(true);
    try {
      const result = await blockchainService.processWarrantyClaim(selectedClaim.claimId, approved);
      if (result.success) {
        toast.success(`Claim ${approved ? 'Approved' : 'Rejected'}!`);
        closeDialog();
        loadClaims();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast.error("Review failed", { description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordService = async () => {
    if (!selectedClaim || !serviceNotes) return;
    setIsSubmitting(true);
    try {
      const result = await blockchainService.recordService(selectedClaim.claimId, serviceNotes);
      if (result.success) {
        toast.success('Service Recorded!');
        closeDialog();
        loadClaims();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast.error("Failed to record service", { description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setSelectedClaim(null);
    setServiceNotes('');
  };

  // 过滤出未处理的 claims
  const pendingClaims = claims.filter(c => !c.processed);
  // 过滤出已批准但未记录服务的 claims
  const approvedPendingService = claims.filter(c => c.processed && c.approved && (!c.serviceNotes || c.serviceNotes === ''));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-3 rounded-lg">
             <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-slate-900 text-2xl">Service Center</h2>
            <p className="text-slate-600">Manage warranty claims</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadClaims} disabled={isLoading}>
           {isLoading ? <RefreshCw className="animate-spin"/> : "Refresh Claims"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* 1. Pending Reviews */}
        <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Clock className="w-5 h-5 text-amber-500" /> Pending Reviews
             </CardTitle>
           </CardHeader>
           <CardContent>
             {pendingClaims.length === 0 ? (
               <p className="text-slate-500 text-center py-4">No pending claims to review.</p>
             ) : (
               <div className="space-y-4">
                 {pendingClaims.map(claim => (
                   <div key={claim.claimId} className="border p-4 rounded-lg flex justify-between items-start bg-amber-50/30 border-amber-100">
                      <div>
                        <div className="font-semibold">{claim.model} <span className="text-xs text-slate-500">#{claim.serialNumber}</span></div>
                        <p className="text-sm mt-1"><strong>Issue:</strong> {claim.issueDescription}</p>
                        <p className="text-xs text-slate-400 mt-2">Submitted: {new Date(claim.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" onClick={() => { setSelectedClaim(claim); setMode('review'); }}>Review</Button>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
        </Card>

        {/* 2. Approved - Waiting for Service Record */}
        <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Wrench className="w-5 h-5 text-blue-500" /> Pending Service Records
             </CardTitle>
           </CardHeader>
           <CardContent>
             {approvedPendingService.length === 0 ? (
               <p className="text-slate-500 text-center py-4">No approved claims waiting for service records.</p>
             ) : (
               <div className="space-y-4">
                 {approvedPendingService.map(claim => (
                   <div key={claim.claimId} className="border p-4 rounded-lg flex justify-between items-start bg-blue-50/30 border-blue-100">
                      <div>
                        <div className="font-semibold text-blue-900">{claim.model}</div>
                        <p className="text-sm text-blue-800">Claim ID: {claim.claimId}</p>
                        <Badge className="bg-green-500 mt-1">Approved</Badge>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => { setSelectedClaim(claim); setMode('service'); }}>
                        Log Service
                      </Button>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={closeDialog}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>{mode === 'review' ? 'Review Claim' : 'Log Service Record'}</DialogTitle>
               <DialogDescription>Claim #{selectedClaim?.claimId} - {selectedClaim?.model}</DialogDescription>
            </DialogHeader>

            {mode === 'review' ? (
              <div className="space-y-4 py-4">
                <div className="bg-slate-50 p-3 rounded text-sm">
                  <strong>Customer Issue:</strong>
                  <p className="mt-1">{selectedClaim?.issueDescription}</p>
                </div>
                <div className="flex gap-4">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleReview(true)} disabled={isSubmitting}>
                    <CheckCircle className="w-4 h-4 mr-2"/> Approve
                  </Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleReview(false)} disabled={isSubmitting}>
                    <XCircle className="w-4 h-4 mr-2"/> Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                   <Label>Service Notes</Label>
                   <Textarea 
                     placeholder="Details about repair/replacement..."
                     value={serviceNotes}
                     onChange={e => setServiceNotes(e.target.value)}
                   />
                </div>
                <Button className="w-full" onClick={handleRecordService} disabled={isSubmitting || !serviceNotes}>
                   {isSubmitting ? 'Saving...' : 'Save Service Record'}
                </Button>
              </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}