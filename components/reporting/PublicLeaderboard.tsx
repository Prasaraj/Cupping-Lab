
import React, { useMemo } from 'react';
import { AppData } from '../../data';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Trophy, ArrowLeft } from 'lucide-react';

interface PublicLeaderboardProps {
  appData: AppData;
  onExit: () => void;
}

const PublicLeaderboard: React.FC<PublicLeaderboardProps> = ({ appData, onExit }) => {
  const rankedSamples = useMemo(() => {
    return appData.samples
      .filter(sample => sample.adjudicatedFinalScore !== undefined && sample.adjudicatedFinalScore > 0)
      .sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0));
  }, [appData.samples]);

  const getRankSuffix = (rank: number) => {
      if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
      switch(rank % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
      }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="mx-auto text-primary mb-2" size={48} />
          <h1 className="text-4xl font-bold text-text-dark">Official Results</h1>
          <p className="text-text-light mt-1">Golden Bean Championship 2024</p>
        </div>

        {rankedSamples.length > 0 ? (
          <div className="space-y-3">
            {rankedSamples.map((sample, index) => {
              const rank = index + 1;
              const farmer = appData.users.find(u => u.id === sample.farmerId);
              let rankColor = 'bg-surface';
              if (rank === 1) rankColor = 'bg-yellow-400 text-yellow-900';
              if (rank === 2) rankColor = 'bg-gray-300 text-gray-800';
              if (rank === 3) rankColor = 'bg-yellow-600 text-yellow-100';

              return (
                <div key={sample.id} className="bg-surface border border-border rounded-lg p-4 flex items-center space-x-4 shadow-sm">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl font-bold ${rankColor}`}>
                      {rank}
                  </div>
                  <div className="flex-grow">
                      <p className="font-bold text-lg text-text-dark">{sample.farmName}</p>
                      <p className="text-sm text-text-light">{farmer?.name} | {sample.region}</p>
                      <p className="text-xs font-mono mt-1 text-primary">{sample.variety} - {sample.processingMethod}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-primary">{sample.adjudicatedFinalScore?.toFixed(2)}</p>
                      <p className="text-xs text-text-light">Final Score</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <p className="text-center text-text-light">Final results have not been published yet. Please check back later.</p>
          </Card>
        )}
        
        <div className="text-center mt-8">
            <Button onClick={onExit} variant="secondary" className="inline-flex items-center space-x-2">
                <ArrowLeft size={16}/>
                <span>Back to Login</span>
            </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicLeaderboard;
