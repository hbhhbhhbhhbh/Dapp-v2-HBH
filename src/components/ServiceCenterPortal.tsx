// 文件路径: src/components/ServiceCenterPortal.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Wrench, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { blockchainService } from '../lib/blockchainService';

export default function ServiceCenterPortal() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [mode, setMode] = useState<'review' | 'service'>('review');
  const [serviceNotes, setServiceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化加载
  useEffect(() => {
    if (blockchainService.isConnected()) {
      loadClaims();
    }
  }, []);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const allClaims = await blockchainService.getAllWarrantyClaims();
      console.log("Loaded claims:", allClaims); // Debug log
      setClaims(allClaims);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load claims");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 核心修复：处理后强制刷新
  const handleReview = async (approved: boolean) => {
    if (!selectedClaim) return;
    setIsSubmitting(true);
    try {
      const result = await blockchainService.processWarrantyClaim(selectedClaim.claimId, approved);
      if (result.success) {
        toast.success(`Claim ${approved ? 'Approved' : 'Rejected'}!`, {
          description: `Tx: ${result.hash.slice(0, 10)}...`
        });
        closeDialog();
        
        // ⚠️ 强制延迟刷新，等待节点索引更新
        setTimeout(() => {
           loadClaims();
        }, 2000);
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
        setTimeout(() => { loadClaims(); }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast.error("Failed to record", { description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setSelectedClaim(null);
    setServiceNotes('');
  };

  // ✅ 逻辑验证：
  // Pending Review: 未处理 (processed == false)
  const pendingClaims = claims.filter(c => c.processed === false);
  
  // Pending Service Record: 已处理(processed) + 已批准(approved) + 无记录(!serviceNotes)
  const approvedPendingService = claims.filter(c => 
    c.processed === true && 
    c.approved === true && 
    (!c.serviceNotes || c.serviceNotes === '')
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-3 rounded-lg"><Wrench className="w-8 h-8 text-white" /></div>
          <div><h2 className="text-slate-900 text-2xl font-bold">Service Center</h2><p className="text-slate-600">Manage claims</p></div>
        </div>
        <Button variant="outline" onClick={loadClaims} disabled={isLoading}>
           <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}/> Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {/* 1. Pending Reviews */}
        <Card>
           <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Pending Reviews ({pendingClaims.length})</CardTitle></CardHeader>
           <CardContent>
             {pendingClaims.length === 0 ? <p className="text-slate-500 text-center py-4">No pending reviews.</p> : (
               <div className="space-y-4">
                 {pendingClaims.map(claim => (
                   <div key={claim.claimId} className="border p-4 rounded-lg flex justify-between items-start bg-amber-50/50 border-amber-100">
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
           <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-500" /> Pending Service Records ({approvedPendingService.length})</CardTitle></CardHeader>
           <CardContent>
             {approvedPendingService.length === 0 ? <p className="text-slate-500 text-center py-4">No approved claims waiting for service.</p> : (
               <div className="space-y-4">
                 {approvedPendingService.map(claim => (
                   <div key={claim.claimId} className="border p-4 rounded-lg flex justify-between items-start bg-blue-50/50 border-blue-100">
                      <div>
                        <div className="font-semibold text-blue-900">{claim.model}</div>
                        <p className="text-sm text-blue-800">Claim ID: {claim.claimId}</p>
                        <Badge className="bg-green-500 mt-1">Approved</Badge>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => { setSelectedClaim(claim); setMode('service'); }}>Log Service</Button>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedClaim} onOpenChange={closeDialog}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>{mode === 'review' ? 'Review Claim' : 'Log Service Record'}</DialogTitle>
               <DialogDescription>Claim #{selectedClaim?.claimId} - {selectedClaim?.model}</DialogDescription>
            </DialogHeader>

            {mode === 'review' ? (
              <div className="space-y-4 py-4">
                <div className="bg-slate-50 p-3 rounded text-sm"><strong>Customer Issue:</strong><p className="mt-1">{selectedClaim?.issueDescription}</p></div>
                <div className="flex gap-4">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleReview(true)} disabled={isSubmitting}><CheckCircle className="w-4 h-4 mr-2"/> Approve</Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReview(false)} disabled={isSubmitting}><XCircle className="w-4 h-4 mr-2"/> Reject</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Service Notes</Label><Textarea placeholder="Details about repair..." value={serviceNotes} onChange={e => setServiceNotes(e.target.value)}/></div>
                <Button className="w-full bg-indigo-600 text-white" onClick={handleRecordService} disabled={isSubmitting || !serviceNotes}>{isSubmitting ? 'Saving...' : 'Save Service Record'}</Button>
              </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
}