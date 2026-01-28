
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const MedicalDashboard: React.FC = () => {
  const heartRateData = [
    { time: '08:00', bpm: 68 }, { time: '10:00', bpm: 72 },
    { time: '12:00', bpm: 88 }, { time: '14:00', bpm: 75 },
    { time: '16:00', bpm: 70 }, { time: '18:00', bpm: 82 },
    { time: '20:00', bpm: 65 },
  ];

  const wellnessData = [
    { subject: 'Sleep', A: 120, fullMark: 150 },
    { subject: 'Hydration', A: 98, fullMark: 150 },
    { subject: 'Diet', A: 86, fullMark: 150 },
    { subject: 'Steps', A: 140, fullMark: 150 },
    { subject: 'Rest', A: 110, fullMark: 150 },
  ];

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Standard Patient Profile</span>
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Vital Metrics <span className="text-blue-600">Overview.</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3 overflow-hidden">
             {[1,2,3].map(i => <img key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-white shadow-sm" src={`https://picsum.photos/seed/${i+10}/40/40`} />)}
             <div className="flex items-center justify-center h-10 w-10 rounded-full ring-4 ring-white bg-slate-100 text-[10px] font-bold text-slate-500">+12</div>
          </div>
          <button className="h-14 px-8 medical-gradient text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-400/30 hover:scale-105 active:scale-95 transition-all">
            <i className="fas fa-bolt mr-3"></i> Analyze Symptoms
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Pulse Rate', value: '72', unit: 'BPM', status: 'optimal', icon: 'fa-heart-pulse', color: 'rose' },
          { label: 'Sleep Efficiency', value: '94', unit: '%', status: 'excellent', icon: 'fa-moon', color: 'indigo' },
          { label: 'Activity Index', value: '8.4', unit: '/10', status: 'high', icon: 'fa-fire', color: 'orange' },
          { label: 'Hydration Level', value: '2.1', unit: 'L', status: 'target reached', icon: 'fa-droplet', color: 'blue' },
        ].map((stat, i) => (
          <div key={i} className="group relative bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50`}></div>
            <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500 flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:bg-white group-hover:shadow-md transition-all`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">{stat.label}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-800">{stat.value}</span>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.unit}</span>
                </div>
                <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 bg-${stat.color}-50 text-${stat.color}-600 rounded-full text-[9px] font-black uppercase tracking-widest`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-${stat.color}-500`}></div>
                    {stat.status}
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
             <div className="flex gap-2">
                <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-expand-alt text-xs"></i></button>
             </div>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Biometric Timeline</h3>
            <p className="text-slate-400 text-sm font-medium">Real-time variability analysis for the last active period.</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={heartRateData}>
                <defs>
                  <linearGradient id="mainGraph" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#cbd5e1" fontSize={12} axisLine={false} tickLine={false} tickMargin={20} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }}
                />
                <Area type="monotone" dataKey="bpm" stroke="#3b82f6" strokeWidth={5} fill="url(#mainGraph)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
               <i className="fas fa-shield-virus text-blue-400"></i>
               Elite Routine
            </h3>
            <div className="space-y-6 relative z-10">
               {[
                 { label: 'Morning Mindfulness', time: '07:30 AM', icon: 'fa-sun', checked: true },
                 { label: 'Hydration Intake 1L', time: '11:00 AM', icon: 'fa-droplet', checked: true },
                 { label: 'Protein Synthesis', time: '01:30 PM', icon: 'fa-bowl-food', checked: false },
                 { label: 'Posture Correction', time: '04:00 PM', icon: 'fa-align-center', checked: false },
               ].map((task, i) => (
                 <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${task.checked ? 'bg-white/10 opacity-60' : 'bg-white/20 border border-white/10'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.checked ? 'bg-emerald-500' : 'bg-white/20'}`}>
                       <i className={`fas ${task.checked ? 'fa-check' : task.icon} text-xs`}></i>
                    </div>
                    <div className="flex-1">
                       <h5 className="text-xs font-black">{task.label}</h5>
                       <p className="text-[10px] text-white/50 font-bold tracking-widest">{task.time}</p>
                    </div>
                 </div>
               ))}
            </div>
            <i className="fas fa-dna absolute -right-12 -bottom-12 text-white/5 text-[200px] rotate-12"></i>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm flex-1">
            <h3 className="text-lg font-black text-slate-900 mb-6">Equilibrium Balance</h3>
            <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={wellnessData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                    <Radar name="Wellness" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalDashboard;
