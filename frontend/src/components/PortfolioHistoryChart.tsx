import { useEffect, useState } from 'react';
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import { getPortfolioGrowth } from '../services/historyService';

interface ChartDataPoint {
  day: string;
  total_value: number; 
  displayDate: string;
}

export default function PortfolioHistoryChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getPortfolioGrowth();
        
        // Mapeamos los datos con tipos explícitos
        const formattedData: ChartDataPoint[] = response.history.map(point => ({
          day: point.day,
          total_value: parseFloat(point.total_value),
          displayDate: new Date(point.day).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          }),
        }));

        setData(formattedData);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="text-gray-400">Cargando gráfico...</div>;
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            minTickGap={30}
          />
          <YAxis 
            hide={true} 
            domain={['auto', 'auto']} 
          />
          <Tooltip 
            contentStyle={{ 
                backgroundColor: '#11162A', 
                border: '1px solid #ffffff20', 
                borderRadius: '8px' 
            }}
            itemStyle={{ color: '#8b5cf6' }}
            formatter={(value: number | any) => {
                return [
                new Intl.NumberFormat('es-ES', { 
                    style: 'currency', 
                    currency: 'EUR' 
                }).format(value), 
                'Valor Total'
                ];
            }}
            labelStyle={{ color: '#9ca3af' }}
            />
          <Area
            type="monotone"
            dataKey="total_value"
            stroke="#8b5cf6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}