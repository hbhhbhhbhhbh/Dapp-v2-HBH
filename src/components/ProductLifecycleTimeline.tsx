// 文件路径: src/components/ProductLifecycleTimeline.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Package, ArrowRight, Wrench, Shield, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Separator } from './ui/separator';
import { getExplorerUrl } from '../lib/contractConfig';
import { shortenAddress } from '../lib/blockchainUtils';

// 独立定义类型
interface HistoryEvent {
  type: string;
  timestamp: string | number | bigint; // 兼容多种时间格式
  from?: string;
  to?: string;
  description: string;
  txHash: string;
  status?: 'approved' | 'rejected' | 'pending';
}

interface Product {
  tokenId: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  manufacturerAddress?: string;
  currentOwner: string;
  currentOwnerAddress?: string;
  // 兼容 BigInt (链上数据) 和 String (Mock数据)
  registrationDate: string | number | bigint; 
  warrantyStart?: string | number | bigint;
  warrantyExpiration?: string | number | bigint;
  warrantyClaimCount?: number | bigint;
  history: HistoryEvent[];
}

interface ProductLifecycleTimelineProps {
  product: Product;
}

export default function ProductLifecycleTimeline({ product }: ProductLifecycleTimelineProps) {
  
  // 🛠️ 辅助函数：安全转换时间戳
  const safeGetTime = (val: string | number | bigint | undefined): number => {
    if (!val) return 0;
    try {
      // 如果是 BigInt，先转 Number，再乘 1000 (秒 -> 毫秒)
      if (typeof val === 'bigint') return Number(val) * 1000;
      // 如果是数字，假设是秒 (链上标准)，乘 1000
      if (typeof val === 'number') return val > 10000000000 ? val : val * 1000; // 简单判断是毫秒还是秒
      // 如果是字符串，尝试解析
      return new Date(val).getTime();
    } catch (e) {
      console.error("Date parse error", val);
      return 0;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'manufacture': return <Package className="w-5 h-5" />;
      case 'transfer': return <ArrowRight className="w-5 h-5" />;
      case 'warranty_claim': return <Shield className="w-5 h-5" />;
      case 'service': return <Wrench className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string, status?: string) => {
    if (type === 'warranty_claim') {
      if (status === 'approved') return 'bg-green-500';
      if (status === 'rejected') return 'bg-red-500';
      return 'bg-yellow-500';
    }
    switch (type) {
      case 'manufacture': return 'bg-blue-500';
      case 'transfer': return 'bg-purple-500';
      case 'service': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const formatDate = (val?: string | number | bigint) => {
    const time = safeGetTime(val);
    if (time === 0) return 'N/A';
    
    return new Date(time).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // 使用 safeGetTime 处理保修逻辑
  const expirationTime = safeGetTime(product.warrantyExpiration);
  const isWarrantyActive = expirationTime > Date.now();

  const warrantyDaysRemaining = expirationTime > 0
    ? Math.max(0, Math.ceil((expirationTime - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // 空状态检查
  if (!product || !product.history || product.history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                {product.model}
                <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Verified</Badge>
              </CardTitle>
              <CardDescription>Serial Number: {product.serialNumber}</CardDescription>
            </div>
            <div className="text-left md:text-right">
              <div className="text-sm text-slate-600">Token ID</div>
              <div className="text-slate-900 font-mono text-lg">#{product.tokenId}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 text-center text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No history events found for this product yet.</p>
          <p className="text-xs mt-1">Blockchain data might be indexing...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                {product.model}
                <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Verified</Badge>
              </CardTitle>
              <CardDescription>Serial Number: {product.serialNumber}</CardDescription>
            </div>
            <div className="text-left md:text-right">
              <div className="text-sm text-slate-600">Token ID</div>
              <div className="text-slate-900 font-mono text-lg">#{product.tokenId}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1 min-w-0">
              <div className="text-sm text-slate-600">Manufacturer</div>
              <div className="text-slate-900 text-sm font-mono truncate" title={product.manufacturerAddress}>
                {product.manufacturer ? product.manufacturer : shortenAddress(product.manufacturerAddress || '')}
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-sm text-slate-600">Current Owner</div>
              <div className="text-slate-900 text-sm font-mono truncate" title={product.currentOwnerAddress}>
                 {shortenAddress(product.currentOwnerAddress || '')}
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-sm text-slate-600">Registration</div>
              <div className="text-slate-900 text-sm">{formatDate(product.registrationDate)}</div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-sm text-slate-600">Warranty</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={isWarrantyActive ? "bg-green-600" : "bg-slate-500"}>
                  {isWarrantyActive ? "Active" : "Expired"}
                </Badge>
                {isWarrantyActive && (
                  <span className="text-xs text-slate-500 whitespace-nowrap">{warrantyDaysRemaining} days left</span>
                )}
              </div>
            </div>
          </div>

          {safeGetTime(product.warrantyStart) > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm text-slate-600">Warranty Start</div>
                  <div className="text-slate-900 font-medium">{formatDate(product.warrantyStart)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-600">Warranty Expiration</div>
                  <div className="text-slate-900 font-medium">{formatDate(product.warrantyExpiration)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-600">Claims Filed</div>
                  <div className="text-slate-900 font-medium">{product.warrantyClaimCount?.toString() || '0'}</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Lifecycle History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {product.history.map((event, index) => (
              <div key={index} className="flex gap-4 pb-8 last:pb-0 relative">
                {index < product.history.length - 1 && (
                  <div className="absolute left-[22px] top-10 bottom-0 w-0.5 bg-slate-200" />
                )}
                <div className={`flex-shrink-0 w-11 h-11 rounded-full ${getEventColor(event.type, event.status)} text-white flex items-center justify-center shadow-sm z-10 border-4 border-white`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 pt-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-2 break-words">{event.description}</p>
                  {(event.from || event.to) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded mb-2 border border-slate-100">
                      {event.from && <span className="font-mono">{shortenAddress(event.from)}</span>}
                      {event.from && event.to && <ArrowRight className="w-3 h-3 flex-shrink-0 text-slate-400" />}
                      {event.to && <span className="font-mono">{shortenAddress(event.to)}</span>}
                    </div>
                  )}
                  {event.txHash && (
                    <a href={getExplorerUrl(event.txHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline break-all">
                      Tx: {event.txHash.slice(0, 10)}... <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}