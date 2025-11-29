import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './GaugeChart.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const GaugeChart = ({ value, max, label, color = '#4CAF50', size = 200 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const data = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [color, '#f0f0f0'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
        cutout: '70%'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  return (
    <div className={styles.gaugeContainer} style={{ width: size, height: size / 2 }}>
      <div className={styles.gaugeChart}>
        <Doughnut data={data} options={options} />
        <div className={styles.gaugeValue}>
          <div className={styles.value}>{Math.round(percentage)}%</div>
          <div className={styles.label}>{label}</div>
          <div className={styles.details}>
            {value.toFixed(0)} / {max.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;