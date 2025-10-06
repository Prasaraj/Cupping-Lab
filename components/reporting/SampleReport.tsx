
import React, { useMemo } from 'react';
import type { CoffeeSample, ScoreSheet } from '../../types';
import type { AppData } from '../../data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from '../ui/Button';
import { Printer, TrendingUp, TrendingDown, Star, Award } from 'lucide-react';

interface SampleReportProps {
  sample: CoffeeSample;
  appData: AppData;
}

const calculateStats = (scores: number[]) => {
    if (!scores || scores.length === 0) return { average: 0, count: 0 };
    return {
      average: scores.reduce((sum, val) => sum + val, 0) / scores.length,
      count: scores.length
    };
};

const scoreAttributes: (keyof Omit<ScoreSheet['scores'], 'finalScore' | 'taints' | 'faults'>)[] = 
    ['fragrance', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'uniformity', 'cleanCup', 'sweetness', 'overall'];


const getEducationalText = (attribute: typeof scoreAttributes[number], score: number): { summary: string, detail: string } => {
    const textMap: Record<typeof attribute, Record<string, { summary: string, detail: string }>> = {
        fragrance: { high: { summary: "Exceptional Aroma", detail: "A high score suggests a very pleasing and complex smell, both from the dry grounds and the wet crust." }, mid: { summary: "Pleasant Aroma", detail: "A good score indicates a clean and noticeable aroma, which is a positive sign of the coffee's quality." }, low: { summary: "Needs Improvement", detail: "A lower score might indicate a faint, dull, or slightly off-putting aroma. Consider roast profile or storage." } },
        flavor: { high: { summary: "Distinct & Complex Flavor", detail: "Represents a rich and multi-layered taste profile. The coffee's character is clear and enjoyable." }, mid: { summary: "Good Flavor Profile", detail: "The coffee has a pleasant and recognizable flavor, forming the core of its character." }, low: { summary: "Lacks Distinctiveness", detail: "The flavor may be simple, uninteresting, or have minor off-notes. Exploring different processing methods could enhance this." } },
        aftertaste: { high: { summary: "Long & Pleasant Finish", detail: "The positive flavor impression remains long after the coffee is tasted, indicating high quality." }, mid: { summary: "Clean Finish", detail: "A respectable aftertaste that is clean and doesn't leave an unpleasant impression." }, low: { summary: "Short or Unpleasant Finish", detail: "The aftertaste may be fleeting or leave a bitter or astringent feeling. This could be related to roasting or brewing." } },
        acidity: { high: { summary: "Vibrant & Bright", detail: "A high score means a lively, sparkling quality, often described as 'juicy'. This is highly desirable in many specialty coffees." }, mid: { summary: "Balanced Acidity", detail: "The coffee has a pleasant brightness that is well-integrated with the other attributes." }, low: { summary: "Dull or Astringent", detail: "Low acidity can make a coffee taste flat. If it's harsh or sour, it's a negative quality." } },
        body: { high: { summary: "Rich & Full-Bodied", detail: "A high score indicates a pleasant sense of weight and texture in the mouth, like the difference between skim milk and whole milk." }, mid: { summary: "Good Mouthfeel", detail: "The coffee has a pleasant texture that is neither too thin nor too heavy." }, low: { summary: "Thin or Watery", detail: "A lighter body isn't always bad, but a low score suggests it's weak or lacks presence. Fermentation can impact this." } },
        balance: { high: { summary: "Exceptionally Harmonious", detail: "All aspects of the coffee—flavor, acidity, body, aftertaste—work together perfectly. Nothing is overpowering." }, mid: { summary: "Well-Balanced", detail: "The coffee's attributes are in good harmony, making for a complete and enjoyable experience." }, low: { summary: "Unbalanced", detail: "One attribute may dominate others in a negative way, such as overpowering acidity or a weak flavor." } },
        uniformity: { high: { summary: "Very Consistent", detail: "All cups tasted were identical, showing excellent consistency in the coffee and its preparation." }, mid: { summary: "Consistent", detail: "No significant variation was found between cups." }, low: { summary: "Inconsistent", detail: "Variations in flavor were found between cups, pointing to potential issues in sorting or processing." } },
        cleanCup: { high: { summary: "Very Clean Profile", detail: "From the first taste to the finish, the coffee is completely free of any negative or interfering impressions." }, mid: { summary: "Clean", detail: "The coffee is free of noticeable defects." }, low: { summary: "Minor Defects", detail: "Slight off-flavors or aromas were detected, detracting from the overall quality." } },
        sweetness: { high: { summary: "Rich & Obvious Sweetness", detail: "A pleasing, full sweetness resulting from the natural sugars in the coffee cherry. A sign of perfectly ripe picking." }, mid: { summary: "Good Sweetness", detail: "A pleasant sweetness is present, contributing positively to the flavor." }, low: { summary: "Lacks Sweetness", detail: "The coffee may taste flat, sour, or 'green' due to a lack of perceived sweetness." } },
        overall: { high: { summary: "Outstanding & Memorable", detail: "The cupper's holistic rating. A high score means the coffee was exceptional and stood out." }, mid: { summary: "Very Good Coffee", detail: "A solid overall score reflecting a quality specialty coffee that the cupper enjoyed." }, low: { summary: "Good but Unexciting", detail: "A lower score suggests a decent coffee that didn't have any 'wow' factor or unique character." } },
    };
    const thresholds = { high: 8.25, mid: 7.25 };
    const level = score >= thresholds.high ? 'high' : score >= thresholds.mid ? 'mid' : 'low';
    return textMap[attribute][level];
};

const SampleReport: React.FC<SampleReportProps> = ({ sample, appData }) => {
    const event = useMemo(() => appData.events.find(e => e.sampleIds.includes(sample.id)), [appData.events, sample.id]);
    const scoresForSample = useMemo(() => appData.scores.filter(s => s.sampleId === sample.id && s.eventId === event?.id && s.isSubmitted), [appData.scores, sample.id, event]);
    const farmer = useMemo(() => appData.users.find(u => u.id === sample.farmerId), [appData.users, sample.farmerId]);

    const rankInfo = useMemo(() => {
        if (!event || !event.isResultsRevealed || sample.adjudicatedFinalScore === undefined) {
            return null;
        }

        const rankedEventSamples = appData.samples
            .filter(s => event.sampleIds.includes(s.id) && s.adjudicatedFinalScore !== undefined)
            .sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0));
        
        const rank = rankedEventSamples.findIndex(s => s.id === sample.id) + 1;
        
        if (rank === 0) return null;

        return { rank, total: rankedEventSamples.length };
    }, [appData.samples, event, sample]);

    const achievements = useMemo(() => {
        const badges = [];
        if (!rankInfo || sample.adjudicatedFinalScore === undefined) return [];

        if (rankInfo.rank === 1) {
            badges.push({ name: '1st Place Winner', icon: Award, color: 'text-yellow-500' });
        } else if (rankInfo.rank <= 3) {
            badges.push({ name: `Top 3 Finisher`, icon: Award, color: 'text-gray-500' });
        } else if (rankInfo.rank <= 10) {
            badges.push({ name: 'Top 10 Finisher', icon: Award, color: 'text-orange-700' });
        }

        if (sample.gradeLevel === 'Outstanding') {
            badges.push({ name: 'Outstanding Cup (90+)', icon: Star, color: 'text-blue-500' });
        } else if (sample.gradeLevel === 'Excellent') {
            badges.push({ name: 'Excellent Cup (85+)', icon: Star, color: 'text-green-500' });
        }
        
        return badges;
    }, [rankInfo, sample.adjudicatedFinalScore, sample.gradeLevel]);

    const competitionSamplesInCategory = useMemo(() => {
        if (!event) return [];
        return appData.samples.filter(s => event.sampleIds.includes(s.id) && s.processingMethod === sample.processingMethod && s.adjudicatedFinalScore);
    }, [appData.samples, event, sample.processingMethod]);
    
    const radarChartData = useMemo(() => {
      if (!event) return [];
      const competitionScoresForCategory = appData.scores.filter(sc => competitionSamplesInCategory.some(s => s.id === sc.sampleId) && sc.isSubmitted);

      return scoreAttributes.map(attr => {
          const sampleScores = scoresForSample.map(s => s.scores[attr]);
          const competitionScores = competitionScoresForCategory.map(s => s.scores[attr]);
          const attrName = String(attr).charAt(0).toUpperCase() + String(attr).slice(1);

          return { 
              attribute: attrName, 
              'Your Coffee': parseFloat(calculateStats(sampleScores).average.toFixed(2)),
              'Competition Avg.': parseFloat(calculateStats(competitionScores).average.toFixed(2)),
          };
      });
    }, [scoresForSample, competitionSamplesInCategory, appData.scores, event]);
    
    const descriptorFrequency = useMemo(() => {
        const allDescriptors = scoresForSample.flatMap(s => s.descriptors.map(d => d.name));
        const counts = allDescriptors.reduce((acc, desc) => { acc[desc] = (acc[desc] || 0) + 1; return acc; }, {} as Record<string, number>);
        return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 15);
    }, [scoresForSample]);

    const anonymizedNotes = useMemo(() => scoresForSample.map(s => s.notes).filter(Boolean), [scoresForSample]);

    const ScoreAnalysisSection = () => (
      <div className="p-4 border border-border rounded-lg">
        <h3 className="font-bold text-lg mb-4">Score Analysis & Feedback</h3>
        <div className="space-y-4">
          {scoreAttributes.map(attr => {
            const sampleAvgScore = calculateStats(scoresForSample.map(s => s.scores[attr])).average;
            const educationalText = getEducationalText(attr, sampleAvgScore);
            const attrName = String(attr).charAt(0).toUpperCase() + String(attr).slice(1);

            const allScoresForAttr = competitionSamplesInCategory.flatMap(s => 
                appData.scores.filter(score => score.sampleId === s.id && score.isSubmitted).map(score => score.scores[attr])
            );
            const sortedScores = [...allScoresForAttr].sort((a,b) => a-b);
            const rank = sortedScores.filter(s => s < sampleAvgScore).length;
            const percentile = allScoresForAttr.length > 0 ? Math.round((rank / allScoresForAttr.length) * 100) : 0;
            
            let TrendIcon = percentile > 50 ? TrendingUp : TrendingDown;
            let trendColor = percentile > 50 ? "text-green-600" : "text-red-600";
            if (percentile >= 40 && percentile <= 60) {
              TrendIcon = Star;
              trendColor = "text-yellow-600";
            }

            return (
              <div key={attr} className="p-3 bg-background rounded-md border border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{attrName}: <span className="text-primary">{sampleAvgScore.toFixed(2)}</span></h4>
                    <p className="text-sm font-semibold">{educationalText.summary}</p>
                  </div>
                   <div className={`flex items-center space-x-1 text-sm font-semibold ${trendColor}`}>
                    <TrendIcon size={16}/>
                    <span>Top {100-percentile}%</span>
                  </div>
                </div>
                <p className="text-sm text-text-light mt-1">{educationalText.detail}</p>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-semibold text-primary hover:underline mt-2 inline-block">
                    Learn how to improve {attrName} &rarr;
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );

  return (
    <div className="font-sans text-text-dark bg-white" id="report-content">
        <div className="p-2 print:p-0">
            <header className="flex justify-between items-start pb-4 border-b-2 border-primary mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Official Cupping Report</h1>
                    <p className="text-text-light">{event?.name}</p>
                </div>
                <div className="text-right">
                    <Button onClick={() => window.print()} className="print:hidden flex items-center space-x-2"><Printer size={16}/><span>Print Report</span></Button>
                    <p className="hidden print:block text-sm text-text-light">{new Date().toLocaleDateString()}</p>
                </div>
            </header>

            <main className="space-y-6">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border border-border rounded-lg bg-background">
                        <h3 className="font-bold text-lg mb-2 border-b border-border pb-2">Sample Information</h3>
                        <div className="text-sm space-y-1">
                            <p><strong className="w-28 inline-block">Farmer:</strong> {farmer?.name}</p>
                            <p><strong className="w-28 inline-block">Farm Name:</strong> {sample.farmName}</p>
                            <p><strong className="w-28 inline-block">Region:</strong> {sample.region}</p>
                            <p><strong className="w-28 inline-block">Variety:</strong> {sample.variety}</p>
                            <p><strong className="w-28 inline-block">Processing:</strong> {sample.processingMethod}</p>
                        </div>
                        {achievements.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <h4 className="font-bold text-md mb-2">Achievements</h4>
                                <div className="space-y-2">
                                    {achievements.map(badge => (
                                        <div key={badge.name} className={`flex items-center space-x-2 ${badge.color}`}>
                                            <badge.icon size={18} />
                                            <span className="font-semibold text-sm">{badge.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                     <div className="p-4 border border-border rounded-lg bg-background text-center flex flex-col justify-around">
                        {rankInfo && (
                            <div>
                                <p className="text-sm text-text-light">Rank</p>
                                <p className="text-4xl font-bold text-text-dark">
                                    {rankInfo.rank}<span className="text-2xl font-normal text-text-light">/{rankInfo.total}</span>
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-text-light">Final Score</p>
                            <p className="text-6xl font-bold text-primary">{sample.adjudicatedFinalScore?.toFixed(2)}</p>
                            <p className="font-semibold text-text-dark bg-primary/20 text-primary/90 rounded-full px-3 py-1 inline-block text-lg mt-1">{sample.gradeLevel}</p>
                        </div>
                    </div>
                     <div className="p-4 border border-border rounded-lg">
                        <h3 className="font-bold text-lg mb-2">Flavor Profile</h3>
                         {descriptorFrequency.length > 0 ? (
                            (() => {
                                const maxCount = descriptorFrequency.length > 0 ? descriptorFrequency[0][1] : 1;
                                const minCount = descriptorFrequency.length > 0 ? descriptorFrequency[descriptorFrequency.length - 1][1] : 1;
                                const textSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
                                
                                return (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-center h-full">
                                        {descriptorFrequency.map(([desc, count]) => {
                                            let sizeIndex = 0;
                                            if (maxCount > minCount) {
                                                sizeIndex = Math.round(((count - minCount) / (maxCount - minCount)) * (textSizes.length - 1));
                                            } else if (descriptorFrequency.length === 1) {
                                                sizeIndex = Math.floor(textSizes.length / 2);
                                            }
                                            const textSize = textSizes[sizeIndex];
                                            const opacity = 60 + (sizeIndex * 10);

                                            return (
                                                <span key={desc} className={`font-bold text-primary/90 leading-none ${textSize}`} style={{ opacity: `${opacity}%`}}>
                                                    {desc.toUpperCase()}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )
                            })()
                        ) : <p className="text-sm text-text-light text-center my-auto">No common descriptors were noted by the judges.</p>}
                    </div>
                </section>
                
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="p-4 border border-border rounded-lg h-96">
                         <h3 className="font-bold text-lg mb-2">Sensory Profile vs. Competition Average</h3>
                         <ResponsiveContainer width="100%" height="90%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[6, 10]} />
                                <Radar name="Your Coffee" dataKey="Your Coffee" stroke="#FF7600" fill="#FF7600" fillOpacity={0.6} />
                                <Radar name="Competition Avg." dataKey="Competition Avg." stroke="#111827" fill="#111827" fillOpacity={0.2} />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="p-4 border border-border rounded-lg">
                        <h3 className="font-bold text-lg mb-2">Judge's Voice</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                           <div>
                                <h4 className="font-semibold">Official Feedback from the Head Judge</h4>
                                <p className="italic text-text-light pl-2 border-l-2 border-primary mt-1">"{sample.headJudgeNotes || 'No final notes were provided.'}"</p>
                           </div>
                           {anonymizedNotes.length > 0 && (
                             <div>
                                <h4 className="font-semibold">Anonymized Panel Notes</h4>
                                <div className="space-y-2 mt-1">
                                    {anonymizedNotes.map((note, index) => (
                                        <p key={index} className="text-sm text-text-dark pl-2 border-l-2 border-border"><strong>Judge {String.fromCharCode(65 + index)}:</strong> "{note}"</p>
                                    ))}
                                </div>
                             </div>
                           )}
                        </div>
                    </div>
                </section>
                <section>
                    <ScoreAnalysisSection />
                </section>
            </main>
        </div>
    </div>
  );
};

export default SampleReport;
