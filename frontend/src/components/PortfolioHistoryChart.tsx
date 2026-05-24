import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAccountGrowth, getPortfolioGrowth } from '../services/historyService';
import { ChartDataPoint } from '../types/history_chart';

interface Props {
  accountId: number | 'all';
}

export default function PortfolioHistoryChart({ accountId }: Props) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Decisión de servicio según el selector
        const response = accountId === 'all' 
          ? await getPortfolioGrowth() 
          : await getAccountGrowth(accountId);
        
        const formattedData: ChartDataPoint[] = response.history.map((point: any) => {
          const totalValue = parseFloat(point.total_value);
          const capital = parseFloat(point.capital_invertido);
          
          return {
            day: point.date,
            total_value: totalValue,
            capital_invertido: capital,
            profit: totalValue - capital,
            displayDate: new Date(point.date).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
            }),
          };
        });

        setData(formattedData);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [accountId]); // Se recarga cuando cambia el ID de cuenta

  if (loading) return <div className="h-80 flex items-center justify-center text-[#8B8578]">Cargando historial...</div>;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A6FA5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4A6FA5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B0A99C" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#B0A99C" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DED3" />
          
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#8B8578', fontSize: 12 }}
            minTickGap={40}
          />
          
          <YAxis 
            hide={true} 
            domain={['dataMin - 100', 'auto']} 
          />
          
          <Tooltip 
            contentStyle={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5DED3', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#2C2C2C'
            }}
            formatter={(value: number | any) => 
                new Intl.NumberFormat('es-ES', { 
                    style: 'currency', 
                    currency: 'EUR' 
                }).format(value)
            }
          />

          {/* ÁREA 1: Capital Invertido (Línea de base) */}
          <Area
            type="stepAfter"
            dataKey="capital_invertido"
            name="Capital Invertido"
            stroke="#B0A99C"
            strokeWidth={1}
            strokeDasharray="5 5"
            fill="url(#colorCapital)"
            fillOpacity={1}
          />

          {/* ÁREA 2: Valor Total de la Cartera */}
          <Area
            type="monotone"
            dataKey="total_value"
            name="Valor Total"
            stroke="#4A6FA5"
            strokeWidth={3}
            fill="url(#colorValue)"
            fillOpacity={1}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}