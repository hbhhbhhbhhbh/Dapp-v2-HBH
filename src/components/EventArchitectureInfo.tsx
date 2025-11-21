import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Zap, Database, Code, ArrowRight } from 'lucide-react';

/**
 * Component explaining the event-based architecture for blockchain data
 * This is educational and shows how the frontend works with smart contract events
 */
export default function EventArchitectureInfo() {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Event-Based Blockchain Architecture
        </CardTitle>
        <CardDescription>
          How this dApp aggregates on-chain data without storing arrays in the smart contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <div className="bg-blue-600 text-white p-2 rounded flex-shrink-0">
              <Code className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-900 mb-1">
                <strong>Step 1: Smart Contract Emits Events</strong>
              </div>
              <div className="text-xs text-slate-600">
                When actions occur (product registration, transfer, warranty claim), the contract emits events:
              </div>
              <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono text-slate-700">
                event ProductRegistered(uint256 tokenId, address manufacturer, string serialNumber);<br />
                event Transfer(address from, address to, uint256 tokenId); // ERC721 standard<br />
                event WarrantyClaimSubmitted(uint256 claimId, uint256 tokenId, string description);
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <div className="bg-emerald-600 text-white p-2 rounded flex-shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-900 mb-1">
                <strong>Step 2: Off-Chain Event Indexing</strong>
              </div>
              <div className="text-xs text-slate-600 mb-2">
                Events are indexed off-chain using one of these methods:
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">The Graph (GraphQL Subgraph)</Badge>
                <Badge variant="outline" className="text-xs">ethers.js Event Listeners + Database</Badge>
                <Badge variant="outline" className="text-xs">Alchemy/Infura Enhanced APIs</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <div className="bg-purple-600 text-white p-2 rounded flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-900 mb-1">
                <strong>Step 3: Frontend Queries Aggregated Data</strong>
              </div>
              <div className="text-xs text-slate-600">
                Frontend queries the indexed events to build the product timeline:
              </div>
              <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono text-slate-700">
                // The Graph GraphQL Query<br />
                query GetProductHistory($tokenId: ID!) &#123;<br />
                &nbsp;&nbsp;productRegistered(id: $tokenId) &#123; ... &#125;<br />
                &nbsp;&nbsp;transfers(where: &#123;tokenId: $tokenId&#125;) &#123; ... &#125;<br />
                &#125;
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-xs text-amber-900">
            <strong>Why not store history arrays on-chain?</strong> Storing arrays in smart contracts is 
            expensive (high gas costs) and impractical for historical data. Events provide an efficient, 
            immutable log that can be indexed off-chain for fast queries.
          </div>
        </div>

        <div className="text-xs text-slate-500">
          <strong>Implementation files:</strong> /lib/blockchainEvents.ts (event definitions) • 
          /lib/eventAggregator.ts (aggregation logic)
        </div>
      </CardContent>
    </Card>
  );
}
