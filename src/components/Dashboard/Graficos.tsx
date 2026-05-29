// Aba de GrÃ¡ficos do Dashboard

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from 'recharts';
import { dadosGraficoMensal, dadosVendasMensal, dadosProdutosMovimentados } from '../../data/seedData';

const estiloEixo = { fill: '#6b7280', fontSize: 11 };
const estiloGrid = { stroke: '#2a2a2a' };
const estiloTooltip = {
  contentStyle: { backgroundColor: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 8 },
  labelStyle: { color: '#fff', fontSize: 12 },
  itemStyle: { fontSize: 12 },
};

export function Graficos() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Entradas vs Vendas */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Entradas vs Vendas (2025)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dadosGraficoMensal} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...estiloGrid} />
            <XAxis dataKey="mes" tick={estiloEixo} axisLine={false} tickLine={false} />
            <YAxis tick={estiloEixo} axisLine={false} tickLine={false} />
            <Tooltip {...estiloTooltip} />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: 11 }}>
                  {value === 'entradas' ? 'Entradas' : 'Vendas'}
                </span>
              )}
            />
            <Bar dataKey="entradas" fill="#2dd4bf" radius={[3, 3, 0, 0]} />
            <Bar dataKey="vendas" fill="#a78bfa" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vendas de Estoque (R$) */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Vendas de Estoque (R$)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dadosVendasMensal} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...estiloGrid} />
            <XAxis dataKey="mes" tick={estiloEixo} axisLine={false} tickLine={false} />
            <YAxis tick={estiloEixo} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              {...estiloTooltip}
              formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Faturamento']}
            />
            <Line
              type="monotone" dataKey="faturamento" stroke="#2dd4bf" strokeWidth={2}
              dot={{ fill: '#2dd4bf', r: 4 }} activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Lucro vs Faturamento */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Lucro vs Faturamento (R$)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dadosVendasMensal} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...estiloGrid} />
            <XAxis dataKey="mes" tick={estiloEixo} axisLine={false} tickLine={false} />
            <YAxis tick={estiloEixo} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              {...estiloTooltip}
              formatter={(v: number, name: string) => [
                `R$ ${v.toLocaleString('pt-BR')}`,
                name === 'faturamento' ? 'Faturamento' : 'Lucro',
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: 11 }}>
                  {value === 'faturamento' ? 'Faturamento' : 'Lucro'}
                </span>
              )}
            />
            <Line
              type="monotone" dataKey="faturamento" stroke="#2dd4bf" strokeWidth={2}
              dot={{ fill: '#2dd4bf', r: 3 }}
            />
            <Line
              type="monotone" dataKey="lucro" stroke="#f59e0b" strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Produtos Mais Movimentados */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Produtos Mais Movimentados (Mensal)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={dadosProdutosMovimentados}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" {...estiloGrid} />
            <XAxis type="number" tick={estiloEixo} axisLine={false} tickLine={false} />
            <YAxis
              type="category" dataKey="nome" tick={{ ...estiloEixo, fontSize: 10 }}
              axisLine={false} tickLine={false} width={90}
            />
            <Tooltip {...estiloTooltip} />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: 11 }}>
                  {value === 'junho' ? 'Jun' : value === 'maio' ? 'Mai' : 'Abr'}
                </span>
              )}
            />
            <Bar dataKey="junho" fill="#2dd4bf" radius={[0, 2, 2, 0]} barSize={6} />
            <Bar dataKey="maio"  fill="#0d9488" radius={[0, 2, 2, 0]} barSize={6} />
            <Bar dataKey="abril" fill="#134e4a" radius={[0, 2, 2, 0]} barSize={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

