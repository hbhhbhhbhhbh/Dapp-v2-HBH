/**
 * React Hook - 简化区块链操作
 * 
 * 这个自定义 Hook 封装了常用的区块链操作，提供更简洁的 API
 */

import { useState, useEffect, useCallback } from 'react';
import { blockchainService, WalletInfo, ProductInfo, ProductEvent, TransactionResult } from './blockchainService';
import { parseBlockchainError, saveLastConnectedAddress, clearLastConnectedAddress } from './blockchainUtils';

// ============================================================================
// Hook: useWallet - 钱包连接管理
// ============================================================================

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletInfo = await blockchainService.connectWallet();
      setWallet(walletInfo);
      saveLastConnectedAddress(walletInfo.address);
      return walletInfo;
    } catch (err: any) {
      const errorMsg = parseBlockchainError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    blockchainService.disconnect();
    setWallet(null);
    clearLastConnectedAddress();
  }, []);

  const isConnected = wallet !== null;

  return {
    wallet,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}

// ============================================================================
// Hook: useProduct - 产品信息管理
// ============================================================================

export function useProduct(tokenId: number | string | null) {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!tokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      const info = await blockchainService.getProductInfo(tokenId);
      setProductInfo(info);
      return info;
    } catch (err: any) {
      const errorMsg = parseBlockchainError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    if (tokenId && blockchainService.isConnected()) {
      loadProduct();
    }
  }, [tokenId, loadProduct]);

  return {
    productInfo,
    isLoading,
    error,
    reload: loadProduct,
  };
}

// ============================================================================
// Hook: useProductHistory - 产品历史记录
// ============================================================================

export function useProductHistory(tokenId: number | string | null) {
  const [history, setHistory] = useState<ProductEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!tokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      const events = await blockchainService.getProductHistory(tokenId);
      setHistory(events);
      return events;
    } catch (err: any) {
      const errorMsg = parseBlockchainError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    if (tokenId && blockchainService.isConnected()) {
      loadHistory();
    }
  }, [tokenId, loadHistory]);

  return {
    history,
    isLoading,
    error,
    reload: loadHistory,
  };
}

// ============================================================================
// Hook: useWarranty - 保修状态管理
// ============================================================================

export function useWarranty(tokenId: number | string | null) {
  const [isValid, setIsValid] = useState(false);
  const [expiration, setExpiration] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWarranty = useCallback(async () => {
    if (!tokenId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [valid, exp] = await Promise.all([
        blockchainService.isWarrantyValid(tokenId),
        blockchainService.getWarrantyExpiration(tokenId),
      ]);
      
      setIsValid(valid);
      setExpiration(exp);
      
      return { isValid: valid, expiration: exp };
    } catch (err: any) {
      const errorMsg = parseBlockchainError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    if (tokenId && blockchainService.isConnected()) {
      checkWarranty();
    }
  }, [tokenId, checkWarranty]);

  return {
    isValid,
    expiration,
    isLoading,
    error,
    reload: checkWarranty,
  };
}

// ============================================================================
// Hook: useTransaction - 交易状态管理
// ============================================================================

export function useTransaction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<TransactionResult>,
    onSuccess?: (result: TransactionResult) => void,
    onError?: (error: string) => void
  ) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await operation();
      setResult(txResult);

      if (txResult.success) {
        onSuccess?.(txResult);
      } else {
        const errorMsg = txResult.error || '交易失败';
        setError(errorMsg);
        onError?.(errorMsg);
      }

      return txResult;
    } catch (err: any) {
      const errorMsg = parseBlockchainError(err);
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    result,
    error,
    execute,
    reset,
  };
}

// ============================================================================
// Hook: useWarrantyClaim - 保修申请操作
// ============================================================================

export function useWarrantyClaim() {
  const { execute, isProcessing, error } = useTransaction();

  const submitClaim = useCallback(
    async (
      tokenId: number | string,
      issueDescription: string,
      onSuccess?: () => void
    ) => {
      return execute(
        () => blockchainService.submitWarrantyClaim(tokenId, issueDescription),
        () => onSuccess?.(),
        (err) => console.error('提交保修申请失败:', err)
      );
    },
    [execute]
  );

  return {
    submitClaim,
    isSubmitting: isProcessing,
    error,
  };
}

// ============================================================================
// Hook: useProductTransfer - 产品转移操作
// ============================================================================

export function useProductTransfer() {
  const { execute, isProcessing, error } = useTransaction();

  const transferProduct = useCallback(
    async (
      fromAddress: string,
      toAddress: string,
      tokenId: number | string,
      onSuccess?: () => void
    ) => {
      return execute(
        () => blockchainService.transferProduct(fromAddress, toAddress, tokenId),
        () => onSuccess?.(),
        (err) => console.error('转移产品失败:', err)
      );
    },
    [execute]
  );

  return {
    transferProduct,
    isTransferring: isProcessing,
    error,
  };
}

// ============================================================================
// Hook: useEventListener - 事件监听
// ============================================================================

export function useEventListener() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!blockchainService.isConnected()) return;

    // 监听产品注册
    blockchainService.onProductRegistered((tokenId, manufacturer, owner, data) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'ProductRegistered',
          tokenId: tokenId.toString(),
          manufacturer,
          owner,
          data,
          timestamp: Date.now(),
        },
      ]);
    });

    // 监听转移
    blockchainService.onTransfer((from, to, tokenId) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'Transfer',
          tokenId: tokenId.toString(),
          from,
          to,
          timestamp: Date.now(),
        },
      ]);
    });

    // 监听保修申请
    blockchainService.onWarrantyClaimSubmitted((claimId, tokenId, customer, issue) => {
      setEvents((prev) => [
        ...prev,
        {
          type: 'WarrantyClaimSubmitted',
          claimId: claimId.toString(),
          tokenId: tokenId.toString(),
          customer,
          issue,
          timestamp: Date.now(),
        },
      ]);
    });

    return () => {
      blockchainService.removeAllListeners();
    };
  }, []);

  return { events };
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * EXAMPLE: 在 React 组件中使用
 * 
 * import { useWallet, useProduct, useWarrantyClaim } from './lib/useBlockchain';
 * 
 * function MyComponent() {
 *   // 钱包连接
 *   const { wallet, isConnected, connect, disconnect } = useWallet();
 * 
 *   // 产品信息
 *   const { productInfo, isLoading, reload } = useProduct(1001);
 * 
 *   // 保修申请
 *   const { submitClaim, isSubmitting } = useWarrantyClaim();
 * 
 *   const handleSubmit = async () => {
 *     await submitClaim(1001, '屏幕损坏', () => {
 *       alert('保修申请已提交!');
 *       reload(); // 刷新产品信息
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       {!isConnected ? (
 *         <button onClick={connect}>连接钱包</button>
 *       ) : (
 *         <>
 *           <p>已连接: {wallet?.address}</p>
 *           {productInfo && (
 *             <div>
 *               <h2>{productInfo.model}</h2>
 *               <button onClick={handleSubmit} disabled={isSubmitting}>
 *                 {isSubmitting ? '提交中...' : '提交保修申请'}
 *               </button>
 *             </div>
 *           )}
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 */
