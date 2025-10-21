import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import styles from './ProgressChart.module.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProgressChart = ({ data, period = 'weekly', type = 'line' }) => {
  if (!data) {
    return (
      <div className={styles.noData}>
        <p>No data available for this period</p>
        <small>Start tracking your meals to see your progress</small>
      </div>
    );
  }

  // Prepare chart data based on period
  const getChartData = () => {
    let labels = [];
    let caloriesData = [];
    let proteinData = [];
    let carbsData = [];
    let fatData = [];
    let targetData = [];

    if (period === 'daily') {
      // Daily view - show hourly or meal-based breakdown
      labels = ['Breakfast', 'Snack', 'Lunch', 'Snack', 'Dinner', 'Evening'];
      caloriesData = data.mealBreakdown?.map(m => m.calories) || [0, 0, 0, 0, 0, 0];
      proteinData = data.mealBreakdown?.map(m => m.protein) || [0, 0, 0, 0, 0, 0];
      carbsData = data.mealBreakdown?.map(m => m.carbs) || [0, 0, 0, 0, 0, 0];
      fatData = data.mealBreakdown?.map(m => m.fat) || [0, 0, 0, 0, 0, 0];
      targetData = new Array(6).fill(data.caloriesTarget / 6);
    } else if (period === 'weekly') {
      // Weekly view - 7 days
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      caloriesData = data.dailyData?.map(d => d.calories) || [0, 0, 0, 0, 0, 0, 0];
      proteinData = data.dailyData?.map(d => d.protein) || [0, 0, 0, 0, 0, 0, 0];
      carbsData = data.dailyData?.map(d => d.carbs) || [0, 0, 0, 0, 0, 0, 0];
      fatData = data.dailyData?.map(d => d.fat) || [0, 0, 0, 0, 0, 0, 0];
      targetData = new Array(7).fill(data.target || 2000);
    } else if (period === 'monthly') {
      // Monthly view - 30 days (simplified to weeks)
      const weeks = Math.ceil((data.monthlyData?.length || 30) / 7);
      labels = Array.from({ length: weeks }, (_, i) => `Week ${i + 1}`);
      
      // Group daily data into weekly averages
      const weeklyAverages = [];
      for (let i = 0; i < weeks; i++) {
        const weekStart = i * 7;
        const weekEnd = Math.min(weekStart + 7, data.monthlyData?.length || 0);
        const weekData = data.monthlyData?.slice(weekStart, weekEnd) || [];
        
        const weekAvg = {
          calories: weekData.reduce((sum, d) => sum + (d.calories || 0), 0) / weekData.length || 0,
          protein: weekData.reduce((sum, d) => sum + (d.protein || 0), 0) / weekData.length || 0,
          carbs: weekData.reduce((sum, d) => sum + (d.carbs || 0), 0) / weekData.length || 0,
          fat: weekData.reduce((sum, d) => sum + (d.fat || 0), 0) / weekData.length || 0
        };
        weeklyAverages.push(weekAvg);
      }
      
      caloriesData = weeklyAverages.map(w => Math.round(w.calories));
      proteinData = weeklyAverages.map(w => Math.round(w.protein));
      carbsData = weeklyAverages.map(w => Math.round(w.carbs));
      fatData = weeklyAverages.map(w => Math.round(w.fat));
      targetData = new Array(weeks).fill(data.target || 2000);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Calories',
          data: caloriesData,
          borderColor: '#4CAF50',
          backgroundColor: type === 'line' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.8)',
          fill: type === 'line',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        },
        {
          label: 'Target',
          data: targetData,
          borderColor: '#FF9800',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false,
          tension: 0,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    };
  };

  // Prepare macros breakdown chart data
  const getMacrosChartData = () => {
    const totals = {
      protein: data.proteinConsumed || 0,
      carbs: data.carbsConsumed || 0,
      fat: data.fatsConsumed || 0
    };

    return {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [
        {
          label: 'Consumed (g)',
          data: [totals.protein, totals.carbs, totals.fat],
          backgroundColor: [
            'rgba(255, 152, 0, 0.8)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(33, 150, 243, 0.8)'
          ],
          borderColor: [
            '#FF9800',
            '#4CAF50',
            '#2196F3'
          ],
          borderWidth: 2
        },
        {
          label: 'Target (g)',
          data: [
            data.proteinTarget || 150,
            data.carbsTarget || 250,
            data.fatsTarget || 65
          ],
          backgroundColor: [
            'rgba(255, 152, 0, 0.2)',
            'rgba(76, 175, 80, 0.2)',
            'rgba(33, 150, 243, 0.2)'
          ],
          borderColor: [
            '#FF9800',
            '#4CAF50',
            '#2196F3'
          ],
          borderWidth: 2,
          borderDash: [5, 5]
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 11,
            weight: '500'
          },
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        cornerRadius: 6,
        titleFont: {
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          size: 11
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += Math.round(context.parsed.y) + ' kcal';
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 10
          },
          padding: 8,
          callback: function(value) {
            return value + ' kcal';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          },
          padding: 5
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const macrosChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y + 'g';
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return value + 'g';
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className={styles.progressChart}>
      <div className={styles.mainChart}>
        <div className={styles.chartWrapper}>
          {type === 'line' ? (
            <Line data={getChartData()} options={chartOptions} />
          ) : (
            <Bar data={getChartData()} options={chartOptions} />
          )}
        </div>
      </div>

      <div className={styles.macrosChart}>
        <h3 className={styles.chartTitle}>Macronutrient Distribution</h3>
        <div className={styles.chartWrapper}>
          <Bar data={getMacrosChartData()} options={macrosChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
