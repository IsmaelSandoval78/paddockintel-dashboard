'use client';

import { motion } from 'framer-motion';

interface DriversGridProps {
  initialDrivers: any[];
  dict: {
    points: string;
    position: string;
  };
}

export default function DriversGrid({ initialDrivers, dict }: DriversGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 120 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {initialDrivers.map((driver) => {
        const stats = driver.driver_standings?.[0] || { points: 0, position: 'N/A' };
        
        return (
          <motion.div
            key={driver.driver_id}
            variants={itemVariants}
            whileHover={{ scale: 1.01, borderColor: '#italic', borderLeftColor: '#E10600' }}
            className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col justify-between h-44 relative transition-all duration-200 group"
          >
            <div className="flex justify-between items-start">
              <span className="text-4xl font-black text-zinc-900 group-hover:text-zinc-800 transition-colors">
                #{driver.permanent_number || '00'}
              </span>
              <span className="bg-zinc-900 text-zinc-400 px-2 py-0.5 text-[10px] uppercase tracking-widest border border-zinc-800">
                {driver.code || driver.surname.substring(0, 3).toUpperCase()}
              </span>
            </div>

            <div className="my-2">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-sans">{driver.forename}</p>
              <h3 className="text-lg font-bold uppercase tracking-tight text-zinc-200 group-hover:text-white transition-colors truncate">
                {driver.surname}
              </h3>
            </div>

            <div className="border-t border-zinc-900/80 pt-2 flex justify-between items-center text-[11px]">
              <div>
                <span className="text-zinc-600 block text-[9px] uppercase font-sans">{dict.points}</span>
                <span className="text-emerald-500 font-bold">{stats.points} PTS</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-600 block text-[9px] uppercase font-sans">{dict.position}</span>
                <span className="text-zinc-300 font-bold">P{stats.position}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}