import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import styles from './PieChart.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data, title, height = 300 }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: [
          'rgba(255, 152, 0, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(233, 30, 99, 0.8)',
          'rgba(255, 193, 7, 0.8)'
        ],
        borderColor: [
          '#FF9800',
          '#4CAF50',
          '#2196F3',
          '#9C27B0',
          '#E91E63',
          '#FFC107'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '0%'
  };

  return (
    <div className={styles.pieChart}>
      {title && <h3 className={styles.chartTitle}>{title}</h3>}
      <div className={styles.chartWrapper} style={{ height }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PieChart;