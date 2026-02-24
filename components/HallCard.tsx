import React from 'react';
import { Users, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Hall } from '../types';

interface HallCardProps {
  hall: Hall;
  onBook: (hall: Hall) => void;
}

export const HallCard: React.FC<HallCardProps> = ({ hall, onBook }) => {
  return (
    <div className="group card-glass shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full transform hover:-translate-y-2">
      <div className="relative h-52 overflow-hidden bg-brand-500">
        <span className="hero-initials">{hall.name.substring(0, 2).toUpperCase()}</span>
        <div className="absolute inset-0 bg-accent-900/30 z-10"></div>
        {hall.imageUrl && (
          <img
            src={hall.imageUrl}
            alt={hall.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out opacity-90"
          />
        )}

        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase text-white shadow-lg z-20 border border-white/20">
          {hall.floor}
        </div>
        <div className="absolute bottom-4 left-4 z-20">
          <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors drop-shadow-lg">
            {hall.name}
          </h3>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col pt-5">

        <p className="text-sm text-accent-600 mb-6 line-clamp-2 leading-relaxed font-medium">
          {hall.description}
        </p>

        <div className="flex items-center gap-4 mb-5 text-sm">
          <div className="flex items-center gap-1.5 bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-100/50">
            <Users className="w-4 h-4 text-brand-600" />
            <span className="font-extrabold text-brand-700">{hall.capacity}</span>
            <span className="text-brand-600/70 text-[11px] font-bold uppercase tracking-wider ml-0.5">seats</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {hall.amenities.slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent-50 text-[11px] font-bold text-accent-700 border border-accent-100 transition-colors">
              <CheckCircle2 className="w-3 h-3 mr-1.5 text-accent-500" />
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          <button
            onClick={() => onBook(hall)}
            className="btn-glow w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 px-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 transform hover:-translate-y-0.5"
          >
            Book Space
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};