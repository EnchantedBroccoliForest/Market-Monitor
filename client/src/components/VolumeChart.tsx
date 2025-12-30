import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { type Market } from '@shared/schema';

interface VolumeChartProps {
  markets: Market[];
}

export function VolumeChart({ markets }: VolumeChartProps) {
  const data = useMemo(() => {
    const platformVolumes: Record<string, number> = {};
    
    markets.forEach(m => {
      const vol = parseFloat(m.totalVolume || "0");
      const platform = m.platform.charAt(0).toUpperCase() + m.platform.slice(1);
      platformVolumes[platform] = (platformVolumes[platform] || 0) + vol;
    });

    return Object.entries(platformVolumes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [markets]);

  const getBarColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'polymarket': return 'hsl(217 91% 60%)';
      case 'kalshi': return 'hsl(142 71% 45%)';
      case 'limitless': return 'hsl(262 83% 58%)';
      case 'opinion': return 'hsl(10 78% 54%)';
      case 'myriad': return 'hsl(190 90% 50%)';
      default: return 'hsl(217 91% 60%)';
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
