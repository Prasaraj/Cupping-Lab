
import React from 'react';
import { CoffeeSample, CuppingEvent, User } from '../../types';
import { Button } from '../ui/Button';
import { Award, Printer, Star } from 'lucide-react';

// A simple SVG seal for the certificate
const CertificateSeal = () => (
    <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="absolute inset-0">
            <defs>
                <path id="circlePath" d="M 10, 50 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
            </defs>
            <circle cx="50" cy="50" r="48" fill="#f5f0e6" stroke="#b48c5c" strokeWidth="2" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#b48c5c" strokeWidth="1" />
            <text fontFamily="serif" fontSize="9" fill="#8c5a2c" textAnchor="middle">
                <textPath xlinkHref="#circlePath" startOffset="50%">
                    THE CUPPING HUB • OFFICIAL AWARD
                </textPath>
            </text>
             <text x="50" y="58" fontFamily="serif" fontSize="16" textAnchor="middle" fontWeight="bold" fill="#8c5a2c">TCH</text>
        </svg>
        <Star className="absolute text-yellow-600 w-10 h-10" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} fill="currentColor" />
    </div>
);


interface CertificateProps {
  sample: CoffeeSample;
  event: CuppingEvent;
  farmer: User;
  rank: number;
}

const Certificate: React.FC<CertificateProps> = ({ sample, event, farmer, rank }) => {

    const rankText = {
        1: 'First Place Winner',
        2: 'Second Place Finisher',
        3: 'Third Place Finisher',
    }[rank] || `${rank}th Place`;

    const handlePrint = () => {
        window.print();
    };
    
    return (
        <div>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .certificate-print-area, .certificate-print-area * {
                        visibility: visible;
                    }
                    .certificate-print-area {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        height: 100vh;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                }
            `}</style>
            <div id="certificate-content" className="font-serif bg-slate-50 text-gray-800 aspect-[1.414/1] w-full max-w-4xl mx-auto p-4 md:p-8 border-8 border-double border-amber-800/80">
                <div className="w-full h-full border-2 border-amber-700/70 p-4 md:p-8 flex flex-col items-center text-center">
                    <div className="flex items-center space-x-2">
                        <Award className="text-amber-600" size={40} />
                        <h1 className="text-3xl md:text-5xl font-bold tracking-widest text-amber-900/90" style={{ fontFamily: "'Garamond', serif" }}>CERTIFICATE OF ACHIEVEMENT</h1>
                    </div>
                    <p className="mt-4 text-lg md:text-xl">This certificate is proudly presented to</p>
                    
                    <div className="my-4 md:my-6">
                        <p className="text-2xl md:text-4xl font-bold border-b-2 border-amber-700/70 px-4 pb-1">{farmer.name}</p>
                        <p className="text-sm md:text-base mt-1 font-semibold">{sample.farmName}</p>
                    </div>

                    <p className="text-lg md:text-xl">for the outstanding achievement of</p>
                    <p className="text-2xl md:text-4xl font-bold text-primary my-2 md:my-4">{rankText}</p>
                    
                    <p className="text-base md:text-lg">in the <span className="font-semibold">{event.name}</span></p>

                    <p className="mt-2 md:mt-4 text-sm md:text-base">with the coffee submission:</p>
                    <p className="font-semibold text-base md:text-lg">{sample.variety} - {sample.processingMethod} Process</p>
                    <p className="text-sm">Final Score: <span className="font-bold">{sample.adjudicatedFinalScore?.toFixed(2)}</span></p>

                    <div className="flex-grow" />

                    <div className="w-full flex justify-between items-end mt-6 md:mt-12">
                        <div className="text-center">
                            <p className="border-b-2 border-gray-600 px-8 pb-1 font-semibold italic">Alice Organizer</p>
                            <p className="text-sm mt-1">Event Organizer</p>
                        </div>

                        <CertificateSeal />

                        <div className="text-center">
                            <p className="border-b-2 border-gray-600 px-8 pb-1 font-semibold italic">Eve Adjudicator</p>
                            <p className="text-sm mt-1">Head Judge</p>
                        </div>
                    </div>
                </div>
            </div>
             <div className="text-center mt-6 no-print">
                <Button onClick={handlePrint} className="flex items-center space-x-2 mx-auto">
                    <Printer size={16} />
                    <span>Print or Save as PDF</span>
                </Button>
            </div>
        </div>
    );
};

export default Certificate;
