import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calendar, LucideHash, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { WishAccount } from '@/lib/solana';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WishesProps {
  wishes: WishAccount[];
  isLoading: boolean;
  onRefresh: () => void;
  loadingRefresh: boolean;
}

export const Wishes: React.FC<WishesProps> = ({ 
  wishes, 
  isLoading, 
  onRefresh, 
  loadingRefresh 
}) => {
  // Handle displaying an empty state when there are no wishes
  if (!isLoading && wishes.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Your Wishes</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loadingRefresh}
            className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingRefresh ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="p-8 rounded-lg border border-gray-700 bg-gray-800/40 flex flex-col items-center justify-center">
          <div className="text-gray-400 text-center">
            <p className="mb-3">You haven't created any wishes yet</p>
            <p className="text-sm">Your wishes will appear here after you create them</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Your Wishes</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={loadingRefresh}
          className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingRefresh ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        // Skeleton loaders for better UX while loading
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-lg border border-gray-700 bg-gray-800/40">
              <div className="flex justify-between items-start mb-3">
                <Skeleton className="h-6 w-1/3 bg-gray-700" />
                <Skeleton className="h-5 w-20 rounded-full bg-gray-700" />
              </div>
              <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
              <div className="flex justify-between items-center mt-4">
                <Skeleton className="h-4 w-24 bg-gray-700" />
                <Skeleton className="h-4 w-32 bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((wish) => (
            <Card key={wish.publicKey.toString()} className="border-gray-700 bg-gray-800/40">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white">{wish.account.title}</h3>
                  <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Created recently
                  </Badge>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-700 flex flex-wrap justify-between gap-y-2 text-xs">
                  <div className="flex items-center text-gray-400">
                    <LucideHash className="h-3 w-3 mr-1" />
                    <span className="font-mono">{wish.publicKey.toString().substring(0, 8)}...{wish.publicKey.toString().substring(wish.publicKey.toString().length - 4)}</span>
                  </div>
                  
                  <a 
                    href={`https://explorer.solana.com/address/${wish.publicKey.toString()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on Explorer
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishes;
